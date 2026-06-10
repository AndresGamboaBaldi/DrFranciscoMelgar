import { useState, useEffect, useCallback } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { getScheduleSettings, saveScheduleSettings, type ScheduleSettings } from '../lib/supabase'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const SLOT_OPTIONS = [15, 30, 45, 60]
const BREAK_OPTIONS = [0, 5, 10, 15, 20, 30]
const ADVANCE_OPTIONS = [
  { v: 0,  l: 'Sin restricción' },
  { v: 1,  l: '1 hora' },
  { v: 2,  l: '2 horas' },
  { v: 6,  l: '6 horas' },
  { v: 12, l: '12 horas' },
  { v: 24, l: '24 horas (1 día)' },
  { v: 48, l: '48 horas (2 días)' },
]

export default function ScheduleEditor() {
  const pro = useProfessional()

  const [workDays,   setWorkDays]   = useState<number[]>([1,2,3,4,5])

  // Turno mañana (siempre activo) + turno tarde (opcional)
  const [amStart,    setAmStart]    = useState('08:00')
  const [amEnd,      setAmEnd]      = useState('13:00')
  const [pmActive,   setPmActive]   = useState(true)
  const [pmStart,    setPmStart]    = useState('14:00')
  const [pmEnd,      setPmEnd]      = useState('18:00')

  const [satActive,  setSatActive]  = useState(false)
  const [satStart,   setSatStart]   = useState('09:00')
  const [satEnd,     setSatEnd]     = useState('14:00')
  const [sunActive,  setSunActive]  = useState(false)
  const [sunStart,   setSunStart]   = useState('10:00')
  const [sunEnd,     setSunEnd]     = useState('15:00')

  const [slotDur,    setSlotDur]    = useState(30)
  const [breakDur,   setBreakDur]   = useState(0)
  const [minAdv,     setMinAdv]     = useState(0)

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const applySettings = useCallback((s: ScheduleSettings) => {
    setWorkDays(s.work_days)
    const split = !!s.break_start
    setAmStart(s.work_start)
    setAmEnd(split ? (s.break_start as string) : s.work_end)
    setPmActive(split)
    setPmStart(s.break_end ?? '14:00')
    setPmEnd(split ? s.work_end : '18:00')
    setSatActive(!!s.sat_start)
    setSatStart(s.sat_start ?? '09:00')
    setSatEnd(s.sat_end   ?? '14:00')
    setSunActive(!!s.sun_start)
    setSunStart(s.sun_start ?? '10:00')
    setSunEnd(s.sun_end   ?? '15:00')
    setSlotDur(s.slot_duration)
    setMinAdv(s.min_advance)
  }, [])

  useEffect(() => {
    getScheduleSettings(pro.businessId).then(s => {
      if (s) applySettings(s)
      setLoading(false)
    })
  }, [pro.businessId, applySettings])

  const toggleDay = (d: number) =>
    setWorkDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  const handleSave = async () => {
    setError(''); setSaved(false)
    if (workDays.length === 0) { setError('Selecciona al menos un día de atención'); return }
    if (pmActive) {
      if (amStart >= amEnd)  { setError('El rango de la mañana es inválido'); return }
      if (pmStart >= pmEnd)  { setError('El rango de la tarde es inválido'); return }
      if (amEnd >= pmStart)  { setError('El rango de la tarde debe comenzar después del de la mañana'); return }
    } else {
      if (amStart >= amEnd) { setError('El rango horario es inválido'); return }
    }
    if (satActive && satStart >= satEnd) { setError('Horario de sábado inválido'); return }
    if (sunActive && sunStart >= sunEnd) { setError('Horario de domingo inválido'); return }

    setSaving(true)
    try {
      await saveScheduleSettings({
        business_id:   pro.businessId,
        work_days:     workDays,
        work_start:    amStart,
        work_end:      pmActive ? pmEnd : amEnd,
        sat_start:     satActive ? satStart : null,
        sat_end:       satActive ? satEnd   : null,
        sun_start:     sunActive ? sunStart : null,
        sun_end:       sunActive ? sunEnd   : null,
        break_start:   pmActive ? amEnd   : null,
        break_end:     pmActive ? pmStart : null,
        slot_duration: slotDur,
        min_advance:   minAdv,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
      setTimeout(() => setError(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '2rem 0', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
      Cargando configuración…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── 1. Días de atención ── */}
      <Section number="1" title="Días de atención">
        <p style={{ fontSize: '.78rem', color: 'var(--color-ink-dim)', marginBottom: '.9rem' }}>
          Toca para activar o desactivar los días de jornada laboral.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '.5rem' }}>
          {DAY_LABELS.map((d, i) => {
            const active = workDays.includes(i)
            return (
              <button key={i} onClick={() => toggleDay(i)}
                style={{ padding: '.7rem .25rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'var(--color-gold)' : 'transparent', color: active ? 'var(--color-bg)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: active ? 600 : 300, letterSpacing: '.06em', cursor: 'pointer', transition: 'all .2s', borderRadius: '4px' }}
              >{d}</button>
            )
          })}
        </div>
      </Section>

      {/* ── 2. Rangos horarios ── */}
      <Section number="2" title="Rangos horarios">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Corrido / Partido */}
          <div style={{ border: '1px solid var(--color-rim-l)', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              {(['corrido', 'partido'] as const).map(opt => {
                const active = opt === 'corrido' ? !pmActive : pmActive
                return (
                  <button key={opt} onClick={() => setPmActive(opt === 'partido')}
                    style={{ flex: 1, padding: '.5rem .75rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'var(--color-gold)' : 'transparent', color: active ? 'var(--color-bg)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: active ? 600 : 300, letterSpacing: '.07em', cursor: 'pointer', transition: 'all .2s', borderRadius: '4px', textTransform: 'uppercase' }}
                  >{opt === 'corrido' ? 'Horario corrido' : 'Mañana y tarde'}</button>
                )
              })}
            </div>

            {!pmActive ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeField label="Desde" value={amStart} onChange={setAmStart} />
                <TimeField label="Hasta" value={pmEnd}   onChange={setPmEnd}   />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <div>
                  <span style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', display: 'block', marginBottom: '.4rem' }}>Mañana</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <TimeField label="Desde" value={amStart} onChange={setAmStart} />
                    <TimeField label="Hasta" value={amEnd}   onChange={setAmEnd}   />
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)', display: 'block', marginBottom: '.4rem' }}>Tarde</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <TimeField label="Desde" value={pmStart} onChange={setPmStart} />
                    <TimeField label="Hasta" value={pmEnd}   onChange={setPmEnd}   />
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Sábado */}
          <div style={{ border: '1px solid var(--color-rim-l)', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: satActive ? '.9rem' : 0 }}>
              <span style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Sábado (horario especial)</span>
              <Toggle checked={satActive} onChange={setSatActive} />
            </div>
            {satActive && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeField label="Desde" value={satStart} onChange={setSatStart} />
                <TimeField label="Hasta" value={satEnd}   onChange={setSatEnd}   />
              </div>
            )}
          </div>

          {/* Domingo */}
          <div style={{ border: '1px solid var(--color-rim-l)', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sunActive ? '.9rem' : 0 }}>
              <span style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>Domingo (horario especial)</span>
              <Toggle checked={sunActive} onChange={setSunActive} />
            </div>
            {sunActive && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeField label="Desde" value={sunStart} onChange={setSunStart} />
                <TimeField label="Hasta" value={sunEnd}   onChange={setSunEnd}   />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── 3. Parámetros ── */}
      <Section number="3" title="Parámetros">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <Label>Intervalo entre horarios:</Label>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {SLOT_OPTIONS.map(v => {
                const active = slotDur === v
                return (
                  <button key={v} onClick={() => setSlotDur(v)}
                    style={{ padding: '.5rem 1.25rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'var(--color-gold)' : 'transparent', color: active ? 'var(--color-bg)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: 400, cursor: 'pointer', transition: 'all .2s', borderRadius: '4px' }}
                  >{v} min</button>
                )
              })}
            </div>
          </div>

          <div>
            <Label>Anticipación mínima para reservar:</Label>
           
            <select value={minAdv} onChange={e => setMinAdv(parseInt(e.target.value))} style={{ maxWidth: '220px' }}>
              {ADVANCE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* ── Info banner ── */}
      <div style={{ display: 'flex', gap: '.75rem', padding: '1rem', border: '1px solid var(--color-rim-l)', background: 'rgba(196,153,90,.06)', borderRadius: '4px' }}>
        <span style={{ color: 'var(--color-gold)', fontSize: '1rem', lineHeight: 1 }}>ℹ</span>
        <p style={{ fontSize: '.75rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, margin: 0 }}>
          Los cambios solo afectarán a las nuevas citas. Las citas ya programadas permanecerán sin cambios.
        </p>
      </div>

      {/* ── Save ── */}
      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', padding: '1rem', background: saving ? 'var(--color-rim-l)' : 'var(--color-gold)', color: saving ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .3s', borderRadius: '4px' }}
        onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold-l)' }}
        onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold)' }}
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>

      <div style={{ position: 'fixed', left: '1rem', right: '1rem', bottom: saved ? '1.5rem' : '-4rem', maxWidth: '420px', margin: '0 auto', transition: 'bottom .35s ease', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '.6rem', background: 'var(--color-bg)', border: '1px solid var(--color-gold)', padding: '.85rem 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,.35)', borderRadius: '4px' }}>
        <span style={{ color: 'var(--color-gold)', fontSize: '1rem', flexShrink: 0 }}>✓</span>
        <span style={{ fontSize: '.8rem', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>Cambios guardados</span>
      </div>

      <div style={{ position: 'fixed', left: '1rem', right: '1rem', bottom: error ? '1.5rem' : '-4rem', maxWidth: '420px', margin: '0 auto', transition: 'bottom .35s ease', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.9rem', background: 'var(--color-bg)', border: '1px solid #c47070', padding: '.85rem 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,.35)', borderRadius: '4px' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>{error || 'Error al guardar'}</span>
        <button onClick={handleSave} disabled={saving}
          style={{ background: 'transparent', border: 'none', color: '#c47070', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >Reintentar</button>
      </div>
    </div>
  )
}

/* ── Mini components ── */

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.6rem', height: '1.6rem', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontSize: '.75rem', fontFamily: 'var(--font-body)', borderRadius: '50%', flexShrink: 0 }}>{number}</span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-ink)', margin: 0, fontWeight: 400 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ fontSize: '.63rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', display: 'block', marginBottom: '.35rem', ...style }}>{children}</label>
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', flex: 1 }}>
      <label style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>{label}</label>
      <input type="time" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%' }} />
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!checked)}
      style={{ width: '2.5rem', height: '1.3rem', background: checked ? 'var(--color-gold)' : 'var(--color-rim-l)', borderRadius: '999px', position: 'relative', cursor: disabled ? 'default' : 'pointer', transition: 'background .2s', flexShrink: 0, opacity: disabled ? .6 : 1 }}
    >
      <div style={{ position: 'absolute', top: 2, left: checked ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
    </div>
  )
}
