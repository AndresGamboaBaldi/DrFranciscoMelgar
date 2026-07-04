import { useState, useEffect, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { getAppointmentById, cancelAppointment } from '../lib/supabase'
import { PROFESSIONALS } from '../data/professionals'
import type { Appointment } from '../types/booking'

const GOLD = '#c4995a'
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS_ES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function formatTime12h(time: string): string {
  const [h, min] = time.substring(0,5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2,'0')} ${period}`
}

export default function CancelPage() {
  const { id } = useParams<{ id: string }>()
  const [apt, setApt]         = useState<Appointment | null | undefined>(undefined)
  const [working, setWorking] = useState(false)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!id) return
    getAppointmentById(id).then(setApt)
  }, [id])

  // Load Bebas Neue / Inter, same typography as /setup
  useEffect(() => {
    const id2 = 'gf-bebas-inter'
    if (document.getElementById(id2)) return
    const link = document.createElement('link')
    link.id   = id2
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const businessName = apt?.business_id
    ? Object.values(PROFESSIONALS).find(p => p.businessId === apt.business_id)?.name
    : undefined
  const businessSlug = apt?.business_id
    ? Object.values(PROFESSIONALS).find(p => p.businessId === apt.business_id)?.slug
    : undefined

  const handleCancel = async () => {
    if (!id) return
    setWorking(true)
    try {
      await cancelAppointment(id)
      setDone(true)
    } catch {
      alert('No se pudo cancelar la cita. Intenta de nuevo.')
    }
    setWorking(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0907', color: '#ede8df', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', '--font-display': "'Bebas Neue', serif", '--font-body': "'Inter', sans-serif" } as CSSProperties}>
      <div style={{ width: '100%', maxWidth: '26rem', textAlign: 'center', border: '1px solid rgba(255,255,255,.1)', padding: '2.5rem 2rem', background: '#0e0c0a' }}>

        {apt === undefined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {[60, 40, 80, 40].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: i === 0 ? '2rem' : '1rem', maxWidth: `${w}%`, margin: '0 auto', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        )}

        {apt === null && (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '.75rem' }}>Cita no encontrada</h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.6)' }}>El link no es válido o la cita ya no existe.</p>
          </>
        )}

        {apt && apt.status === 'cancelled' && !done && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><CheckCircle2 size={44} color={GOLD} strokeWidth={1.5} /></div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '.75rem' }}>Esta cita ya fue cancelada</h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.6)' }}>No es necesario hacer nada más.</p>
          </>
        )}

        {apt && apt.status !== 'cancelled' && !done && (() => {
          const [y, m, d] = apt.appointment_date.split('-').map(Number)
          const dateObj = new Date(y, m - 1, d)
          const dateLabel = `${DAYS_ES[dateObj.getDay()]} ${d} de ${MONTHS_ES[m - 1]}`
          return (
            <>
              <p style={{ fontSize: '.8rem', letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: '1rem' }}>Cancelar cita</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '1.5rem' }}>
                {businessName ?? 'Tu cita'}
              </h1>
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                <Row label="Servicio" value={apt.service} />
                <Row label="Fecha" value={dateLabel} />
                <Row label="Hora" value={formatTime12h(apt.appointment_time)} />
              </div>
              <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.7, marginBottom: '2rem' }}>
                ¿Seguro que quieres cancelar esta cita? Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '.75rem' }}>
                {businessSlug && (
                  <Link to={`/${businessSlug}`}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '.9rem 1rem', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all .2s' }}
                  >
                    Volver
                  </Link>
                )}
                <button onClick={handleCancel} disabled={working}
                  style={{ flex: 1, padding: '.9rem 1rem', background: '#c47070', border: 'none', color: '#fff', fontSize: '.72rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', cursor: working ? 'not-allowed' : 'pointer', opacity: working ? .6 : 1, transition: 'background .2s' }}
                >
                  {working ? 'Cancelando…' : 'Sí, cancelar'}
                </button>
              </div>
            </>
          )
        })()}

        {done && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><CheckCircle2 size={44} color={GOLD} strokeWidth={1.5} /></div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '.75rem' }}>Cita cancelada</h1>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.6)', marginBottom: businessSlug ? '2rem' : 0 }}>
              Tu cita fue cancelada correctamente. ¡Gracias por avisar!
            </p>
            {businessSlug && (
              <Link to={`/${businessSlug}`}
                style={{ display: 'inline-flex', padding: '.9rem 1.75rem', background: GOLD, color: '#0a0907', fontSize: '.72rem', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none' }}
              >
                Ir a la página
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.88rem' }}>
      <span style={{ color: 'rgba(255,255,255,.5)' }}>{label}</span>
      <span style={{ color: '#fff' }}>{value}</span>
    </div>
  )
}
