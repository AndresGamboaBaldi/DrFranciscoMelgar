import { posSupabase } from './client'
import { hoyISO } from '../../pages/caja/cajaTheme'

export type MetodoPago = 'efectivo' | 'qr' | 'tarjeta'

export const METODOS: { id: MetodoPago; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'qr',       label: 'QR / Transferencia' },
  { id: 'tarjeta',  label: 'Tarjeta' },
]

export interface VentaItem {
  service_id: string | null
  nombre: string
  precio: number
  cantidad: number
}

export interface Venta {
  id: string
  barbero_business_id: string
  appointment_id: string | null
  cliente_nombre: string | null
  subtotal: number
  propina: number
  total: number
  metodo_pago: MetodoPago
  created_at: string
  anulada: boolean
  items: VentaItem[]
}

export interface Arqueo {
  id: string
  fecha: string
  fondo_inicial: number
  estado: 'abierto' | 'cerrado'
}

/**
 * Devuelve el arqueo abierto del negocio, creándolo si no existe.
 *
 * Todavía no hay pantalla de apertura de caja, así que el fondo arranca en 0
 * y se abre solo con el primer cobro del día. Cuando exista el arqueo formal,
 * esto pasa a ser el respaldo para cuando alguien cobra sin haber abierto.
 */
export async function getOAbrirArqueo(businessId: string, userId: string): Promise<Arqueo | null> {
  if (!posSupabase) return null

  const { data: abierto } = await posSupabase
    .from('pos_arqueos')
    .select('id, fecha, fondo_inicial, estado')
    .eq('business_id', businessId)
    .eq('estado', 'abierto')
    .maybeSingle()

  if (abierto) return abierto as Arqueo

  const { data: nuevo, error } = await posSupabase
    .from('pos_arqueos')
    .insert([{ business_id: businessId, fondo_inicial: 0, abierto_por: userId }])
    .select('id, fecha, fondo_inicial, estado')
    .single()

  if (error) {
    // Carrera con otra pestaña: el índice único dejó pasar solo una.
    // Volvemos a leer en vez de propagar el error.
    const { data: reintento } = await posSupabase
      .from('pos_arqueos')
      .select('id, fecha, fondo_inicial, estado')
      .eq('business_id', businessId)
      .eq('estado', 'abierto')
      .maybeSingle()
    return (reintento as Arqueo) ?? null
  }

  return nuevo as Arqueo
}

/** Ventas no anuladas de una fecha, con sus items. */
export async function getVentasDelDia(businessId: string, fecha = hoyISO()): Promise<Venta[]> {
  if (!posSupabase) return []

  const desde = `${fecha}T00:00:00`
  const hasta = `${fecha}T23:59:59.999`

  const { data, error } = await posSupabase
    .from('pos_ventas')
    .select(`
      id, barbero_business_id, appointment_id, cliente_nombre,
      subtotal, propina, total, metodo_pago, created_at, anulada,
      items:pos_venta_items ( service_id, nombre, precio, cantidad )
    `)
    .eq('business_id', businessId)
    .eq('anulada', false)
    .gte('created_at', desde)
    .lte('created_at', hasta)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getVentasDelDia]', error)
    return []
  }
  return (data ?? []) as unknown as Venta[]
}

/** Total cobrado en una fecha — se usa para comparar hoy contra ayer. */
export async function getTotalDelDia(businessId: string, fecha: string): Promise<number> {
  if (!posSupabase) return 0
  const { data } = await posSupabase
    .from('pos_ventas')
    .select('total')
    .eq('business_id', businessId)
    .eq('anulada', false)
    .gte('created_at', `${fecha}T00:00:00`)
    .lte('created_at', `${fecha}T23:59:59.999`)
  return (data ?? []).reduce((s, v: { total: number }) => s + Number(v.total), 0)
}

export interface NuevoCobro {
  businessId: string
  arqueoId: string
  barberoBusinessId: string
  appointmentId?: string | null
  clienteNombre?: string | null
  items: VentaItem[]
  propina: number
  metodoPago: MetodoPago
  cobradoPor: string
}

/** El slot ya fue cobrado — lo lanza el índice único sobre appointment_id. */
export class CitaYaCobradaError extends Error {
  constructor() {
    super('cita-ya-cobrada')
    this.name = 'CitaYaCobradaError'
  }
}

export async function registrarCobro(c: NuevoCobro): Promise<string> {
  if (!posSupabase) throw new Error('Supabase no está configurado')

  const subtotal = c.items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const total = subtotal + c.propina

  const { data: venta, error } = await posSupabase
    .from('pos_ventas')
    .insert([{
      business_id: c.businessId,
      arqueo_id: c.arqueoId,
      barbero_business_id: c.barberoBusinessId,
      appointment_id: c.appointmentId ?? null,
      cliente_nombre: c.clienteNombre ?? null,
      subtotal,
      propina: c.propina,
      total,
      metodo_pago: c.metodoPago,
      cobrado_por: c.cobradoPor,
    }])
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') throw new CitaYaCobradaError()
    throw new Error(error.message)
  }

  const ventaId = (venta as { id: string }).id

  const { error: errItems } = await posSupabase
    .from('pos_venta_items')
    .insert(c.items.map(i => ({
      venta_id: ventaId,
      business_id: c.businessId,
      service_id: i.service_id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
    })))

  if (errItems) {
    // Sin items la venta queda sin detalle y ensucia los reportes.
    // Preferimos deshacerla y que la cajera la vuelva a cargar.
    await posSupabase.from('pos_ventas').delete().eq('id', ventaId)
    throw new Error(errItems.message)
  }

  return ventaId
}
