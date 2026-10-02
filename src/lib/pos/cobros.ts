import { posSupabase } from './client'
import { hoyISO } from './fechas'

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
  /** Día de negocio al que pertenece. Puede diferir de created_at. */
  fecha: string
  created_at: string
  cobrado_por: string
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

  const { data, error } = await posSupabase
    .from('pos_ventas')
    .select(`
      id, barbero_business_id, appointment_id, cliente_nombre,
      subtotal, propina, total, metodo_pago, fecha, created_at, cobrado_por, anulada,
      items:pos_venta_items ( service_id, nombre, precio, cantidad )
    `)
    .eq('business_id', businessId)
    .eq('anulada', false)
    // Por `fecha` y no por `created_at`: comparar un date contra 'YYYY-MM-DD'
    // no depende de la zona de la sesión, y respeta el día al que el cobro
    // pertenece aunque se haya registrado otro día.
    .eq('fecha', fecha)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getVentasDelDia]', error)
    return []
  }
  return (data ?? []) as unknown as Venta[]
}

/** Nombre de cada usuario de la caja, para mostrar quién cobró en vez del uuid. */
export async function getNombresUsuarios(businessId: string): Promise<Record<string, string>> {
  if (!posSupabase) return {}
  const { data } = await posSupabase
    .from('pos_usuarios')
    .select('user_id, nombre')
    .eq('business_id', businessId)
  const m: Record<string, string> = {}
  for (const u of (data ?? []) as { user_id: string; nombre: string }[]) m[u.user_id] = u.nombre
  return m
}

/** Total cobrado en una fecha — se usa para comparar hoy contra ayer. */
export async function getTotalDelDia(businessId: string, fecha: string): Promise<number> {
  if (!posSupabase) return 0
  const { data } = await posSupabase
    .from('pos_ventas')
    .select('total')
    .eq('business_id', businessId)
    .eq('anulada', false)
    .eq('fecha', fecha)
  return (data ?? []).reduce((s, v: { total: number }) => s + Number(v.total), 0)
}

/**
 * Lo que debería haber en el cajón: fondo + ventas en efectivo − gastos.
 * Lo calcula Postgres (función pos_efectivo_esperado) para que la caja y el
 * arqueo nunca usen fórmulas distintas.
 */
export async function getEfectivoEsperado(arqueoId: string): Promise<number> {
  if (!posSupabase) return 0
  const { data, error } = await posSupabase.rpc('pos_efectivo_esperado', { p_arqueo_id: arqueoId })
  if (error) {
    console.error('[getEfectivoEsperado]', error)
    return 0
  }
  return Number(data ?? 0)
}

export interface NuevoCobro {
  businessId: string
  arqueoId: string
  /** Día al que pertenece el cobro. Permite cobrar una cita de un día pasado. */
  fecha: string
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
      fecha: c.fecha,
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
    // Sin esto, cualquier fallo se ve igual en pantalla y no hay forma de
    // saber qué constraint saltó.
    console.error('[registrarCobro] venta', error.code, error.message, error.details, error.hint)
    if (error.code === '23505') throw new CitaYaCobradaError()
    throw new ErrorCobro(error.code ?? '', error.message)
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
    console.error('[registrarCobro] items', errItems.code, errItems.message, errItems.details)
    // Sin items la venta queda sin detalle y ensucia los reportes. Se intenta
    // deshacer, pero el borrado puede no tener permiso: si falla, la venta
    // queda huérfana y su cita no se puede volver a cobrar.
    const { error: errBorrado } = await posSupabase.from('pos_ventas').delete().eq('id', ventaId)
    if (errBorrado) console.error('[registrarCobro] no se pudo deshacer la venta', ventaId, errBorrado.message)
    throw new ErrorCobro(errItems.code ?? '', errItems.message)
  }

  return ventaId
}

/** Error con el código de Postgres a la vista, para poder explicarlo en pantalla. */
export class ErrorCobro extends Error {
  codigo: string

  constructor(codigo: string, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorCobro'
    this.codigo = codigo
  }

  /** Texto para la cajera según el constraint que haya saltado. */
  get explicacion(): string {
    switch (this.codigo) {
      case '23503':
        return 'Falta un dato relacionado (la caja del día, el barbero o la cita). Actualizá la pantalla e intentá de nuevo.'
      case '23514':
        return 'Hay un monto o un método de pago inválido.'
      case '42501':
        return 'Tu cuenta no tiene permiso para registrar cobros en este negocio.'
      default:
        return 'No se pudo registrar el cobro. Revisá la conexión e intentá de nuevo.'
    }
  }
}
