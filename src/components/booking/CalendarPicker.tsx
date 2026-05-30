import { useState, useEffect } from 'react'
import type { SelectedDate } from '../../types/booking'
import { getBookedSlots } from '../../lib/supabase'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ALL_SLOTS  = ['08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']
const SAT_SLOTS  = ['09:00','10:00','11:00','12:00','13:00']

const TODAY = new Date()

interface Props {
  selectedDate: SelectedDate | null
  selectedTime: string | null
  onDateChange: (d: SelectedDate) => void
  onTimeChange: (t: string) => void
  doctorId?: string
}

export default function CalendarPicker({ selectedDate, selectedTime, onDateChange, onTimeChange }: Props) {
  const [calMonth, setCalMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  // Fetch booked slots from Supabase when date changes
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
    onTimeChange('') // reset time
  }

  const isSel  = (d: number) => selectedDate?.y === y && selectedDate?.m === m && selectedDate?.d === d
  const isToday = (d: number) => new Date(y, m, d).toDateString() === TODAY.toDateString()
  const isPast  = (d: number) => new Date(y, m, d) < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
  const isSun   = (d: number) => new Date(y, m, d).getDay() === 0

  const selectedIsSat = selectedDate ? new Date(selectedDate.y, selectedDate.m, selectedDate.d).getDay() === 6 : false
  const slots = selectedIsSat ? SAT_SLOTS : ALL_SLOTS

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3.5rem', marginBottom: '2.5rem' }}>
      {/* Calendar */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <CalBtn onClick={() => shiftMonth(-1)}>‹</CalBtn>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{MONTHS[m]} {y}</span>
          <CalBtn onClick={() => shiftMonth(1)}>›</CalBtn>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: '.5rem' }}>
          {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(w => (
            <span key={w} style={{ fontSize: '.62rem', letterSpacing: '.1em', color: 'var(--color-ink-ghost)', padding: '.3rem 0' }}>{w}</span>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const disabled = isPast(d) || isSun(d)
            const sel = isSel(d)

            return (
              <div
                key={d}
                onClick={() => !disabled && pickDate(d)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.78rem', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
                  background: sel ? 'var(--color-gold)' : 'transparent',
                  color: sel ? 'var(--color-bg)' : disabled ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)',
                  opacity: disabled ? .25 : 1,
                  transition: 'background .2s, color .2s',
                }}
                onMouseEnter={e => { if (!disabled && !sel) e.currentTarget.style.background = 'var(--color-surface2)' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {d}
                {isToday(d) && !sel && (
                  <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-gold)', display: 'block' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, marginBottom: '1.2rem' }}>Horarios disponibles</h4>
        {!selectedDate
          ? <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.88rem', color: 'var(--color-ink-ghost)' }}>Selecciona una fecha para ver los horarios.</p>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.45rem' }}>
              {slots.map(slot => {
                const busy = bookedSlots.includes(slot)
                const isSel = selectedTime === slot
                return (
                  <div
                    key={slot}
                    onClick={() => !busy && onTimeChange(slot)}
                    style={{
                      padding: '.55rem .5rem', border: `1px solid ${isSel ? 'var(--color-gold)' : 'var(--color-rim)'}`,
                      textAlign: 'center', fontSize: '.76rem', cursor: busy ? 'not-allowed' : 'pointer',
                      background: isSel ? 'var(--color-gold)' : 'transparent',
                      color: isSel ? 'var(--color-bg)' : busy ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)',
                      opacity: busy ? .3 : 1, transition: 'all .2s',
                    }}
                    onMouseEnter={e => { if (!busy && !isSel) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' } }}
                    onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-dim)' } }}
                  >
                    {slot}
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}

function CalBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: '1px solid var(--color-rim)', color: 'var(--color-ink-dim)', width: '1.7rem', height: '1.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '.9rem', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
    >{children}</button>
  )
}
