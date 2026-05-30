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

export async function createAppointment(data: Omit<Appointment, 'id' | 'created_at' | 'status'>) {
  if (!supabase) { console.warn('[Supabase] not configured'); return null }
  const { error } = await supabase.from('appointments').insert([{ ...data, status: 'pending' }])
  if (error) throw error
  return null
}

export async function getBookedSlots(date: string, doctorId: string): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .eq('doctor_id', doctorId)
    .in('status', ['pending', 'confirmed'])
  return (data ?? []).map((r: { appointment_time: string }) => r.appointment_time)
}

// ─────────────────────────────────────────────────────────────
//  BLOCKED SLOTS
// ─────────────────────────────────────────────────────────────

export interface BlockedSlot {
  id: string
  doctor_id: string
  date: string
  start_time: string | null
  end_time:   string | null
  reason?: string | null
  created_at?: string
}

export async function getMonthBlocks(doctorId: string, year: number, month: number): Promise<BlockedSlot[]> {
  if (!supabase) return []
  const from = `${year}-${String(month+1).padStart(2,'0')}-01`
  const to   = `${year}-${String(month+1).padStart(2,'0')}-${new Date(year, month+1, 0).getDate()}`
  const { data } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('doctor_id', doctorId)
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

export async function getUpcomingBlocks(doctorId: string): Promise<BlockedSlot[]> {
  if (!supabase) return []
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('blocked_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
  return (data ?? []) as BlockedSlot[]
}

// ─────────────────────────────────────────────────────────────
//  SCHEDULE SETTINGS
// ─────────────────────────────────────────────────────────────

export interface ScheduleSettings {
  doctor_id:     string
  work_days:     number[]
  work_start:    string
  work_end:      string
  sat_start:     string | null
  sat_end:       string | null
  sun_start:     string | null
  sun_end:       string | null
  slot_duration: number
  min_advance:   number
}

export async function getScheduleSettings(doctorId: string): Promise<ScheduleSettings | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('schedule_settings')
    .select('*')
    .eq('doctor_id', doctorId)
    .maybeSingle()
  return data as ScheduleSettings | null
}

export async function saveScheduleSettings(settings: ScheduleSettings): Promise<void> {
  if (!supabase) throw new Error('Supabase no configurado')
  const { error } = await supabase
    .from('schedule_settings')
    .upsert([{ ...settings, updated_at: new Date().toISOString() }], { onConflict: 'doctor_id' })
  if (error) throw new Error(error.message)
}
