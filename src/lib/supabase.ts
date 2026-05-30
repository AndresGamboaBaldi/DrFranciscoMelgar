import { createClient } from '@supabase/supabase-js'
import type { Appointment } from '../types/booking'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// supabase client — only works when env vars are set
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

/**
 * Saves an appointment to the `appointments` table.
 * Returns the created record or throws on error.
 */
export async function createAppointment(data: Omit<Appointment, 'id' | 'created_at' | 'status'>) {
  if (!supabase) {
    console.warn('[Supabase] Client not configured — skipping DB insert.')
    return null
  }

  // Note: no .select() here — the anon RLS policy only allows INSERT, not SELECT.
  // We don't need the returned record on the frontend.
  const { error } = await supabase
    .from('appointments')
    .insert([{ ...data, status: 'pending' }])

  if (error) throw error
  return null
}

/**
 * Fetches already-booked time slots for a given date.
 * Used to grey-out unavailable times in the calendar.
 */
export async function getBookedSlots(date: string): Promise<string[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed'])

  if (error) return []
  return (data ?? []).map((r: { appointment_time: string }) => r.appointment_time)
}
