/**
 * Arqueo de caja: abrir el turno con un fondo, registrar los gastos de caja
 * menor y cerrarlo contando físicamente la gaveta.
 *
 * El efectivo esperado lo calcula Postgres (pos_efectivo_esperado) para que la
 * pantalla y el cierre nunca usen fórmulas distintas.
 */

import { posSupabase } from './client'
import { hoyISO } from './fechas'
import type { MetodoPago } from './cobros'

/**
 * Categorías de gasto que se ofrecen en la caja.
 *
 * 'adelanto' existe en la base pero NO se ofrece acá: lo que se le adelanta a
 * un barbero se registra liquidando un tramo en la pestaña Comisiones, no como
 * gasto del local. Si entrara por acá se restaría dos veces.
 */
export type CategoriaGasto = 'insumos' | 'servicios' | 'delivery' | 'otro'

export const CATEGORIAS: { id: CategoriaGasto; label: string }[] = [
  { id: 'insumos',   label: 'Insumos' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'delivery',  label: 'Delivery' },
  { id: 'otro',      label: 'Otro' },
]

export interface ArqueoDetalle {
  id: string
  fecha: string
  estado: 'abierto' | 'cerrado'
  fondo_inicial: number
  abierto_por: string
  abierto_at: string
  efectivo_contado: number | null
  efectivo_esperado: number | null
  diferencia: number | null
  nota_cierre: string | null
  cerrado_por: string | null
  cerrado_at: string | null
}

export interface Gasto {
  id: string
  concepto: string
  categoria: string
  monto: number
  registrado_por: string
  created_at: string
}

export interface MovimientoTurno {
  nVentas: number
  total: number
  porMetodo: Record<MetodoPago, { total: number; n: number }>
}

const CAMPOS = `
  id, fecha, estado, fondo_inicial, abierto_por, abierto_at,
  efectivo_contado, efectivo_esperado, diferencia, nota_cierre,
  cerrado_por, cerrado_at
`

export async function getArqueoAbierto(businessId: string): Promise<ArqueoDetalle | null> {
  if (!posSupabase) return null
  const { data } = await posSupabase
    .from('pos_arqueos')
    .select(CAMPOS)
    .eq('business_id', businessId)
    .eq('estado', 'abierto')
    .maybeSingle()
  return (data as ArqueoDetalle) ?? null
}

/** El último turno cerrado, para mostrar con qué quedó la caja anoche. */
export async function getUltimoCerrado(businessId: string): Promise<ArqueoDetalle | null> {
  if (!posSupabase) return null
  const { data } = await posSupabase
    .from('pos_arqueos')
    .select(CAMPOS)
    .eq('business_id', businessId)
    .eq('estado', 'cerrado')
    .order('cerrado_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ArqueoDetalle) ?? null
}

/** Ya hay un turno abierto — lo lanza el índice único parcial del negocio. */
export class CajaYaAbiertaError extends Error {
  constructor() {
    super('caja-ya-abierta')
    this.name = 'CajaYaAbiertaError'
  }
}

export async function abrirArqueo(
  businessId: string,
  userId: string,
  fondoInicial: number,
): Promise<ArqueoDetalle> {
  if (!posSupabase) throw new Error('Supabase no está configurado')

  const { data, error } = await posSupabase
    .from('pos_arqueos')
    .insert([{
      business_id: businessId,
      // Explícita: el default es current_date, que en Supabase es UTC y a
      // partir de las 20:00 en Bolivia ya marca el día siguiente.
      fecha: hoyISO(),
      fondo_inicial: fondoInicial,
      abierto_por: userId,
    }])
    .select(CAMPOS)
    .single()

  if (error) {
    console.error('[abrirArqueo]', error.code, error.message)
    if (error.code === '23505') throw new CajaYaAbiertaError()
    throw new Error(error.message)
  }
  return data as ArqueoDetalle
}

/** Corregir el fondo mientras el turno sigue abierto. */
export async function setFondoInicial(arqueoId: string, monto: number): Promise<void> {
  if (!posSupabase) return
  const { error } = await posSupabase
    .from('pos_arqueos')
    .update({ fondo_inicial: monto })
    .eq('id', arqueoId)
  if (error) throw new Error(error.message)
}

/** Lo cobrado dentro de este turno, separado por forma de pago. */
export async function getMovimiento(arqueoId: string): Promise<MovimientoTurno> {
  const vacio = (): MovimientoTurno => ({
    nVentas: 0, total: 0,
    porMetodo: { efectivo: { total: 0, n: 0 }, qr: { total: 0, n: 0 }, tarjeta: { total: 0, n: 0 } },
  })
  if (!posSupabase) return vacio()

  const { data } = await posSupabase
    .from('pos_ventas')
    .select('total, metodo_pago')
    .eq('arqueo_id', arqueoId)
    .eq('anulada', false)

  const m = vacio()
  for (const v of (data ?? []) as { total: number; metodo_pago: MetodoPago }[]) {
    const t = Number(v.total)
    m.nVentas += 1
    m.total += t
    m.porMetodo[v.metodo_pago].total += t
    m.porMetodo[v.metodo_pago].n += 1
  }
  return m
}

export async function getGastos(arqueoId: string): Promise<Gasto[]> {
  if (!posSupabase) return []
  const { data } = await posSupabase
    .from('pos_gastos')
    .select('id, concepto, categoria, monto, registrado_por, created_at')
    .eq('arqueo_id', arqueoId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Gasto[]
}

export async function registrarGasto(g: {
  businessId: string
  arqueoId: string
  concepto: string
  categoria: CategoriaGasto
  monto: number
  userId: string
}): Promise<void> {
  if (!posSupabase) throw new Error('Supabase no está configurado')
  const { error } = await posSupabase
    .from('pos_gastos')
    .insert([{
      business_id: g.businessId,
      arqueo_id: g.arqueoId,
      fecha: hoyISO(),
      concepto: g.concepto.trim(),
      categoria: g.categoria,
      monto: g.monto,
      registrado_por: g.userId,
    }])
  if (error) {
    console.error('[registrarGasto]', error.code, error.message)
    throw new Error(error.message)
  }
}

export async function borrarGasto(id: string): Promise<void> {
  if (!posSupabase) return
  const { error } = await posSupabase.from('pos_gastos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Cierra el turno congelando el esperado y la diferencia.
 *
 * Se congelan a propósito: si mañana se corrige una venta vieja o cambia el
 * fondo, el arqueo firmado de hoy no se puede mover.
 */
export async function cerrarArqueo(a: {
  arqueoId: string
  contado: number
  esperado: number
  nota: string
  userId: string
}): Promise<void> {
  if (!posSupabase) throw new Error('Supabase no está configurado')
  const { error } = await posSupabase
    .from('pos_arqueos')
    .update({
      estado: 'cerrado',
      efectivo_contado: a.contado,
      efectivo_esperado: a.esperado,
      diferencia: Math.round((a.contado - a.esperado) * 100) / 100,
      nota_cierre: a.nota.trim() || null,
      cerrado_por: a.userId,
      cerrado_at: new Date().toISOString(),
    })
    .eq('id', a.arqueoId)
    .eq('estado', 'abierto')   // no re-cerrar uno ya cerrado desde otra pestaña

  if (error) {
    console.error('[cerrarArqueo]', error.code, error.message)
    throw new Error(error.message)
  }
}
