import { useState, useEffect } from 'react'
import type { SelectedDate } from '../../types/booking'
import type { BookingConfig } from '../../types/professional'
import { getBookedSlots } from '../../lib/supabase'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const TODAY = new Date()

interface Props {
  selectedDate: SelectedDate | null
  selectedTime: string | null
  onDateChange: (d: SelectedDate) => void
  onTimeChange: (t: string) => void
  doctorId?: string
  bookingConfig: BookingConfig
}

// ── Helpers ──────────────────────────────────────────────────────

/** Generate time slots from start to end with given interval */
function generateSlots(start: string, end: string, intervalMins: number): string[] {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const endTotal = eh * 60 + em
  const slots: string[] = []
  let total = sh * 60 + sm
  while (total < endTotal) {
    slots.push(`${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`)
    total += intervalMins
  }
  return slots
}

/** Check if a specific date+time is past the minAdvanceHours cutoff */
function isSlotTooSoon(y: number, m: number, d: number, time: string, minAdvanceHours: number): boolean {
  if (minAdvanceHours === 0) return false
  const [h, min] = time.split(':').map(Number)
  const slotMs  = new Date(y, m, d, h, min).getTime()
  const cutoff  = Date.now() + minAdvanceHours * 3600000
  return slotMs < cutoff
}

/** Check if an entire day is blocked (all slots are in the past / before cutoff) */
function isDayBlocked(y: number, m: number, d: number, cfg: BookingConfig): boolean {
  const dt  = new Date(y, m, d)
  const dow = dt.getDay()

  // Day not in workDays
  if (!cfg.workDays.includes(dow)) return true

  // Get hours for this day
  const hours = dow === 6 && cfg.satHours !== undefined
    ? cfg.satHours
    : dow === 0 && cfg.sunHours !== undefined
      ? cfg.sunHours
      : cfg.workHours

  if (!hours) return true // explicitly closed

  // Check cutoff: if end of day is before the cutoff, entire day is blocked
  if (cfg.minAdvanceHours > 0) {
    const [eh, em] = hours.end.split(':').map(Number)
    const endOfDayMs = new Date(y, m, d, eh, em).getTime()
    const cutoff     = Date.now() + cfg.minAdvanceHours * 3600000
    if (endOfDayMs <= cutoff) return true
  } else {
    // Standard: block past days
    const todayStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
    if (dt < todayStart) return true
  }

  return false
}

// ────────────────────────────────────────────────────────────────

export default function CalendarPicker({ selectedDate, selectedTime, onDateChange, onTimeChange, bookingConfig: cfg }: Props) {
  const [calMonth, setCalMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  useEffect(() => {
    if (!selectedDate) return
    const iso = `${selectedDate.y}-${String(selectedDate.m + 1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}`
    getBookedSlots(iso).then(setBookedSlots)
  }, [selectedDate])

  const y = calMonth.getFullYear()
  const m = calMonth.getMonth()
  const firstDow = (() => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const shiftMonth = (dir: -1 | 1) => {
    const next = new Date(y, m + dir, 1)
    if (next < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)) return
    setCalMonth(next)
  }

  const pickDate = (d: number) => {
    onDateChange({ y, m, d })
    onTimeChange('')
  }

  const isToday = (d: number) => new Date(y, m, d).toDateString() === TODAY.toDateString()
  const isSel   = (d: number) => selectedDate?.y === y && selectedDate?.m === m && selectedDate?.d === d

  // Get slots for the selected date
  const getDateSlots = (sd: SelectedDate): string[] => {
    const dow = new Date(sd.y, sd.m, sd.d).getDay()
    const hours = dow === 6 && cfg.satHours !== undefined
      ? cfg.satHours
      : dow === 0 && cfg.sunHours !== undefined
        ? cfg.sunHours
        : cfg.workHours
    if (!hours) return []
    return generateSlots(hours.start, hours.end, cfg.slotDuration)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3.5rem', marginBottom: '2.5rem' }}>
      {/* Calendar */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <CalBtn onClick={() => shiftMonth(-1)}>‹</CalBtn>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{MONTHS[m]} {y}</span>
          <CalBtn onClick={() => shiftMonth(1)}>›</CalBtn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: '.5rem' }}>
          {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(w => (
            <span key={w} style={{ fontSize: '.62rem', letterSpacing: '.1em', color: 'var(--color-ink-ghost)', padding: '.3rem 0' }}>{w}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d       = i + 1
            const blocked = isDayBlocked(y, m, d, cfg)
            const sel     = isSel(d)
            return (
              <div key={d} onClick={() => !blocked && pickDate(d)}
                style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', position: 'relative', cursor: blocked ? 'not-allowed' : 'pointer', background: sel ? 'var(--color-gold)' : 'transparent', color: sel ? 'var(--color-bg)' : blocked ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', opacity: blocked ? .25 : 1, transition: 'background .2s, color .2s' }}
                onMouseEnter={e => { if (!blocked && !sel) e.currentTarget.style.background = 'var(--color-surface2)' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {d}
                {isToday(d) && !sel && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-gold)', display: 'block' }} />}
              </div>
            )
          })}
        </div>

        {/* Anticipation notice */}
        {cfg.minAdvanceHours > 0 && (
          <p style={{ fontSize: '.68rem', color: 'var(--color-ink-ghost)', marginTop: '1rem', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
            Las citas deben reservarse con al menos {cfg.minAdvanceHours} horas de anticipación.
          </p>
        )}
      </div>

      {/* Time slots */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, marginBottom: '1.2rem' }}>Horarios disponibles</h4>
        {!selectedDate
          ? <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.88rem', color: 'var(--color-ink-ghost)' }}>Selecciona una fecha para ver los horarios.</p>
          : (() => {
              const slots = getDateSlots(selectedDate)
              if (slots.length === 0) return <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.88rem', color: 'var(--color-ink-ghost)' }}>Sin horarios disponibles este día.</p>
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.45rem' }}>
                  {slots.map(slot => {
                    const busy    = bookedSlots.includes(slot)
                    const tooSoon = isSlotTooSoon(selectedDate.y, selectedDate.m, selectedDate.d, slot, cfg.minAdvanceHours)
                    const off     = busy || tooSoon
                    const isSel   = selectedTime === slot
                    return (
                      <div key={slot} onClick={() => !off && onTimeChange(slot)}
                        style={{ padding: '.55rem .5rem', border: `1px solid ${isSel ? 'var(--color-gold)' : 'var(--color-rim)'}`, textAlign: 'center', fontSize: '.76rem', cursor: off ? 'not-allowed' : 'pointer', background: isSel ? 'var(--color-gold)' : 'transparent', color: isSel ? 'var(--color-bg)' : off ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', opacity: off ? .3 : 1, transition: 'all .2s' }}
                        onMouseEnter={e => { if (!off && !isSel) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' } }}
                        onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-dim)' } }}
                      >
                        {slot}
                      </div>
                    )
                  })}
                </div>
              )
            })()
        }
      </div>
    </div>
  )
}

function CalBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: '1px solid var(--color-rim)', color: 'var(--color-ink-dim)', width: '1.7rem', height: '1.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '.9rem', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
    >{children}</button>
  )
}
