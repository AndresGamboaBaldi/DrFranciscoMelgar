import { createClient } from '@supabase/supabase-js'
import type { Appointment } from '../types/booking'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─────────────────────────────────────────────────────────────
//  APPOINTMENTS
// ─────────────────────────────────────────────────────────────

export async function createAppointment(data: Omit<Appointment, 'id' | 'created_at' | 'status'> & { duration_mins?: number }) {
  if (!supabase) { console.warn('[Supabase] not configured'); return null }
  const { error } = await supabase.from('appointments').insert([{ ...data, status: 'pending' }])
  if (error) throw error

  // Fire-and-forget push notification — non-blocking
  if (data.business_id) {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
    const FUNCTIONS_URL = import.meta.env.DEV
      ? 'http://127.0.0.1:54321/functions/v1'
      : `${SUPABASE_URL}/functions/v1`
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const [y, mo, d] = data.appointment_date.split('-').map(Number)
    const currentYear = new Date().getFullYear()
    const dateLabel = `${d} de ${MONTHS[mo - 1]}${y !== currentYear ? ` de ${y}` : ''}`
    const body = `${data.name} reservó ${data.service} el ${dateLabel} a las ${data.appointment_time}`
    fetch(`${FUNCTIONS_URL}/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: data.business_id, title: '📅 Nueva Cita', body, url: `/${data.business_id}/setup` }),
    }).catch(() => {}) // silently ignore errors
  }

  return null
}

function expandBookedSlots(rows: { appointment_time: string; duration_mins: number | null }[], slotDuration: number): string[] {
  const blocked = new Set<string>()
  for (const r of rows) {
    // Normalize "HH:MM:SS" → "HH:MM"
    const [h, m] = r.appointment_time.substring(0, 5).split(':').map(Number)
    const startMins = h * 60 + m
    const totalMins = r.duration_mins ?? slotDuration
    for (let offset = 0; offset < totalMins; offset += slotDuration) {
      const t = startMins + offset
      blocked.add(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
    }
  }
  return [...blocked]
}

export async function getBookedSlots(date: string, businessId: string, slotDuration = 30): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration_mins')
    .eq('appointment_date', date)
    .eq('business_id', businessId)
    .in('status', ['pending', 'confirmed'])
  if (error) {
    // duration_mins column may not exist yet — fall back to blocking only start time
    const { data: fallback } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .eq('business_id', businessId)
      .in('status', ['pending', 'confirmed'])
    return (fallback ?? []).map((r: { appointment_time: string }) => r.appointment_time.substring(0, 5))
  }
  return expandBookedSlots(data ?? [], slotDuration)
}

export async function getAppointmentsByDate(businessId: string, date: string): Promise<Appointment[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('appointments')
    .select('id, name, phone, service, appointment_date, appointment_time, notes, status')
    .eq('business_id', businessId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .order('appointment_time', { ascending: true })
  if (error) { console.error('[getAppointmentsByDate]', error); return [] }
  return (data ?? []) as Appointment[]
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

export async function cancelAppointment(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')

  // Fetch appointment details first so we can notify the professional
  const apt = await getAppointmentById(id)

  const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)

  // Fire-and-forget push notification — non-blocking
  if (apt?.business_id) {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
    const FUNCTIONS_URL = import.meta.env.DEV
      ? 'http://127.0.0.1:54321/functions/v1'
      : `${SUPABASE_URL}/functions/v1`
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const [y, mo, d] = apt.appointment_date.split('-').map(Number)
    const currentYear = new Date().getFullYear()
    const dateLabel = `${d} de ${MONTHS[mo - 1]}${y !== currentYear ? ` de ${y}` : ''}`
    const body = `${apt.name} canceló ${apt.service} el ${dateLabel} a las ${apt.appointment_time}`
    fetch(`${FUNCTIONS_URL}/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: apt.business_id, title: '❌ Cita cancelada', body, url: `/${apt.business_id}/setup` }),
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
  end_time:   string | null
  reason?: string | null
  created_at?: string
}

export async function getMonthBlocks(businessId: string, year: number, month: number): Promise<BlockedSlot[]> {
  if (!supabase) return []
  const from = `${year}-${String(month+1).padStart(2,'0')}-01`
  const to   = `${year}-${String(month+1).padStart(2,'0')}-${new Date(year, month+1, 0).getDate()}`
  const { data } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', from)
    .lte('date', to)
  return (data ?? []) as BlockedSlot[]
}

export async function addBlock(block: Omit<BlockedSlot, 'id' | 'created_at'>): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.from('blocked_slots').insert([block])
  if (error) throw new Error(error.message)
}

export async function deleteBlock(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
  if (error) throw new Error(error.message)
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
  business_id:     string
  work_days:     number[]
  work_start:    string
  work_end:      string
  sat_start:     string | null
  sat_end:       string | null
  sun_start:     string | null
  sun_end:       string | null
  break_start:   string | null
  break_end:     string | null
  slot_duration: number
  min_advance:   number
}

export async function getScheduleSettings(businessId: string): Promise<ScheduleSettings | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('schedule_settings')
    .select('business_id,work_days,work_start,work_end,sat_start,sat_end,sun_start,sun_end,break_start,break_end,slot_duration,min_advance')
    .eq('business_id', businessId)
    .maybeSingle()
  return data as ScheduleSettings | null
}

// ─────────────────────────────────────────────────────────────
//  PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

export async function subscribeToPush(businessId: string): Promise<'subscribed' | 'already' | 'denied' | 'unsupported'> {
  if (!supabase || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] unsupported — supabase:', !!supabase, 'sw:', 'serviceWorker' in navigator, 'push:', 'PushManager' in window)
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

  const { error } = await supabase.from('push_subscriptions').insert([{
    business_id: businessId,
    subscription: sub.toJSON(),
  }])

  if (error) {
    console.error('[Push] failed to save subscription:', error)
    return 'unsupported'
  }

  console.log('[Push] subscription saved to DB ✓')
  return 'subscribed'
}

export async function getPushStatus(_businessId: string): Promise<'active' | 'inactive' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return 'inactive'
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'active' : 'inactive'
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function saveScheduleSettings(settings: ScheduleSettings): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase
    .from('schedule_settings')
    .upsert([{ ...settings, updated_at: new Date().toISOString() }], { onConflict: 'business_id' })
  if (error) throw new Error(error.message)
}
