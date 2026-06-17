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
    satHours:        s.sat_start ? { start: s.sat_start, end: s.sat_end! } : undefined,
    sunHours:        s.sun_start ? { start: s.sun_start, end: s.sun_end! } : undefined,
    breakHours:      s.break_start ? { start: s.break_start, end: s.break_end! } : null,
  }
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const TODAY  = new Date()

interface Props {
  selectedDate: SelectedDate | null
  selectedTime: string | null
  onDateChange: (d: SelectedDate) => void
  onTimeChange: (t: string) => void
  businessId: string
  serviceDurationMins?: number
  view?: 'calendar' | 'times' | 'both'
  /** Override: lista manual de horarios desde professionals.ts. Si se define, omite la generación automática. */
  timeSlots?: string[]
  /** Override solo para sábados. Si se define, reemplaza timeSlots los sábados. */
  satTimeSlots?: string[]
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

/** Is a slot too soon (past or within minAdvanceHours)? */
function isTooSoon(y: number, m: number, d: number, slot: string, minHrs: number): boolean {
  const [h, min] = slot.split(':').map(Number)
  const slotTime = new Date(y, m, d, h, min).getTime()
  // Always block slots that are already in the past (even with 0 advance restriction)
  return slotTime < Date.now() + minHrs * 3600000
}

/** Is an entire day blocked or unavailable? */
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_ES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

function formatSelectedDate(d: SelectedDate): string {
  const dt = new Date(d.y, d.m, d.d)
  return `${DAYS_ES[dt.getDay()]} ${d.d} de ${MONTHS_ES[d.m]}`
}

function isDayUnavailable(y: number, m: number, d: number, cfg: BookingConfig, blocks: BlockedSlot[]): boolean {
  const dt  = new Date(y, m, d)
  const dow = dt.getDay()

  if (!cfg.workDays.includes(dow)) return true

  const hours = dow === 6 && cfg.satHours !== undefined ? cfg.satHours
              : dow === 0 && cfg.sunHours !== undefined ? cfg.sunHours
              : cfg.workHours
  if (!hours) return true

  // Block day if ALL its slots are too soon (works for both 0 and non-zero advance)
  const slots = generateSlots(hours.start, hours.end, cfg.slotDuration)
  const allTooSoon = slots.every(slot => {
    const [sh, sm] = slot.split(':').map(Number)
    return new Date(y, m, d, sh, sm).getTime() < Date.now() + cfg.minAdvanceHours * 3600000
  })
  if (allTooSoon) return true

  // Full-day block
  const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  if (blocks.some(b => b.date === dateStr && !b.start_time)) return true

  return false
}

// ─────────────────────────────────────────────────────────────

/** Returns the first month (as Date) that has at least one available day */
function findFirstAvailableMonth(cfg: BookingConfig): Date {
  let y = TODAY.getFullYear()
  let m = TODAY.getMonth()
  for (let attempt = 0; attempt < 13; attempt++) {
    const days = new Date(y, m + 1, 0).getDate()
    const hasDay = Array.from({ length: days }, (_, i) => i + 1)
      .some(d => !isDayUnavailable(y, m, d, cfg, []))
    if (hasDay) return new Date(y, m, 1)
    m++; if (m > 11) { m = 0; y++ }
  }
  return new Date(y, m, 1)
}

export default function CalendarPicker({ selectedDate, selectedTime, onDateChange, onTimeChange, businessId, serviceDurationMins, view = 'both', timeSlots: manualSlots, satTimeSlots: manualSatSlots }: Props) {
  const [calMonth, setCalMonth]     = useState(() => new Date())
  const [bookedSlots, setBooked]      = useState<string[]>([])
  const [bookedSlotsDate, setBookedSlotsDate] = useState<string | null>(null)
  const [monthBlocks, setBlocks]      = useState<BlockedSlot[]>([])
  const [dayBlocks, setDayBlocks]     = useState<BlockedSlot[]>([])
  const [dbCfg, setDbCfg]             = useState<BookingConfig | null>(null)
  const [cfgLoading, setCfgLoading]   = useState(true)

  // cfg is only non-null after DB settings load
  const cfg = dbCfg

  const y = calMonth.getFullYear()
  const m = calMonth.getMonth()

  // Fetch config + month blocks in parallel on mount / businessId change
  useEffect(() => {
    setCfgLoading(true)
    Promise.all([
      getScheduleSettings(businessId),
      getMonthBlocks(businessId, y, m),
    ]).then(([s, blocks]) => {
      setBlocks(blocks)
      if (s) {
        const resolved = settingsToConfig(s)
        setDbCfg(resolved)
        setCalMonth(prev => {
          const py = prev.getFullYear(), pm = prev.getMonth()
          const days = new Date(py, pm + 1, 0).getDate()
          const stillHasDay = Array.from({ length: days }, (_, i) => i + 1)
            .some(d => !isDayUnavailable(py, pm, d, resolved, []))
          return stillHasDay ? prev : findFirstAvailableMonth(resolved)
        })
      }
      setCfgLoading(false)
    })
  }, [businessId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch blocks when month changes (but not on initial load — covered above)
  useEffect(() => {
    if (cfgLoading) return
    getMonthBlocks(businessId, y, m).then(setBlocks)
  }, [businessId, y, m]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch booked appointments + day-specific blocks when date changes
  useEffect(() => {
    if (!selectedDate || !cfg) return
    const iso = `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}`
    setBookedSlotsDate(null)
    getBookedSlots(iso, businessId, cfg.slotDuration).then(slots => {
      setBooked(slots)
      setBookedSlotsDate(iso)
    })
    setDayBlocks(monthBlocks.filter(b => b.date === iso))
  }, [selectedDate, businessId, monthBlocks, cfg])

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

  // ── Early returns (all hooks are above) ──
  if (cfgLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '1.5rem', border: '1px solid var(--color-rim)' }}>
        {Array.from({ length: 35 }, (_,i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: 'color-mix(in srgb, var(--color-ink-ghost) 20%, transparent)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${(i % 7) * 60}ms` }} />
        ))}
      </div>
    )
  }

  if (!cfg) {
    return <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>Horarios aún no configurados. Configura el calendario en el panel de administración.</p>
  }

  // From here cfg is guaranteed non-null
  const getSlots = (sd: SelectedDate) => {
    const dow = new Date(sd.y, sd.m, sd.d).getDay()
    if (dow === 6 && manualSatSlots && manualSatSlots.length > 0) return manualSatSlots
    if (manualSlots && manualSlots.length > 0) return manualSlots
    const hrs = dow===6 && cfg.satHours!==undefined ? cfg.satHours
              : dow===0 && cfg.sunHours!==undefined ? cfg.sunHours
              : cfg.workHours
    if (!hrs) return []
    const slots = generateSlots(hrs.start, hrs.end, cfg.slotDuration)
    if (!cfg.breakHours) return slots
    const bStart = timeToMins(cfg.breakHours.start)
    const bEnd   = timeToMins(cfg.breakHours.end)
    return slots.filter(s => {
      const sm = timeToMins(s)
      return sm < bStart || sm >= bEnd
    })
  }

  const lacksSpace = (slot: string, allSlots: string[], blocked: string[], adminBlocks: BlockedSlot[]) => {
    const svcMins = serviceDurationMins ?? cfg.slotDuration
    if (svcMins <= cfg.slotDuration) return false
    const slotsNeeded = Math.ceil(svcMins / cfg.slotDuration)
    const idx = allSlots.indexOf(slot)
    for (let i = 0; i < slotsNeeded; i++) {
      const s = allSlots[idx + i]
      if (!s) return true
      if (blocked.includes(s) || isSlotBlocked(s, adminBlocks)) return true
    }
    return false
  }

  const hasPartialBlock = (d: number) => {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return monthBlocks.some(b => b.date === dateStr && b.start_time)
  }

  // ── view="times": only show time slots for selected date ──
  if (view === 'times') {
    if (!selectedDate) return <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>Primero selecciona una fecha.</p>
    const slots = getSlots(selectedDate)
    return (
      <div>
        {/* Selected date — prominent header */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-rim)' }}>
          <p style={{ fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.35rem' }}>Fecha seleccionada</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,3vw,1.65rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.1 }}>
            {formatSelectedDate(selectedDate)}
          </p>
        </div>
        {cfgLoading || (selectedDate && `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}` !== bookedSlotsDate)
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '.5rem' }}>
              {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ height: '2.5rem', borderRadius: 2, background: 'color-mix(in srgb, var(--color-ink-ghost) 20%, transparent)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />)}
            </div>
          : slots.length === 0
          ? <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '.93rem', color: 'var(--color-ink-ghost)' }}>Sin horarios disponibles este día.</p>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '.5rem' }}>
              {slots.map(slot => {
                const busy     = bookedSlots.includes(slot)
                const adminOff = isSlotBlocked(slot, dayBlocks)
                const tooSoon  = isTooSoon(selectedDate.y, selectedDate.m, selectedDate.d, slot, cfg.minAdvanceHours)
                const noSpace  = lacksSpace(slot, slots, bookedSlots, dayBlocks)
                const off      = busy || adminOff || tooSoon || noSpace
                const sel      = selectedTime === slot
                return (
                  <button key={slot} onClick={() => !off && onTimeChange(slot)} disabled={off}
                    style={{ padding: '.65rem .5rem', border: `1.5px solid ${sel ? 'var(--color-gold)' : 'var(--color-rim)'}`, textAlign: 'center', fontSize: '.9rem', cursor: off ? 'not-allowed' : 'pointer', background: sel ? 'var(--color-gold)' : 'transparent', color: sel ? 'var(--color-bg)' : off ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', opacity: off ? .3 : 1, transition: 'all .2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => { if (!off && !sel) { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = 'var(--color-rim)'; e.currentTarget.style.color = 'var(--color-ink-dim)' } }}
                  >{slot}</button>
                )
              })}
            </div>
          )
        }
        {cfg.minAdvanceHours > 0 && (
          <div style={{ marginTop: '1.1rem' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'.35rem', fontSize:'.75rem', color:'var(--color-ink-dim)', background:'var(--color-surface)', border:'1px solid var(--color-rim)', padding:'.3rem .7rem', lineHeight:1 }}>
              🕐 Reserva con {cfg.minAdvanceHours}h de anticipación
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: view === 'calendar' ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '1rem' }}>

      {/* ── Calendar ── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <CalBtn onClick={() => shiftMonth(-1)}>‹</CalBtn>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--color-ink)' }}>{MONTHS[m]} {y}</span>
          <CalBtn onClick={() => shiftMonth(1)}>›</CalBtn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: '.5rem' }}>
          {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(w => (
            <span key={w} style={{ fontSize: '.75rem', letterSpacing: '.08em', color: 'var(--color-ink-dim)', padding: '.3rem 0', fontWeight: 400 }}>{w}</span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          <>
          {Array.from({ length: firstDow }, (_,i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_,i) => {
            const d        = i + 1
            const blocked  = isDayUnavailable(y, m, d, cfg, monthBlocks)
            const partial  = !blocked && hasPartialBlock(d)
            const sel      = isSel(d)
            const today    = isToday(d)
            return (
              <div key={d} onClick={() => !blocked && pickDate(d)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.86rem', fontWeight: blocked ? 300 : 400,
                  position: 'relative', cursor: blocked ? 'not-allowed' : 'pointer',
                  background: sel ? 'var(--color-gold)' : 'transparent',
                  color: sel
                    ? 'var(--color-bg)'
                    : blocked
                      ? 'var(--color-ink-ghost)'   // clearly muted but still readable
                      : 'var(--color-ink)',          // available = full contrast
                  opacity: blocked ? .45 : 1,        // was .25 — much more visible now
                  textDecoration: blocked ? 'line-through' : 'none',  // cross out unavailable
                  transition: 'background .2s, color .2s',
                }}
                onMouseEnter={e => { if (!blocked && !sel) e.currentTarget.style.background = 'color-mix(in srgb, var(--color-gold) 18%, transparent)' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {d}
                {/* Today dot */}
                {today && !sel && <span style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:3, height:3, borderRadius:'50%', background:'var(--color-gold)', display:'block' }} />}
                {/* Partial block indicator */}
                {partial && !sel && <span style={{ position:'absolute', top:3, right:3, width:4, height:4, borderRadius:'50%', background:'#c47070', display:'block' }} title="Algunos horarios no disponibles" />}
              </div>
            )
          })}
          </>
        </div>

        <div style={{ display:'flex', gap:'.75rem', marginTop:'1.1rem', flexWrap:'wrap' }}>
          {cfg.minAdvanceHours > 0 && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:'.35rem', fontSize:'.75rem', color:'var(--color-ink-dim)', background:'var(--color-surface)', border:'1px solid var(--color-rim)', padding:'.3rem .7rem', lineHeight:1 }}>
              🕐 Reserva con {cfg.minAdvanceHours}h de anticipación
            </span>
          )}
        
        </div>
      </div>

      {/* ── Time slots — hidden in calendar-only view ── */}
      {view !== 'calendar' && <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
        <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:400, marginBottom:'1.2rem' }}>Horarios disponibles</h4>
        {!selectedDate
          ? <p style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'.88rem', color:'var(--color-ink-ghost)' }}>Selecciona una fecha para ver los horarios.</p>
          : cfgLoading || (selectedDate && `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}` !== bookedSlotsDate)
          ? <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.45rem' }}>
              {Array.from({ length: 6 }, (_, i) => <div key={i} style={{ height: '2rem', borderRadius: 2, background: 'color-mix(in srgb, var(--color-ink-ghost) 20%, transparent)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 60}ms` }} />)}
            </div>
          : (() => {
              const slots = getSlots(selectedDate)
              if (!slots.length) return <p style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'.88rem', color:'var(--color-ink-ghost)' }}>Sin horarios este día.</p>
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.45rem' }}>
                  {slots.map(slot => {
                    const booked    = bookedSlots.includes(slot)
                    const adminOff  = isSlotBlocked(slot, dayBlocks)
                    const tooSoon   = isTooSoon(selectedDate.y, selectedDate.m, selectedDate.d, slot, cfg.minAdvanceHours)
                    const noSpace   = lacksSpace(slot, slots, bookedSlots, dayBlocks)
                    const off       = booked || adminOff || tooSoon || noSpace
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
      </div>}
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
