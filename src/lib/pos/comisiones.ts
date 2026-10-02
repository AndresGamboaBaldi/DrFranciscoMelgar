import { posSupabase } from './client'
import { iso, rangoUtc } from './fechas'

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
  cerrada_at: string
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
  aPagar: number
  liquidacion: Liquidacion | null
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

  // Instantes UTC de la medianoche local: con literales sin offset, Postgres
  // los lee en UTC y la ventana queda corrida cuatro horas.
  const { desde: desdeTs, hasta: hastaTs } = rangoUtc(periodo.desde, periodo.hasta)

  const [ventasRes, gastosRes, liqRes, porcentajes] = await Promise.all([
    posSupabase
      .from('pos_ventas')
      .select('barbero_business_id, subtotal, propina')
      .eq('business_id', businessId)
      .eq('anulada', false)
      .gte('created_at', desdeTs)
      .lte('created_at', hastaTs),
    posSupabase
      .from('pos_gastos')
      .select('barbero_business_id, monto')
      .eq('business_id', businessId)
      .eq('categoria', 'adelanto')
      .gte('created_at', desdeTs)
      .lte('created_at', hastaTs),
    posSupabase
      .from('pos_liquidaciones')
      .select('id, barbero_business_id, desde, hasta, producido, porcentaje, comision, adelantos, a_pagar, cerrada_at')
      .eq('business_id', businessId)
      .eq('desde', periodo.desde)
      .eq('hasta', periodo.hasta),
    getPorcentajes(businessId),
  ])

  const ventas = (ventasRes.data ?? []) as { barbero_business_id: string; subtotal: number; propina: number }[]
  const gastos = (gastosRes.data ?? []) as { barbero_business_id: string | null; monto: number }[]
  const liquidaciones = (liqRes.data ?? []) as Liquidacion[]

  return barberoIds.map(id => {
    const mias = ventas.filter(v => v.barbero_business_id === id)
    const facturado = mias.reduce((s, v) => s + Number(v.subtotal), 0)
    const propinas = mias.reduce((s, v) => s + Number(v.propina), 0)
    const adelantos = gastos.filter(g => g.barbero_business_id === id).reduce((s, g) => s + Number(g.monto), 0)
    const porcentaje = porcentajes[id] ?? PORCENTAJE_POR_DEFECTO
    const comision = Math.round(facturado * porcentaje) / 100

    return {
      barberoBusinessId: id,
      nServicios: mias.length,
      facturado,
      propinas,
      porcentaje,
      comision,
      adelantos,
      aPagar: comision + propinas - adelantos,
      liquidacion: liquidaciones.find(l => l.barbero_business_id === id) ?? null,
    }
  })
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
