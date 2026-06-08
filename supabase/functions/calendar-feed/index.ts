/**
 * Supabase Edge Function — ICS Calendar Feed
 * ===========================================
 * Serves a live iCalendar (.ics) file for a doctor's appointments.
 * The doctor subscribes to this URL once in their iPhone / Google Calendar
 * and all new bookings appear automatically every ~15 minutes.
 *
 * Deploy:
 *   supabase functions deploy calendar-feed
 *
 * URL:
 *   https://<project>.supabase.co/functions/v1/calendar-feed?token=<secret>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!


// ────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
    })
  }

  const url   = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response('Token requerido', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // ── 1. Validate the magic token ──────────────────────────────────────────
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('calendar_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (tokenErr || !tokenRow) {
    return new Response('Token inválido o expirado', { status: 401 })
  }

  // ── 2. Fetch appointments for this doctor ────────────────────────────────
  // Include last 30 days so past appointments stay in the calendar
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().split('T')[0]

  const { data: appointments, error: aptErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', tokenRow.business_id)
    .neq('status', 'cancelled')
    .gte('appointment_date', sinceStr)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (aptErr) {
    console.error('DB error:', aptErr)
    return new Response('Error al obtener citas', { status: 500 })
  }

  // ── 3. Generate ICS ──────────────────────────────────────────────────────
  const ics = generateICS(appointments ?? [], tokenRow.doctor_name, tokenRow.timezone ?? 'America/La_Paz')
  const filename = `citas-${tokenRow.business_id}.ics`

  return new Response(ics, {
    headers: {
      'Content-Type':        'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      // Tell calendar clients to refresh every 15 minutes
      'Cache-Control':       'no-cache, no-store, must-revalidate',
      'X-Published-TTL':     'PT15M',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

// ────────────────────────────────────────────────────────────────────────────
// ICS Generator — RFC 5545 compliant
// ────────────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string
  name: string
  service: string
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:MM
  phone: string
  notes?: string | null
  duration_mins?: number | null
  status: string
  created_at: string
}

function generateICS(appointments: Appointment[], calName: string, timezone: string): string {
  const now = formatUtcStamp(new Date())

  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pro.bo//Citas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    fold(`X-WR-CALNAME:📅 Citas — ${calName}`),
    `X-WR-TIMEZONE:${timezone}`,
    'X-PUBLISHED-TTL:PT15M',
    '',
  ].join('\r\n')

  const events = appointments
    .map(apt => buildVEvent(apt, timezone, now))
    .join('\r\n')

  const footer = '\r\nEND:VCALENDAR'

  return header + events + footer
}

function buildVEvent(apt: Appointment, timezone: string, now: string): string {
  const duration = apt.duration_mins ?? 60
  const dtStart  = localDatetime(apt.appointment_date, apt.appointment_time)
  const dtEnd    = addMinutes(apt.appointment_date, apt.appointment_time, duration)
  const created  = formatUtcStamp(new Date(apt.created_at))
  const status   = apt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'

  const descParts = [
    `🧑 ${apt.name}`,
    `📱 ${apt.phone}`,
  ]
  if (apt.notes && apt.notes !== 'Sin comentarios especiales') descParts.push(`📝 ${apt.notes}`)

  const lines = [
    'BEGIN:VEVENT',
    fold(`UID:apt-${apt.id}@plaza.bo`),
    `DTSTART;TZID=${timezone}:${dtStart}`,
    `DTEND;TZID=${timezone}:${dtEnd}`,
    fold(`SUMMARY:${esc(apt.name)} — ${esc(apt.service)}`),
    fold(`DESCRIPTION:${descParts.map(esc).join('\\n')}`),
    `STATUS:${status}`,
    `DTSTAMP:${now}`,
    `CREATED:${created}`,
    `LAST-MODIFIED:${now}`,
    'END:VEVENT',
  ]

  return lines.join('\r\n')
}

// ────── Helpers ──────────────────────────────────────────────────────────────

/** Format as local datetime: YYYYMMDDTHHMMSS (no Z = floating/local time) */
function localDatetime(date: string, time: string): string {
  const [y, m, d] = date.split('-')
  const [h, min]  = time.split(':')
  return `${y}${m}${d}T${h}${min}00`
}

/** Add minutes to a local date+time, return YYYYMMDDTHHMMSS */
function addMinutes(date: string, time: string, mins: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min]  = time.split(':').map(Number)
  const dt = new Date(y, m - 1, d, h, min + mins)
  return (
    String(dt.getFullYear()) +
    String(dt.getMonth() + 1).padStart(2, '0') +
    String(dt.getDate()).padStart(2, '0') +
    'T' +
    String(dt.getHours()).padStart(2, '0') +
    String(dt.getMinutes()).padStart(2, '0') +
    '00'
  )
}

/** UTC timestamp: YYYYMMDDTHHMMSSZ */
function formatUtcStamp(dt: Date): string {
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
}

/** Escape special characters per RFC 5545 */
function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g,  '\\;')
    .replace(/,/g,  '\\,')
    .replace(/\n/g, '\\n')
}

/** Fold long lines to max 75 octets (RFC 5545 §3.1) */
function fold(line: string): string {
  if (line.length <= 75) return line
  let out = ''
  while (line.length > 75) {
    out  += line.slice(0, 75) + '\r\n '
    line  = line.slice(75)
  }
  return out + line
}
