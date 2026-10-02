import { posSupabase } from './client'
import { iso } from './fechas'

/** Porcentaje que se aplica cuando el barbero no tiene uno configurado. */
export const PORCENTAJE_POR_DEFECTO = 50

export interface Liquidacion {
  id: string
  barbero_business_id: string
  desde: string
  hasta: string
  producido: number
  porcentaje: number
  comision: number
  adelantos: number
  a_pagar: number
  cerrada_por: string
  cerrada_at: string
}

export interface Adelanto {
  id: string
  barbero_business_id: string
  monto: number
  concepto: string
  fecha: string
  registrado_por: string
  created_at: string
}

export interface ResumenBarbero {
  barberoBusinessId: string
  nServicios: number
  /** Solo servicios, sin propina: la comisión no se calcula sobre la propina. */
  facturado: number
  /** Van enteras al barbero, no entran en el reparto. */
  propinas: number
  porcentaje: number
  comision: number
  adelantos: number
  detalleAdelantos: Adelanto[]
  /** comisión + propinas − adelantos, antes de descontar lo ya liquidado. */
  aPagarBruto: number
  /** Suma de las liquidaciones ya cerradas dentro del período. */
  yaLiquidado: number
  /** Lo que queda por entregar. */
  aPagar: number
  liquidaciones: Liquidacion[]
}

export interface Periodo { desde: string; hasta: string }

/** Hoy, la semana (desde el lunes) o el mes, siempre hasta hoy. */
export function calcularPeriodo(cual: 'hoy' | 'semana' | 'mes'): Periodo {
  const hoy = new Date()
  const hasta = iso(hoy)
  if (cual === 'hoy') return { desde: hasta, hasta }
  if (cual === 'semana') {
    const d = new Date(hoy)
    // getDay(): 0 es domingo. La semana laboral arranca el lunes.
    const diasDesdeLunes = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - diasDesdeLunes)
    return { desde: iso(d), hasta }
  }
  return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta }
}

export async function getPorcentajes(businessId: string): Promise<Record<string, number>> {
  if (!posSupabase) return {}
  const { data } = await posSupabase
    .from('pos_comision_config')
    .select('barbero_business_id, porcentaje')
    .eq('business_id', businessId)
  const m: Record<string, number> = {}
  for (const r of (data ?? []) as { barbero_business_id: string; porcentaje: number }[]) {
    m[r.barbero_business_id] = Number(r.porcentaje)
  }
  return m
}

export async function guardarPorcentaje(
  businessId: string,
  barberoBusinessId: string,
  porcentaje: number,
): Promise<void> {
  if (!posSupabase) throw new Error('Supabase no está configurado')
  const { error } = await posSupabase
    .from('pos_comision_config')
    .upsert(
      [{ business_id: businessId, barbero_business_id: barberoBusinessId, porcentaje, updated_at: new Date().toISOString() }],
      { onConflict: 'business_id,barbero_business_id' },
    )
  if (error) throw new Error(error.message)
}

/**
 * Lo que produjo cada barbero en el período y cuánto le toca.
 *
 * Reglas: la comisión se calcula sobre los servicios, las propinas van enteras
 * al barbero, y los adelantos que se le dieron se descuentan.
 */
export async function getResumen(
  businessId: string,
  periodo: Periodo,
  barberoIds: string[],
): Promise<ResumenBarbero[]> {
  if (!posSupabase) return []

  const [ventasRes, gastosRes, liqRes, porcentajes] = await Promise.all([
    posSupabase
      .from('pos_ventas')
      .select('barbero_business_id, subtotal, propina')
      .eq('business_id', businessId)
      .eq('anulada', false)
      .gte('fecha', periodo.desde)
      .lte('fecha', periodo.hasta),
    posSupabase
      .from('pos_gastos')
      .select('id, barbero_business_id, monto, concepto, fecha, registrado_por, created_at')
      .eq('business_id', businessId)
      .eq('categoria', 'adelanto')
      .gte('fecha', periodo.desde)
      .lte('fecha', periodo.hasta),
    posSupabase
      .from('pos_liquidaciones')
      .select('id, barbero_business_id, desde, hasta, producido, porcentaje, comision, adelantos, a_pagar, cerrada_por, cerrada_at')
      .eq('business_id', businessId)
      // Contenidas en el período, no coincidencia exacta: si liquidaste "hoy"
      // y después mirás "semana", eso ya pagado tiene que descontarse o se
      // paga dos veces.
      .gte('desde', periodo.desde)
      .lte('hasta', periodo.hasta),
    getPorcentajes(businessId),
  ])

  const ventas = (ventasRes.data ?? []) as { barbero_business_id: string; subtotal: number; propina: number }[]
  const gastos = (gastosRes.data ?? []) as Adelanto[]
  const liquidaciones = (liqRes.data ?? []) as Liquidacion[]

  return barberoIds.map(id => {
    const mias = ventas.filter(v => v.barbero_business_id === id)
    const facturado = mias.reduce((s, v) => s + Number(v.subtotal), 0)
    const propinas = mias.reduce((s, v) => s + Number(v.propina), 0)
    const detalleAdelantos = gastos.filter(g => g.barbero_business_id === id)
    const adelantos = detalleAdelantos.reduce((s, g) => s + Number(g.monto), 0)
    const porcentaje = porcentajes[id] ?? PORCENTAJE_POR_DEFECTO
    const comision = Math.round(facturado * porcentaje) / 100

    const suyas = liquidaciones.filter(l => l.barbero_business_id === id)
    const yaLiquidado = suyas.reduce((s, l) => s + Number(l.a_pagar), 0)
    const aPagarBruto = comision + propinas - adelantos

    return {
      barberoBusinessId: id,
      nServicios: mias.length,
      facturado,
      propinas,
      porcentaje,
      comision,
      adelantos,
      detalleAdelantos,
      aPagarBruto,
      yaLiquidado,
      aPagar: aPagarBruto - yaLiquidado,
      liquidaciones: suyas,
    }
  })
}

/**
 * Registra plata entregada al barbero a cuenta de su comisión.
 *
 * Va a `pos_gastos` con categoria='adelanto' y el barbero asignado: sale de la
 * caja del día y se descuenta solo de su liquidación. No es gasto operativo,
 * por eso los reportes lo excluyen — contarlo ahí sería contarlo dos veces.
 */
export async function registrarAdelanto(p: {
  businessId: string
  arqueoId: string
  barberoBusinessId: string
  monto: number
  fecha: string
  concepto: string
  registradoPor: string
}): Promise<void> {
  if (!posSupabase) throw new Error('Supabase no está configurado')
  const { error } = await posSupabase.from('pos_gastos').insert([{
    business_id: p.businessId,
    arqueo_id: p.arqueoId,
    categoria: 'adelanto',
    barbero_business_id: p.barberoBusinessId,
    monto: p.monto,
    fecha: p.fecha,
    concepto: p.concepto || 'Adelanto de comisión',
    registrado_por: p.registradoPor,
  }])
  if (error) {
    console.error('[registrarAdelanto]', error.code, error.message, error.details)
    throw new Error(error.message)
  }
}

/** Ya existe una liquidación para ese barbero y período. */
export class YaLiquidadoError extends Error {
  constructor() {
    super('ya-liquidado')
    this.name = 'YaLiquidadoError'
  }
}

/**
 * Cierra la liquidación congelando los importes del momento. Si después se
 * corrige una venta vieja o cambia el porcentaje, lo ya pagado no se mueve.
 */
export async function liquidar(
  businessId: string,
  periodo: Periodo,
  r: ResumenBarbero,
  userId: string,
): Promise<void> {
  if (!posSupabase) throw new Error('Supabase no está configurado')
  const { error } = await posSupabase.from('pos_liquidaciones').insert([{
    business_id: businessId,
    barbero_business_id: r.barberoBusinessId,
    desde: periodo.desde,
    hasta: periodo.hasta,
    producido: r.facturado,
    porcentaje: r.porcentaje,
    comision: r.comision,
    adelantos: r.adelantos,
    a_pagar: r.aPagar,
    cerrada_por: userId,
  }])
  if (error) {
    if (error.code === '23505') throw new YaLiquidadoError()
    throw new Error(error.message)
  }
}
