import { posSupabase } from './client'
import { getPorcentajes, PORCENTAJE_POR_DEFECTO, type Periodo } from './comisiones'
import { iso, rangoUtc } from './fechas'
import type { MetodoPago } from './cobros'

export interface PuntoDia { fecha: string; total: number }
export interface TotalPorMetodo { metodo: MetodoPago; total: number; n: number }
export interface ServicioTotal { nombre: string; total: number; cantidad: number }
export interface TopBarbero {
  barberoBusinessId: string
  nServicios: number
  facturado: number
  comision: number
}

export interface Reporte {
  /** Lo que factura el local: servicios, sin propinas. */
  facturado: number
  /** Pasan enteras al barbero, no son ingreso del local. */
  propinas: number
  nVentas: number
  comisiones: number
  /** Operativos. Excluye adelantos: esos se descuentan de la comisión, no son gasto. */
  gastos: number
  neto: number
  facturadoPrevio: number
  /** Desglose del facturado por forma de cobro. Los tres suman `facturado`. */
  porMetodo: TotalPorMetodo[]
  porServicio: ServicioTotal[]
  topBarberos: TopBarbero[]
}

export function calcularPeriodoReporte(cual: 'hoy' | 'semana' | 'mes' | 'anio'): Periodo {
  const hoy = new Date()
  const hasta = iso(hoy)
  if (cual === 'hoy') return { desde: hasta, hasta }
  if (cual === 'semana') {
    const d = new Date(hoy)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return { desde: iso(d), hasta }
  }
  if (cual === 'mes') return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta }
  return { desde: iso(new Date(hoy.getFullYear(), 0, 1)), hasta }
}

/** El mismo lapso inmediatamente anterior, para comparar. */
function periodoPrevio(p: Periodo): Periodo {
  const desde = new Date(`${p.desde}T00:00:00`)
  const hasta = new Date(`${p.hasta}T00:00:00`)
  const dias = Math.round((hasta.getTime() - desde.getTime()) / 86400000) + 1
  const finPrevio = new Date(desde); finPrevio.setDate(finPrevio.getDate() - 1)
  const inicioPrevio = new Date(finPrevio); inicioPrevio.setDate(inicioPrevio.getDate() - dias + 1)
  return { desde: iso(inicioPrevio), hasta: iso(finPrevio) }
}

interface VentaFila {
  id: string
  barbero_business_id: string
  subtotal: number
  propina: number
  metodo_pago: MetodoPago
  created_at: string
}

async function traerVentas(businessId: string, p: Periodo): Promise<VentaFila[]> {
  if (!posSupabase) return []
  const { desde, hasta } = rangoUtc(p.desde, p.hasta)
  const { data } = await posSupabase
    .from('pos_ventas')
    .select('id, barbero_business_id, subtotal, propina, metodo_pago, created_at')
    .eq('business_id', businessId)
    .eq('anulada', false)
    .gte('created_at', desde)
    .lte('created_at', hasta)
  return (data ?? []) as VentaFila[]
}

export async function getReporte(
  businessId: string,
  periodo: Periodo,
  barberoIds: string[],
): Promise<Reporte> {
  const previo = periodoPrevio(periodo)
  const rango = rangoUtc(periodo.desde, periodo.hasta)

  const [ventas, ventasPrevias, itemsRes, gastosRes, porcentajes] = await Promise.all([
    traerVentas(businessId, periodo),
    traerVentas(businessId, previo),
    posSupabase
      ? posSupabase
          .from('pos_venta_items')
          .select('nombre, precio, cantidad, venta_id')
          .eq('business_id', businessId)
      : Promise.resolve({ data: [] }),
    posSupabase
      ? posSupabase
          .from('pos_gastos')
          .select('monto, categoria')
          .eq('business_id', businessId)
          .neq('categoria', 'adelanto')
          .gte('created_at', rango.desde)
          .lte('created_at', rango.hasta)
      : Promise.resolve({ data: [] }),
    getPorcentajes(businessId),
  ])

  const facturado = ventas.reduce((s, v) => s + Number(v.subtotal), 0)
  const propinas = ventas.reduce((s, v) => s + Number(v.propina), 0)
  const facturadoPrevio = ventasPrevias.reduce((s, v) => s + Number(v.subtotal), 0)
  const gastos = ((gastosRes.data ?? []) as { monto: number }[]).reduce((s, g) => s + Number(g.monto), 0)

  // Por barbero
  const topBarberos: TopBarbero[] = barberoIds.map(id => {
    const mias = ventas.filter(v => v.barbero_business_id === id)
    const fact = mias.reduce((s, v) => s + Number(v.subtotal), 0)
    const pct = porcentajes[id] ?? PORCENTAJE_POR_DEFECTO
    return {
      barberoBusinessId: id,
      nServicios: mias.length,
      facturado: fact,
      comision: Math.round(fact * pct) / 100,
    }
  }).sort((a, b) => b.facturado - a.facturado)

  const comisiones = topBarberos.reduce((s, b) => s + b.comision, 0)

  // Por servicio: los items se filtran contra las ventas del período en memoria
  // porque pos_venta_items no guarda fecha propia.
  const idsDelPeriodo = new Set(ventas.map(v => v.id))
  const items = ((itemsRes.data ?? []) as { nombre: string; precio: number; cantidad: number; venta_id: string }[])
    .filter(i => idsDelPeriodo.has(i.venta_id))

  const mapa = new Map<string, ServicioTotal>()
  for (const i of items) {
    const prev = mapa.get(i.nombre) ?? { nombre: i.nombre, total: 0, cantidad: 0 }
    prev.total += Number(i.precio) * Number(i.cantidad)
    prev.cantidad += Number(i.cantidad)
    mapa.set(i.nombre, prev)
  }
  const porServicio = [...mapa.values()].sort((a, b) => b.total - a.total)

  // Siempre los tres métodos, aunque alguno esté en cero: una forma de cobro
  // que desaparece de la vista se lee como si no existiera.
  const porMetodo: TotalPorMetodo[] = (['efectivo', 'qr', 'tarjeta'] as MetodoPago[]).map(m => {
    const suyas = ventas.filter(v => v.metodo_pago === m)
    return { metodo: m, total: suyas.reduce((s, v) => s + Number(v.subtotal), 0), n: suyas.length }
  })

  return {
    facturado, propinas, nVentas: ventas.length,
    comisiones, gastos,
    neto: facturado - comisiones - gastos,
    facturadoPrevio, porMetodo, porServicio, topBarberos,
  }
}

/** Facturación por día de los últimos `dias`, incluyendo los días sin ventas. */
export async function getCurvaDiaria(businessId: string, dias = 14): Promise<PuntoDia[]> {
  if (!posSupabase) return []

  const fin = new Date()
  const inicio = new Date(fin)
  inicio.setDate(inicio.getDate() - (dias - 1))

  const { data } = await posSupabase
    .from('pos_ventas')
    .select('subtotal, created_at')
    .eq('business_id', businessId)
    .eq('anulada', false)
    .gte('created_at', rangoUtc(iso(inicio), iso(fin)).desde)
    .lte('created_at', rangoUtc(iso(inicio), iso(fin)).hasta)

  const porDia = new Map<string, number>()
  for (const v of (data ?? []) as { subtotal: number; created_at: string }[]) {
    // Fecha local, no UTC: a las 20:00 en Bolivia UTC ya es el día siguiente.
    const f = iso(new Date(v.created_at))
    porDia.set(f, (porDia.get(f) ?? 0) + Number(v.subtotal))
  }

  // Los días vacíos van en 0: si se omiten, la curva miente sobre el ritmo.
  const puntos: PuntoDia[] = []
  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio)
    d.setDate(d.getDate() + i)
    const f = iso(d)
    puntos.push({ fecha: f, total: porDia.get(f) ?? 0 })
  }
  return puntos
}
