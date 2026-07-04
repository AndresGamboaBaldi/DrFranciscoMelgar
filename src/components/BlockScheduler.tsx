/**
 * BlockScheduler — panel de administración de horarios bloqueados
 * Accesible desde /?setup
 *
 * Permite al admin bloquear días completos o rangos de horas para
 * un profesional (ej: "hoy de 14:00 a 19:00 — conferencia").
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { useStaff } from '../context/StaffContext'
import { addBlocks, deleteBlock, getUpcomingBlocks, type BlockedSlot } from '../lib/supabase'

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function formatBlockDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTHS_ES[parseInt(m)-1]} ${y}`
}

function nextDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

interface BlockGroup {
  ids: string[]
  fromDate: string
  toDate: string
  start_time: string | null
  end_time: string | null
  reason?: string | null
}

function groupBlocks(blocks: BlockedSlot[]): BlockGroup[] {
  const groups: BlockGroup[] = []
  for (const b of blocks) {
    const last = groups[groups.length - 1]
    if (
      last &&
      last.start_time === b.start_time &&
      last.end_time === b.end_time &&
      last.reason === b.reason &&
      nextDay(last.toDate) === b.date
    ) {
      last.toDate = b.date
      last.ids.push(b.id)
    } else {
      groups.push({ ids: [b.id], fromDate: b.date, toDate: b.date, start_time: b.start_time, end_time: b.end_time, reason: b.reason })
    }
  }
  return groups
}

export default function BlockScheduler() {
  const pro = useProfessional()
  const staff = useStaff()
  const businessId = staff?.businessId ?? pro.businessId

  const [blocks, setBlocks]     = useState<BlockedSlot[]>([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string[] | null>(null)

  // Form state
  const [date,      setDate]      = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [reason,    setReason]    = useState('')
  const [fullDay,   setFullDay]   = useState(false)
  const [error,     setError]     = useState('')

  const loadBlocks = useCallback(async () => {
    setLoading(true)
    const data = await getUpcomingBlocks(businessId)
    setBlocks(data)
    setLoading(false)
  }, [businessId])

  useEffect(() => { loadBlocks() }, [loadBlocks])

  const handleAdd = async () => {
    setError('')
    if (!date) { setError('Selecciona una fecha'); return }
    if (endDate && endDate < date) { setError('La fecha final debe ser igual o posterior a la inicial'); return }
    if (!fullDay && (!startTime || !endTime)) { setError('Pon hora de inicio y fin, o marca "Todo el día"'); return }
    if (!fullDay && startTime >= endTime) { setError('La hora de inicio debe ser anterior a la de fin'); return }

    setSaving(true)
    try {
      const dates: string[] = []
      const cursor = new Date(date + 'T00:00:00')
      const last = new Date((endDate || date) + 'T00:00:00')
      while (cursor <= last) {
        dates.push(cursor.toISOString().split('T')[0])
        cursor.setDate(cursor.getDate() + 1)
      }

      await addBlocks(dates.map(d => ({
        business_id: businessId,
        date: d,
        start_time: fullDay ? null : startTime,
        end_time:   fullDay ? null : endTime,
        reason:     reason.trim() || null,
      })))
      setDate(''); setEndDate(''); setStartTime(''); setEndTime(''); setReason(''); setFullDay(false)
      await loadBlocks()
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    setDeleting(ids)
    try { await Promise.all(ids.map(id => deleteBlock(id, businessId))); await loadBlocks() }
    catch { alert('Error al eliminar') }
    finally { setDeleting(null) }
  }

  const groups = useMemo(() => groupBlocks(blocks), [blocks])

  // Today's ISO date for min attribute
  const todayIso = new Date().toISOString().split('T')[0]

  return (
    <div>

      {/* ── Add block form ── */}
      <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '1.75rem', marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: '1.5rem', color: 'var(--color-gold)'}}>
          Agregar bloqueo
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', minWidth: 0 }}>
            <label style={{ fontWeight:'500', fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Desde (fecha) *</label>
            <input type="date" value={date} min={todayIso} onChange={e => setDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', minWidth: 0 }}>
            <label style={{ fontWeight:'500', fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Hasta (fecha, opcional)</label>
            <input type="date" value={endDate} min={date || todayIso} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          {/* Full day toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', justifyContent: 'flex-end', minWidth: 0 }}>
            <label style={{ fontWeight:'500', display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.78rem', color: 'var(--color-ink-dim)', paddingBottom: '.7rem' }}>
              <input type="checkbox" checked={fullDay} onChange={e => setFullDay(e.target.checked)}
                style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-gold)', cursor: 'pointer', appearance: 'auto', WebkitAppearance: 'checkbox', flexShrink: 0 }} />
              Todo el día
            </label>
          </div>

          {/* Start / End time */}
          {!fullDay && (
            <div style={{ display: 'flex', gap: '1rem', minWidth: 0, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flex: 1, minWidth: 0 }}>
                <label style={{ fontWeight:'500',fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Desde *</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', flex: 1, minWidth: 0 }}>
                <label style={{ fontWeight:'500',fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Hasta *</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {/* Reason */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', gridColumn: '1 / -1', minWidth: 0 }}>
            <label style={{ fontWeight:'500', fontSize: '.62rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-ink-dim)' }}>Motivo (opcional)</label>
            <input type="text" placeholder="Ej: Conferencia, Vacaciones, Feriado..." value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>

        {error && <p style={{ fontSize: '.78rem', color: '#c47070', marginBottom: '.75rem' }}>{error}</p>}

        <button onClick={handleAdd} disabled={saving}
          style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '.6rem', padding: '1rem', marginTop: '1.5rem', background: saving ? 'var(--color-rim-l)' : 'var(--color-gold)', color: saving ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .3s', borderRadius: '4px' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold-l)' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-gold)' }}
        >
          {saving ? 'Guardando…' : 'Bloquear horario'}
        </button>
      </div>

      {/* ── Upcoming blocks list ── */}
      <div style={{ marginTop: '2.5rem', paddingBottom: '3rem' }}>
        {/* Section header — clearly visible */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '2px solid var(--color-gold)', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1 }}>
            Próximos bloqueos
          </h3>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-ink-dim)', flexShrink: 0 }}>
            {loading ? '…' : blocks.length === 0 ? 'ninguno' : `${blocks.length} ${blocks.length === 1 ? 'bloqueo' : 'bloqueos'}`}
          </span>
        </div>

        {!loading && blocks.length === 0 && (
          <div style={{ padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-ink-dim)' }}>
              Sin bloqueos programados
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)', marginTop: '.4rem' }}>
              Todos los horarios configurados están disponibles
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: groups.length ? 'var(--color-rim)' : 'transparent' }}>
          {groups.map(g => {
            const isDeleting = deleting?.[0] === g.ids[0]
            return (
            <div key={g.ids[0]} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', padding: '1.1rem 1.5rem', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--color-ink)' }}>
                    {g.fromDate === g.toDate ? formatBlockDate(g.fromDate) : `${formatBlockDate(g.fromDate)} — ${formatBlockDate(g.toDate)}`}
                  </span>
                  <span style={{ fontSize: '.88rem', color: 'var(--color-gold)', fontWeight: 400 }}>
                    {!g.start_time ? 'Todo el día' : `${g.start_time} — ${g.end_time}`}
                  </span>
                </div>
                {g.reason && <p style={{ fontSize: '.88rem', color: 'var(--color-ink-dim)', marginTop: '.25rem' }}>{g.reason}</p>}
              </div>
              <button onClick={() => handleDelete(g.ids)} disabled={isDeleting}
                style={{ background: 'none', border: '1px solid var(--color-rim-l)', color: isDeleting ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.76rem', letterSpacing: '.1em', textTransform: 'uppercase', padding: '.45rem 1rem', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all .2s', flexShrink: 0 }}
                onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.borderColor = '#c47070'; e.currentTarget.style.color = '#c47070' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                {isDeleting ? '…' : 'Quitar'}
              </button>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
