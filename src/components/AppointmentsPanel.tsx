import { useState, useEffect, useCallback } from 'react'
import { getAppointmentsByDate, cancelAppointment } from '../lib/supabase'
import type { Appointment } from '../types/booking'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function toISODate(d: Date): string {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
  return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function formatTime12h(time: string): string {
  const [h, min] = time.substring(0,5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2,'0')} ${period}`
}

function buildWhatsAppUrl(apt: Appointment, businessName: string): string {
  const phone = apt.phone.replace(/\D/g, '')
  const firstName = apt.name.split(' ')[0]
  const time = formatTime12h(apt.appointment_time)
  const [y, m, d] = apt.appointment_date.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dateLabel = `${DAYS_ES[dateObj.getDay()]} ${d} de ${MONTHS_ES[m - 1]}`
  const cancelUrl = `https://probo.pro/cancel/${apt.id}`
  const text = `Hola ${firstName}! 👋🏼\nTu cita con ${businessName} es el ${dateLabel} a las ${time}\n\n✅ Te esperamos!\n\nSi no puedes asistir, cancela aquí 👇🏼\n${cancelUrl}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export default function AppointmentsPanel({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [date, setDate]           = useState(() => new Date())
  const [appointments, setAppts]  = useState<Appointment[]>([])
  const [loading, setLoading]     = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Appointment | null>(null)

  const isoDate = toISODate(date)
  const todayIso = toISODate(new Date())
  const isToday = isoDate === todayIso
  const isPast  = isoDate < todayIso

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getAppointmentsByDate(businessId, isoDate)
    setAppts(data)
    setLoading(false)
  }, [businessId, isoDate])

  useEffect(() => { load() }, [load])

  const shiftDay = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d)
  }

  const handleCancel = async (apt: Appointment) => {
    if (!apt.id) return
    setCancelingId(apt.id)
    try {
      await cancelAppointment(apt.id)
      setAppts(prev => prev.filter(a => a.id !== apt.id))
    } catch (e) {
      alert('No se pudo cancelar la cita.')
      console.error(e)
    }
    setCancelingId(null)
  }

  const dateLabel = `${DAYS_ES[date.getDay()]}, ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Day navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <NavButton onClick={() => shiftDay(-1)} label="Día anterior">
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M7 1L1.5 6.5L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </NavButton>
          <div style={{ minWidth: '11rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--color-ink)', textTransform: 'capitalize', lineHeight: 1.3 }}>{dateLabel}</p>
            {isToday && <p style={{ fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)', marginTop: '.15rem' }}>Hoy</p>}
          </div>
          <NavButton onClick={() => shiftDay(1)} label="Día siguiente">
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none"><path d="M1 1L6.5 6.5L1 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </NavButton>
        </div>

        {!isToday && (
          <button onClick={() => setDate(new Date())}
            style={{ background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', padding: '.5rem 1rem', cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >
            Ir a hoy
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>Cargando…</div>
      ) : appointments.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--color-rim)', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>
          No hay citas para este día.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {appointments.map(apt => (
            <div key={apt.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-rim)',
                opacity: cancelingId === apt.id ? .5 : 1, transition: 'opacity .2s',
              }}
            >
              {/* Time */}
              <div style={{ minWidth: '4rem', textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-gold)', lineHeight: 1 }}>{apt.appointment_time.substring(0,5)}</p>
              </div>

              {/* Divider */}
              <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--color-rim)', flexShrink: 0 }} />

              {/* Details */}
              <div style={{ flex: 1, minWidth: '10rem' }}>
                <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--color-ink)', marginBottom: '.2rem' }}>{apt.name}</p>
                <p style={{ fontSize: '.82rem', color: 'var(--color-ink-dim)' }}>{apt.service}</p>
                {apt.notes && apt.notes !== 'Sin comentarios especiales' && (
                  <p style={{ fontSize: '.78rem', color: 'var(--color-ink-ghost)', marginTop: '.25rem', fontStyle: 'italic' }}>"{apt.notes}"</p>
                )}
              </div>

              {/* Status badge */}
              {apt.status === 'confirmed' && (
                <span style={{
                  fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', padding: '.3rem .65rem',
                  border: '1px solid var(--color-gold)',
                  color: 'var(--color-gold)',
                  flexShrink: 0,
                }}>
                  Confirmada
                </span>
              )}

              {/* Actions */}
              {!isPast && (
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <IconButton as="a" href={buildWhatsAppUrl(apt, businessName)} target="_blank" rel="noopener noreferrer" title="Confirmar por WhatsApp"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.4a9.9 9.9 0 0 0 4.63 1.18h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7C17.16 3.03 14.69 2 12.04 2zm0 18.13a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.18.83.85-3.1-.2-.32a8.18 8.18 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.27-8.24 2.21 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.55-3.7 8.25-8.26 8.25zm4.53-6.18c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.96-.14.17-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.65-1.23-1.46-1.38-1.7-.14-.25-.02-.39.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01s-.43.06-.66.31c-.23.25-.86.84-.86 2.04s.88 2.37 1 2.53c.12.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>
                </IconButton>

                <IconButton as="button" onClick={() => setConfirmTarget(apt)} disabled={cancelingId === apt.id} title="Cancelar cita"
                  style={{
                    background: 'none', borderColor: 'var(--color-rim-l)',
                    color: 'var(--color-ink-dim)', cursor: cancelingId === apt.id ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (cancelingId !== apt.id) { e.currentTarget.style.color = '#c47070'; e.currentTarget.style.borderColor = '#c47070' } }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </IconButton>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom cancel-confirmation dialog */}
      {confirmTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmTarget(null)}
        >
          <div style={{ width: '100%', maxWidth: '24rem', background: 'var(--color-bg)', border: '1px solid var(--color-rim)', padding: '2rem', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-ink)', fontWeight: 400, marginBottom: '.75rem' }}>
              ¿Cancelar esta cita?
            </h3>
            <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7, marginBottom: '2rem' }}>
              {confirmTarget.name} — {confirmTarget.appointment_time.substring(0,5)}<br />
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmTarget(null)}
                style={{ flex: 1, padding: '.85rem 1.5rem', background: 'none', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
              >
                Volver
              </button>
              <button onClick={() => { const apt = confirmTarget; setConfirmTarget(null); handleCancel(apt) }}
                style={{ flex: 1, padding: '.85rem 1.5rem', background: '#c47070', border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background .2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#d18a8a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#c47070')}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ICON_BTN_BASE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '2.4rem', height: '2.4rem', boxSizing: 'border-box',
  padding: 0, margin: 0, borderWidth: 1, borderStyle: 'solid',
  borderRadius: 0, lineHeight: 0, fontSize: 'inherit', fontFamily: 'inherit',
  textDecoration: 'none', transition: 'all .2s', flexShrink: 0, overflow: 'hidden',
}

type IconButtonProps = {
  as: 'a' | 'button'
  children: React.ReactNode
  style?: React.CSSProperties
} & React.HTMLAttributes<HTMLElement> & Record<string, unknown>

function IconButton({ as, children, style, ...rest }: IconButtonProps) {
  const merged = { ...ICON_BTN_BASE, ...style }
  if (as === 'a') return <a {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)} style={merged}>{children}</a>
  return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} style={merged}>{children}</button>
}

function NavButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '2.2rem', height: '2.2rem', background: 'none', border: '1px solid var(--color-rim-l)',
        color: 'var(--color-ink-dim)', cursor: 'pointer', transition: 'all .2s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
    >
      {children}
    </button>
  )
}
