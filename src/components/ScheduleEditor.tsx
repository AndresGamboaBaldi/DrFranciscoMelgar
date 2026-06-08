import { useState, useEffect, useCallback } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { getScheduleSettings, saveScheduleSettings, type ScheduleSettings } from '../lib/supabase'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SLOT_OPTIONS = [15, 30, 45, 60]
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

  // corrido = sin pausa; split = mañana + tarde
  const [workDays,   setWorkDays]   = useState<number[]>([1,2,3,4,5])
  const [corrido,    setCorrido]    = useState(true)
  const [amStart,    setAmStart]    = useState('08:00')
  const [amEnd,      setAmEnd]      = useState('13:00')
  const [pmStart,    setPmStart]    = useState('14:00')
  const [pmEnd,      setPmEnd]      = useState('18:00')
  const [satActive,  setSatActive]  = useState(false)
  const [satStart,   setSatStart]   = useState('09:00')
  const [satEnd,     setSatEnd]     = useState('14:00')
  const [sunActive,  setSunActive]  = useState(false)
  const [sunStart,   setSunStart]   = useState('10:00')
  const [sunEnd,     setSunEnd]     = useState('15:00')
  const [slotDur,    setSlotDur]    = useState(30)
  const [minAdv,     setMinAdv]     = useState(0)

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const applySettings = useCallback((s: ScheduleSettings) => {
    setWorkDays(s.work_days)
    setCorrido(!s.break_start)
    setAmStart(s.work_start)
    setAmEnd(s.break_start ?? '13:00')
    setPmStart(s.break_end ?? '14:00')
    setPmEnd(s.work_end)
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
    if (corrido) {
      if (amStart >= pmEnd) { setError('La hora de inicio debe ser anterior a la de cierre'); return }
    } else {
      if (amStart >= amEnd)  { setError('Horario mañana inválido'); return }
      if (pmStart >= pmEnd)  { setError('Horario tarde inválido'); return }
      if (amEnd >= pmStart)  { setError('El horario de tarde debe comenzar después del horario de mañana'); return }
    }
    if (satActive && satStart >= satEnd) { setError('Horario de sábado inválido'); return }
    if (sunActive && sunStart >= sunEnd) { setError('Horario de domingo inválido'); return }

    setSaving(true)
    try {
      await saveScheduleSettings({
        business_id:     pro.businessId,
        work_days:     workDays,
        work_start:    amStart,
        work_end:      corrido ? pmEnd : pmEnd,
        sat_start:     satActive ? satStart : null,
        sat_end:       satActive ? satEnd   : null,
        sun_start:     sunActive ? sunStart : null,
        sun_end:       sunActive ? sunEnd   : null,
        break_start:   corrido ? null : amEnd,
        break_end:     corrido ? null : pmStart,
        slot_duration: slotDur,
        min_advance:   minAdv,
      })
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Days of week ── */}
      <div>
        <Label>Días de atención</Label>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.6rem' }}>
          {DAY_LABELS.map((d, i) => {
            const active = workDays.includes(i)
            return (
              <button key={i} onClick={() => toggleDay(i)}
                style={{ padding: '.5rem 1rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'rgba(196,153,90,.1)' : 'transparent', color: active ? 'var(--color-gold)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: active ? 400 : 300, letterSpacing: '.08em', cursor: 'pointer', transition: 'all .2s' }}
              >{d}</button>
            )
          })}
        </div>
      </div>

      {/* ── Horario ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Toggle corrido / partido */}
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {(['corrido', 'partido'] as const).map(opt => {
            const active = opt === 'corrido' ? corrido : !corrido
            return (
              <button key={opt} onClick={() => setCorrido(opt === 'corrido')}
                style={{ padding: '.45rem 1.1rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'rgba(196,153,90,.1)' : 'transparent', color: active ? 'var(--color-gold)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.73rem', fontWeight: active ? 400 : 300, letterSpacing: '.07em', cursor: 'pointer', transition: 'all .2s', textTransform: 'capitalize' }}
              >{opt === 'corrido' ? 'Horario corrido' : 'Mañana y tarde'}</button>
            )
          })}
        </div>

        {corrido ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <TimeField label="Desde" value={amStart} onChange={setAmStart} />
            <span style={{ color: 'var(--color-ink-dim)', fontSize: '.8rem' }}>→</span>
            <TimeField label="Hasta" value={pmEnd}   onChange={setPmEnd}   />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <Label>Mañana</Label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeField label="Desde" value={amStart} onChange={setAmStart} />
                <span style={{ color: 'var(--color-ink-dim)', fontSize: '.8rem' }}>→</span>
                <TimeField label="Hasta" value={amEnd}   onChange={setAmEnd}   />
              </div>
            </div>
            <div>
              <Label>Tarde</Label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <TimeField label="Desde" value={pmStart} onChange={setPmStart} />
                <span style={{ color: 'var(--color-ink-dim)', fontSize: '.8rem' }}>→</span>
                <TimeField label="Hasta" value={pmEnd}   onChange={setPmEnd}   />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Saturday ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
          <Toggle checked={satActive} onChange={setSatActive} />
          <Label style={{ margin: 0 }}>Sábado con horario especial</Label>
        </div>
        {satActive && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <TimeField label="Desde" value={satStart} onChange={setSatStart} />
            <span style={{ color: 'var(--color-ink-dim)', fontSize: '.8rem' }}>→</span>
            <TimeField label="Hasta" value={satEnd}   onChange={setSatEnd}   />
          </div>
        )}
      </div>

      {/* ── Sunday ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
          <Toggle checked={sunActive} onChange={setSunActive} />
          <Label style={{ margin: 0 }}>Domingo con horario especial</Label>
        </div>
        {sunActive && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <TimeField label="Desde" value={sunStart} onChange={setSunStart} />
            <span style={{ color: 'var(--color-ink-dim)', fontSize: '.8rem' }}>→</span>
            <TimeField label="Hasta" value={sunEnd}   onChange={setSunEnd}   />
          </div>
        )}
      </div>

      {/* ── Slot duration ── */}
      <div>
        <Label>Duración de cada cita</Label>
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
          {SLOT_OPTIONS.map(v => {
            const active = slotDur === v
            return (
              <button key={v} onClick={() => setSlotDur(v)}
                style={{ padding: '.5rem 1.25rem', border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, background: active ? 'var(--color-gold)' : 'transparent', color: active ? 'var(--color-bg)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.75rem', fontWeight: 400, cursor: 'pointer', transition: 'all .2s' }}
              >{v} min</button>
            )
          })}
        </div>
      </div>

      {/* ── Advance notice ── */}
      <div>
        <Label>Anticipación mínima para reservar</Label>
        <select value={minAdv} onChange={e => setMinAdv(parseInt(e.target.value))} style={{ marginTop: '.6rem', maxWidth: '220px' }}>
          {ADVANCE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      {/* ── Save ── */}
      {error && <p style={{ fontSize: '.78rem', color: '#c47070' }}>{error}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={handleSave} disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 2rem', background: saving ? 'var(--color-rim-l)' : 'var(--color-gold)', color: saving ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .3s' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold-l)' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold)' }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {saved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}
          onClick={() => setSaved(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', maxWidth: '380px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--color-gold)', marginBottom: '.75rem' }}>✓</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--color-ink)', marginBottom: '.5rem' }}>Cambios guardados</div>
            <p style={{ fontSize: '.78rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Tu horario se actualizó y ya está disponible para tus pacientes.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <a href={`/${pro.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '.8rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Ver mi página
              </a>
              <button onClick={() => setSaved(false)}
                style={{ padding: '.8rem 1.5rem', background: 'transparent', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: '1px solid var(--color-rim)', cursor: 'pointer' }}>
                Seguir en configuración
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', lineHeight: 1.7 }}>
        Los cambios aplican inmediatamente al calendario de reservas de los pacientes.
      </p>
    </div>
  )
}

/* ── Mini components ── */

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ fontSize: '.63rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', display: 'block', marginBottom: '.35rem', ...style }}>{children}</label>
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
      <label style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-ink-ghost)' }}>{label}</label>
      <input type="time" value={value} onChange={e => onChange(e.target.value)} style={{ width: '120px' }} />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: '2.5rem', height: '1.3rem', background: checked ? 'var(--color-gold)' : 'var(--color-rim-l)', borderRadius: '999px', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}
    >
      <div style={{ position: 'absolute', top: 2, left: checked ? 'calc(100% - 18px)' : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
    </div>
  )
}
