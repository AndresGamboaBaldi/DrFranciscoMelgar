/**
 * BlockScheduler — panel de administración de horarios bloqueados
 * Accesible desde /?setup
 *
 * Permite al admin bloquear días completos o rangos de horas para
 * un profesional (ej: "hoy de 14:00 a 19:00 — conferencia").
 */
import { useState, useEffect, useCallback } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { addBlock, deleteBlock, getUpcomingBlocks, type BlockedSlot } from '../lib/supabase'

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatBlockDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTHS_ES[parseInt(m)-1]} ${y}`
}

export default function BlockScheduler() {
  const pro = useProfessional()

  const [blocks, setBlocks]     = useState<BlockedSlot[]>([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [date,      setDate]      = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [reason,    setReason]    = useState('')
  const [fullDay,   setFullDay]   = useState(false)
  const [error,     setError]     = useState('')

  const loadBlocks = useCallback(async () => {
    setLoading(true)
    const data = await getUpcomingBlocks(pro.businessId)
    setBlocks(data)
    setLoading(false)
  }, [pro.businessId])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  const handleAdd = async () => {
    setError('')
    if (!date) { setError('Selecciona una fecha'); return }
    if (!fullDay && (!startTime || !endTime)) { setError('Pon hora de inicio y fin, o marca "Todo el día"'); return }
    if (!fullDay && startTime >= endTime) { setError('La hora de inicio debe ser anterior a la de fin'); return }

    setSaving(true)
    try {
      await addBlock({
        business_id:  pro.businessId,
        date,
        start_time: fullDay ? null : startTime,
        end_time:   fullDay ? null : endTime,
        reason:     reason.trim() || null,
      })
      setDate(''); setStartTime(''); setEndTime(''); setReason(''); setFullDay(false)
      await loadBlocks()
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try { await deleteBlock(id); await loadBlocks() }
    catch { alert('Error al eliminar') }
    finally { setDeleting(null) }
  }

  // Today's ISO date for min attribute
  const todayIso = new Date().toISOString().split('T')[0]

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-rim)', paddingTop: '2.5rem' }}>
      <p style={{ fontSize: '.88rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>
        Bloquear horarios — {pro.name}
      </p>

      {/* ── Add block form ── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.75rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: '1.5rem', color: 'var(--color-gold)'}}>
          Agregar bloqueo
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <label style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Fecha *</label>
            <input type="date" value={date} min={todayIso} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Full day toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.78rem', color: 'var(--color-ink-dim)', paddingBottom: '.7rem' }}>
              <input type="checkbox" checked={fullDay} onChange={e => setFullDay(e.target.checked)}
                style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-gold)', cursor: 'pointer', appearance: 'auto', WebkitAppearance: 'checkbox' }} />
              Todo el día
            </label>
          </div>

          {/* Start / End time */}
          {!fullDay && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <label style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Desde *</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <label style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Hasta *</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </>
          )}

          {/* Reason */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', gridColumn: fullDay ? 'span 2' : '1 / -1' }}>
            <label style={{ fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Motivo (opcional)</label>
            <input type="text" placeholder="Ej: Conferencia, Vacaciones, Feriado..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>

        {error && <p style={{ fontSize: '.78rem', color: '#c47070', marginBottom: '.75rem' }}>{error}</p>}

        <button onClick={handleAdd} disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.75rem 1.75rem', background: saving ? 'var(--color-rim-l)' : 'var(--color-gold)', color: 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .3s' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold-l)' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold)' }}
        >
          {saving ? 'Guardando…' : 'Bloquear horario'}
        </button>
      </div>

      {/* ── Upcoming blocks list ── */}
      <div style={{ marginTop: '2.5rem' }}>
        {/* Section header — clearly visible */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '2px solid var(--color-gold)', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1 }}>
            Próximos bloqueos
          </h3>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--color-ink-dim)', flexShrink: 0 }}>
            {loading ? '…' : blocks.length === 0 ? 'ninguno' : `${blocks.length} ${blocks.length === 1 ? 'bloqueo' : 'bloqueos'}`}
          </span>
        </div>

        {!loading && blocks.length === 0 && (
          <div style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-ink-dim)' }}>
              Sin bloqueos programados
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', marginTop: '.4rem' }}>
              Todos los horarios configurados están disponibles
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: blocks.length ? 'var(--color-rim)' : 'transparent' }}>
          {blocks.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', padding: '1.1rem 1.5rem', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--color-ink)' }}>
                    {formatBlockDate(b.date)}
                  </span>
                  <span style={{ fontSize: '.88rem', color: 'var(--color-gold)', fontWeight: 400 }}>
                    {!b.start_time ? 'Todo el día' : `${b.start_time} — ${b.end_time}`}
                  </span>
                </div>
                {b.reason && <p style={{ fontSize: '.88rem', color: 'var(--color-ink-dim)', marginTop: '.25rem' }}>{b.reason}</p>}
              </div>
              <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                style={{ background: 'none', border: '1px solid var(--color-rim-l)', color: deleting === b.id ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.76rem', letterSpacing: '.1em', textTransform: 'uppercase', padding: '.45rem 1rem', cursor: deleting === b.id ? 'not-allowed' : 'pointer', transition: 'all .2s', flexShrink: 0 }}
                onMouseEnter={e => { if (deleting !== b.id) { e.currentTarget.style.borderColor = '#c47070'; e.currentTarget.style.color = '#c47070' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                {deleting === b.id ? '…' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
