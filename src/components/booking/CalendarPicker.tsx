import { useState, useEffect } from 'react'
import type { SelectedDate } from '../../types/booking'
import type { BookingConfig } from '../../types/professional'
import type { BlockedSlot, ScheduleSettings } from '../../lib/supabase'
import { getBookedSlots, getMonthBlocks, getScheduleSettings } from '../../lib/supabase'

function settingsToConfig(s: ScheduleSettings): BookingConfig {
  return {
    slotDuration:    s.slot_duration,
    minAdvanceHours: s.min_advance,
    workDays:        s.work_days,
    workHours:       { start: s.work_start, end: s.work_end },
    satHours:        s.sat_start ? { start: s.sat_start, end: s.sat_end! } : null,
    sunHours:        s.sun_start ? { start: s.sun_start, end: s.sun_end! } : null,
  }
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const TODAY  = new Date()

interface Props {
  selectedDate: SelectedDate | null
  selectedTime: string | null
  onDateChange: (d: SelectedDate) => void
  onTimeChange: (t: string) => void
  bookingConfig: BookingConfig
  doctorId: string
}

// ── Helpers ──────────────────────────────────────────────────

function generateSlots(start: string, end: string, intervalMins: number): string[] {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const endTotal = eh * 60 + em
  const slots: string[] = []
  let total = sh * 60 + sm
  while (total < endTotal) {
    slots.push(`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`)
    total += intervalMins
  }
  return slots
}

function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Is a slot blocked by any of the day's block records? */
function isSlotBlocked(slot: string, blocks: BlockedSlot[]): boolean {
  const slotMins = timeToMins(slot)
  return blocks.some(b => {
    if (!b.start_time || !b.end_time) return true          // full day block
    return slotMins >= timeToMins(b.start_time) && slotMins < timeToMins(b.end_time)
  })
}

/** Is a slot too soon (minAdvanceHours restriction)? */
function isTooSoon(y: number, m: number, d: number, slot: string, minHrs: number): boolean {
  if (minHrs === 0) return false
  const [h, min] = slot.split(':').map(Number)
  return new Date(y, m, d, h, min).getTime() < Date.now() + minHrs * 3600000
}

/** Is an entire day blocked or unavailable? */
function isDayUnavailable(y: number, m: number, d: number, cfg: BookingConfig, blocks: BlockedSlot[]): boolean {
  const dt  = new Date(y, m, d)
  const dow = dt.getDay()

  if (!cfg.workDays.includes(dow)) return true

  const hours = dow === 6 && cfg.satHours !== undefined ? cfg.satHours
              : dow === 0 && cfg.sunHours !== undefined ? cfg.sunHours
              : cfg.workHours
  if (!hours) return true

  // Past / advance restriction
  if (cfg.minAdvanceHours > 0) {
    const [eh, em] = hours.end.split(':').map(Number)
    if (new Date(y, m, d, eh, em).getTime() <= Date.now() + cfg.minAdvanceHours * 3600000) return true
  } else {
    if (dt < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())) return true
  }

  // Full-day block
  const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  if (blocks.some(b => b.date === dateStr && !b.start_time)) return true

  return false
}

// ─────────────────────────────────────────────────────────────

export default function CalendarPicker({ selectedDate, selectedTime, onDateChange, onTimeChange, bookingConfig: cfgProp, doctorId }: Props) {
  const [calMonth, setCalMonth]     = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [bookedSlots, setBooked]    = useState<string[]>([])
  const [monthBlocks, setBlocks]    = useState<BlockedSlot[]>([])
  const [dayBlocks, setDayBlocks]   = useState<BlockedSlot[]>([])
  const [dbCfg, setDbCfg]           = useState<BookingConfig | null>(null)

  // Active config: DB settings take priority over professionals.ts defaults
  const cfg = dbCfg ?? cfgProp

  useEffect(() => {
    getScheduleSettings(doctorId).then(s => {
      if (s) setDbCfg(settingsToConfig(s))
    })
  }, [doctorId])

  const y = calMonth.getFullYear()
  const m = calMonth.getMonth()

  // Fetch blocks for the visible month
  useEffect(() => {
    getMonthBlocks(doctorId, y, m).then(setBlocks)
  }, [doctorId, y, m])

  // Fetch booked appointments + day-specific blocks when date changes
  useEffect(() => {
    if (!selectedDate) return
    const iso = `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}`
    getBookedSlots(iso, doctorId).then(setBooked)
    setDayBlocks(monthBlocks.filter(b => b.date === iso))
  }, [selectedDate, doctorId, monthBlocks])

  const firstDow    = (() => { const d = new Date(y,m,1).getDay(); return d===0?6:d-1 })()
  const daysInMonth = new Date(y, m+1, 0).getDate()

  const shiftMonth = (dir: -1|1) => {
    const next = new Date(y, m+dir, 1)
    if (next < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)) return
    setCalMonth(next)
  }

  const pickDate = (d: number) => { onDateChange({ y, m, d }); onTimeChange('') }
  const isToday  = (d: number) => new Date(y,m,d).toDateString() === TODAY.toDateString()
  const isSel    = (d: number) => selectedDate?.y===y && selectedDate?.m===m && selectedDate?.d===d

  const getSlots = (sd: SelectedDate) => {
    const dow = new Date(sd.y,sd.m,sd.d).getDay()
    const hrs = dow===6 && cfg.satHours!==undefined ? cfg.satHours
              : dow===0 && cfg.sunHours!==undefined ? cfg.sunHours
              : cfg.workHours
    return hrs ? generateSlots(hrs.start, hrs.end, cfg.slotDuration) : []
  }

  // Check if a day has partial blocks (shows a small indicator)
  const hasPartialBlock = (d: number) => {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return monthBlocks.some(b => b.date === dateStr && b.start_time)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3.5rem', marginBottom: '2.5rem' }}>

      {/* ── Calendar ── */}
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
          {Array.from({ length: firstDow }, (_,i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_,i) => {
            const d        = i + 1
            const blocked  = isDayUnavailable(y, m, d, cfg, monthBlocks)
            const partial  = !blocked && hasPartialBlock(d)
            const sel      = isSel(d)
            const today    = isToday(d)
            return (
              <div key={d} onClick={() => !blocked && pickDate(d)}
                style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.78rem', position:'relative', cursor: blocked?'not-allowed':'pointer', background: sel?'var(--color-gold)':'transparent', color: sel?'var(--color-bg)':blocked?'var(--color-ink-ghost)':'var(--color-ink-dim)', opacity: blocked?.25:1, transition:'background .2s,color .2s' }}
                onMouseEnter={e => { if(!blocked&&!sel) e.currentTarget.style.background='var(--color-surface2)' }}
                onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent' }}
              >
                {d}
                {/* Today dot */}
                {today && !sel && <span style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:3, height:3, borderRadius:'50%', background:'var(--color-gold)', display:'block' }} />}
                {/* Partial block indicator */}
                {partial && !sel && <span style={{ position:'absolute', top:3, right:3, width:4, height:4, borderRadius:'50%', background:'#c47070', display:'block' }} title="Algunos horarios no disponibles" />}
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:'1rem', marginTop:'1rem', flexWrap:'wrap' }}>
          {cfg.minAdvanceHours > 0 && (
            <p style={{ fontSize:'.65rem', color:'var(--color-ink-ghost)', fontStyle:'italic', fontFamily:'var(--font-display)', lineHeight:1.5 }}>
              Mínimo {cfg.minAdvanceHours}h de anticipación
            </p>
          )}
          <p style={{ fontSize:'.65rem', color:'var(--color-ink-ghost)', fontStyle:'italic', fontFamily:'var(--font-display)', lineHeight:1.5 }}>
            🔴 día con horarios parciales
          </p>
        </div>
      </div>

      {/* ── Time slots ── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:400, marginBottom:'1.2rem' }}>Horarios disponibles</h4>
        {!selectedDate
          ? <p style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'.88rem', color:'var(--color-ink-ghost)' }}>Selecciona una fecha para ver los horarios.</p>
          : (() => {
              const slots = getSlots(selectedDate)
              if (!slots.length) return <p style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'.88rem', color:'var(--color-ink-ghost)' }}>Sin horarios este día.</p>
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.45rem' }}>
                  {slots.map(slot => {
                    const booked    = bookedSlots.includes(slot)
                    const adminOff  = isSlotBlocked(slot, dayBlocks)
                    const tooSoon   = isTooSoon(selectedDate.y, selectedDate.m, selectedDate.d, slot, cfg.minAdvanceHours)
                    const off       = booked || adminOff || tooSoon
                    const sel       = selectedTime === slot
                    return (
                      <div key={slot} onClick={() => !off && onTimeChange(slot)}
                        style={{ padding:'.55rem .5rem', border:`1px solid ${sel?'var(--color-gold)':'var(--color-rim)'}`, textAlign:'center', fontSize:'.76rem', cursor:off?'not-allowed':'pointer', background: sel?'var(--color-gold)':'transparent', color: sel?'var(--color-bg)':off?'var(--color-ink-ghost)':'var(--color-ink-dim)', opacity: off?.3:1, transition:'all .2s', position:'relative' }}
                        onMouseEnter={e => { if(!off&&!sel){ e.currentTarget.style.borderColor='var(--color-gold)'; e.currentTarget.style.color='var(--color-ink)' } }}
                        onMouseLeave={e => { if(!sel){ e.currentTarget.style.borderColor='var(--color-rim)'; e.currentTarget.style.color='var(--color-ink-dim)' } }}
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

function CalBtn({ onClick, children }: { onClick:()=>void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ background:'none', border:'1px solid var(--color-rim)', color:'var(--color-ink-dim)', width:'1.7rem', height:'1.7rem', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'.9rem', transition:'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--color-gold)'; e.currentTarget.style.color='var(--color-gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--color-rim)'; e.currentTarget.style.color='var(--color-ink-dim)' }}
    >{children}</button>
  )
}
