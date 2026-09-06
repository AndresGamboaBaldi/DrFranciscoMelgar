import { createClient } from '@supabase/supabase-js'
import type { Appointment } from '../types/booking'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/** Rejects after `ms` if `promise` hasn't settled — avoids requests hanging forever on flaky networks. */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

// ─────────────────────────────────────────────────────────────
//  ADMIN WRITE — via Edge Function (bypasses RLS with service role)
// ─────────────────────────────────────────────────────────────

async function adminWrite(payload: Record<string, unknown>): Promise<void> {
  const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
  const res = await fetch(`${FUNCTIONS_URL}/admin-write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `admin-write failed (${res.status})`)
  }
}

// ─────────────────────────────────────────────────────────────
//  APPOINTMENTS
// ─────────────────────────────────────────────────────────────

/**
 * El slot ya estaba ocupado cuando se intentó insertar la cita.
 * Lo lanza `createAppointment` cuando Postgres rechaza el INSERT por el
 * constraint `appointments_no_overlap` (dos clientes reservando a la vez).
 */
export class SlotTakenError extends Error {
  constructor() {
    super('slot-taken')
    this.name = 'SlotTakenError'
  }
}

/** 23P01 = exclusion_violation, 23505 = unique_violation */
const CONFLICT_CODES = new Set(['23P01', '23505'])

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'created_at' | 'status'> & {
    duration_mins?: number
    setup_url?: string
    initialStatus?: 'pending' | 'pending_payment'
  },
) {
  if (!supabase) {
    console.warn('[Supabase] not configured')
    return null
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setup_url, initialStatus, ...dbData } = data
  const { error } = await supabase
    .from('appointments')
    .insert([{ ...dbData, status: initialStatus ?? 'pending' }])
  if (error) {
    // La DB rechaza el solapamiento de forma atómica — es la única defensa
    // real contra dos clientes reservando el mismo horario a la vez.
    if (CONFLICT_CODES.has(error.code)) throw new SlotTakenError()
    throw error
  }

  // Fire-and-forget push notification — non-blocking
  if (data.business_id) {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
    const FUNCTIONS_URL = import.meta.env.DEV
      ? 'http://127.0.0.1:54321/functions/v1'
      : `${SUPABASE_URL}/functions/v1`
    const MONTHS = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ]
    const [y, mo, d] = data.appointment_date.split('-').map(Number)
    const currentYear = new Date().getFullYear()
    const dateLabel = `${d} de ${MONTHS[mo - 1]}${y !== currentYear ? ` de ${y}` : ''}`
    const body = `${data.name} reservó ${data.service} el ${dateLabel} a las ${data.appointment_time}`
    fetch(`${FUNCTIONS_URL}/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: data.business_id,
        title: '📅 Nueva Cita',
        body,
        url: setup_url ?? `/${data.business_id}/setup`,
      }),
    }).catch(() => {}) // silently ignore errors
  }

  return null
}

function expandBookedSlots(
  rows: { appointment_time: string; duration_mins: number | null }[],
  slotDuration: number,
): string[] {
  const blocked = new Set<string>()
  for (const r of rows) {
    // Normalize "HH:MM:SS" → "HH:MM"
    const [h, m] = r.appointment_time.substring(0, 5).split(':').map(Number)
    const startMins = h * 60 + m
    const totalMins = r.duration_mins ?? slotDuration
    for (let offset = 0; offset < totalMins; offset += slotDuration) {
      const t = startMins + offset
      blocked.add(
        `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`,
      )
    }
  }
  return [...blocked]
}

export async function getBookedSlots(
  date: string,
  businessId: string,
  slotDuration = 30,
): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration_mins')
    .eq('appointment_date', date)
    .eq('business_id', businessId)
    .in('status', ['pending', 'pending_payment', 'confirmed'])
  if (error) {
    // duration_mins column may not exist yet — fall back to blocking only start time
    const { data: fallback } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .eq('business_id', businessId)
      .in('status', ['pending', 'pending_payment', 'confirmed'])
    return (fallback ?? []).map((r: { appointment_time: string }) =>
      r.appointment_time.substring(0, 5),
    )
  }
  return expandBookedSlots(data ?? [], slotDuration)
}


export async function getAppointmentsByDate(
  businessId: string | string[],
  date: string,
): Promise<Appointment[]> {
  if (!supabase) return []
  const ids = Array.isArray(businessId) ? businessId : [businessId]
  const { data, error } = await supabase
    .from('appointments')
    .select('id, name, phone, service, appointment_date, appointment_time, notes, status, business_id')
    .in('business_id', ids)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .order('appointment_time', { ascending: true })
  if (error) {
    console.error('[getAppointmentsByDate]', error)
    return []
  }
  return (data ?? []) as Appointment[]
}

export async function getAppointmentsByDateRange(
  businessId: string | string[],
  startDate: string,
  endDate: string,
): Promise<Appointment[]> {
  if (!supabase) return []
  const ids = Array.isArray(businessId) ? businessId : [businessId]
  const { data, error } = await supabase
    .from('appointments')
    .select('id, name, phone, service, appointment_date, appointment_time, notes, status, business_id')
    .in('business_id', ids)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .neq('status', 'cancelled')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
  if (error) {
    console.error('[getAppointmentsByDateRange]', error)
    return []
  }
  return (data ?? []) as Appointment[]
}

export async function saveStaffHidden(businessId: string, hidden: boolean): Promise<void> {
  await adminWrite({ action: 'save-hidden', business_id: businessId, hidden })
}

export async function saveScheduleLocked(businessId: string, locked: boolean): Promise<void> {
  await adminWrite({ action: 'save-schedule-locked', business_id: businessId, locked })
}

/**
 * Devuelve un mapa businessId → locked. El candado está prendido por defecto:
 * una fila sin `schedule_locked = false` (o inexistente) se considera bloqueada.
 * Solo aplica a barberos dentro de una agencia; los profesionales independientes
 * nunca leen este valor.
 */
export async function getScheduleLockedMap(businessIds: string[]): Promise<Record<string, boolean>> {
  const map: Record<string, boolean> = {}
  businessIds.forEach(id => { map[id] = true })
  if (!supabase || !businessIds.length) return map
  const { data } = await supabase
    .from('schedule_settings')
    .select('business_id, schedule_locked')
    .in('business_id', businessIds)
  ;(data ?? []).forEach((r: { business_id: string; schedule_locked: boolean | null }) => {
    map[r.business_id] = r.schedule_locked !== false
  })
  return map
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('appointments')
    .select('id, name, service, appointment_date, appointment_time, business_id, status')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Appointment
}

export async function cancelAppointment(id: string, notify = true): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')

  // Fetch appointment details first so we can notify the professional
  const apt = notify ? await getAppointmentById(id) : null

  const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)

  // Fire-and-forget push notification — non-blocking
  if (apt?.business_id) {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
    const FUNCTIONS_URL = import.meta.env.DEV
      ? 'http://127.0.0.1:54321/functions/v1'
      : `${SUPABASE_URL}/functions/v1`
    const MONTHS = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ]
    const [y, mo, d] = apt.appointment_date.split('-').map(Number)
    const currentYear = new Date().getFullYear()
    const dateLabel = `${d} de ${MONTHS[mo - 1]}${y !== currentYear ? ` de ${y}` : ''}`
    const body = `${apt.name} canceló ${apt.service} el ${dateLabel} a las ${apt.appointment_time}`
    fetch(`${FUNCTIONS_URL}/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: apt.business_id,
        title: '❌ Cita cancelada',
        body,
        url: `/${apt.business_id}/setup`,
      }),
    }).catch(() => {})
  }
}

// ─────────────────────────────────────────────────────────────
//  BLOCKED SLOTS
// ─────────────────────────────────────────────────────────────

export interface BlockedSlot {
  id: string
  business_id: string
  date: string
  start_time: string | null
  end_time: string | null
  reason?: string | null
  created_at?: string
}

// Short-lived in-memory cache so re-fetching the same data (e.g. when the
// booking dialog moves from step 2 to step 3) doesn't show a loading spinner.
const CACHE_TTL = 30_000
const monthBlocksCache = new Map<string, Promise<BlockedSlot[]>>()

export function prefetchMonthBlocks(businessId: string, year: number, month: number) {
  getMonthBlocks(businessId, year, month)
}

export async function getMonthBlocks(
  businessId: string,
  year: number,
  month: number,
): Promise<BlockedSlot[]> {
  if (!supabase) return []
  const key = `${businessId}:${year}-${month}`
  const cached = monthBlocksCache.get(key)
  if (cached) return cached

  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
  const promise = supabase
    .from('blocked_slots')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', from)
    .lte('date', to)
    .then(({ data }) => (data ?? []) as BlockedSlot[]) as Promise<BlockedSlot[]>

  monthBlocksCache.set(key, promise)
  setTimeout(() => monthBlocksCache.delete(key), CACHE_TTL)
  return promise
}

export async function addBlock(block: Omit<BlockedSlot, 'id' | 'created_at'>): Promise<void> {
  await adminWrite({ action: 'add-block', business_id: block.business_id, block })
}

export async function addBlocks(blocks: Omit<BlockedSlot, 'id' | 'created_at'>[]): Promise<void> {
  if (!blocks.length) return
  await adminWrite({ action: 'add-blocks', business_id: blocks[0].business_id, blocks })
}

export async function deleteBlock(id: string, businessId: string): Promise<void> {
  await adminWrite({ action: 'delete-block', business_id: businessId, id })
}

export async function getUpcomingBlocks(businessId: string): Promise<BlockedSlot[]> {
  if (!supabase) return []
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('blocked_slots')
    .select('id,business_id,date,start_time,end_time,reason')
    .eq('business_id', businessId)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
  return (data ?? []) as BlockedSlot[]
}

// ─────────────────────────────────────────────────────────────
//  SCHEDULE SETTINGS
// ─────────────────────────────────────────────────────────────

export interface ScheduleSettings {
  business_id: string
  work_days: number[]
  work_start: string
  work_end: string
  sat_start: string | null
  sat_end: string | null
  sun_start: string | null
  sun_end: string | null
  break_start: string | null
  break_end: string | null
  slot_duration: number
  min_advance: number
  allow_cancel?: boolean | null
  require_payment?: boolean | null
  qr_image_url?: string | null
  payment_percentage?: number | null
}

const scheduleSettingsCache = new Map<string, Promise<ScheduleSettings | null>>()

export async function getScheduleSettings(businessId: string): Promise<ScheduleSettings | null> {
  if (!supabase) return null
  const cached = scheduleSettingsCache.get(businessId)
  if (cached) return cached

  const promise = supabase
    .from('schedule_settings')
    .select(
      'business_id,work_days,work_start,work_end,sat_start,sat_end,sun_start,sun_end,break_start,break_end,slot_duration,min_advance,allow_cancel,require_payment,qr_image_url,payment_percentage',
    )
    .eq('business_id', businessId)
    .maybeSingle()
    .then(({ data }) => data as ScheduleSettings | null) as Promise<ScheduleSettings | null>

  scheduleSettingsCache.set(businessId, promise)
  setTimeout(() => scheduleSettingsCache.delete(businessId), CACHE_TTL)
  return promise
}

export interface ClientVisit {
  appointment_date: string
  appointment_time: string
  service: string
  status: string
}

export async function getClientHistory(phone: string, businessIds: string[]): Promise<ClientVisit[]> {
  if (!supabase || !phone || !businessIds.length) return []
  const clean = phone.replace(/\D/g, '')
  const { data } = await supabase
    .from('appointments')
    .select('appointment_date, appointment_time, service, status')
    .in('business_id', businessIds)
    .or(`phone.eq.${phone},phone.eq.${clean}`)
    .neq('status', 'cancelled')
    .order('appointment_date', { ascending: false })
    .limit(50)
  return (data ?? []) as ClientVisit[]
}

export async function getHiddenStaffIds(businessIds: string[]): Promise<Set<string>> {
  if (!supabase || !businessIds.length) return new Set()
  const { data } = await supabase
    .from('schedule_settings')
    .select('business_id')
    .in('business_id', businessIds)
    .eq('hidden', true)
  return new Set((data ?? []).map((r: { business_id: string }) => r.business_id))
}

// ─────────────────────────────────────────────────────────────
//  PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

export async function subscribeToPush(
  businessId: string,
): Promise<'subscribed' | 'already' | 'denied' | 'unsupported'> {
  if (!supabase || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn(
      '[Push] unsupported — supabase:',
      !!supabase,
      'sw:',
      'serviceWorker' in navigator,
      'push:',
      'PushManager' in window,
    )
    return 'unsupported'
  }
  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY is not set')
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()
  console.log('[Push] permission:', permission)
  if (permission !== 'granted') return 'denied'

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  console.log('[Push] service worker ready')

  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    console.log('[Push] already subscribed, endpoint:', existing.endpoint.slice(0, 50))
    return 'already'
  }

  let sub: PushSubscription
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    })
    console.log('[Push] subscribed, endpoint:', sub.endpoint.slice(0, 50))
  } catch (e) {
    console.error('[Push] subscribe failed:', e)
    return 'unsupported'
  }

  const { error } = await supabase.from('push_subscriptions').insert([
    {
      business_id: businessId,
      subscription: sub.toJSON(),
    },
  ])

  if (error) {
    console.error('[Push] failed to save subscription:', error)
    return 'unsupported'
  }

  console.log('[Push] subscription saved to DB ✓')
  return 'subscribed'
}

export async function getPushStatus(
  _businessId: string,
): Promise<'active' | 'inactive' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return 'inactive'
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'active' : 'inactive'
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function saveAllowCancel(businessId: string, allowCancel: boolean): Promise<void> {
  scheduleSettingsCache.delete(businessId)
  await adminWrite({ action: 'save-allow-cancel', business_id: businessId, allow_cancel: allowCancel })
}

export async function saveScheduleSettings(settings: ScheduleSettings): Promise<void> {
  scheduleSettingsCache.delete(settings.business_id)
  await adminWrite({ action: 'save-schedule', business_id: settings.business_id, settings })
}

export async function savePaymentSettings(
  businessId: string,
  requirePayment: boolean,
  paymentPercentage: number,
  qrImageUrl: string | null,
): Promise<void> {
  scheduleSettingsCache.delete(businessId)
  await adminWrite({
    action: 'save-payment-settings',
    business_id: businessId,
    require_payment: requirePayment,
    payment_percentage: paymentPercentage,
    qr_image_url: qrImageUrl,
  })
}

export async function confirmAppointment(id: string, businessId: string): Promise<void> {
  await adminWrite({ action: 'confirm-appointment', id, business_id: businessId })
}

export async function uploadQrImage(businessId: string, file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const ext = file.name.split('.').pop() ?? 'png'
  const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
  const res = await fetch(`${FUNCTIONS_URL}/admin-write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload-qr',
      business_id: businessId,
      file_base64: base64,
      content_type: file.type,
      ext,
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `upload failed (${res.status})`)
  }
  const { url } = await res.json()
  return url
}
