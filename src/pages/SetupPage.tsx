import { useState, useEffect } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import ScheduleEditor from '../components/ScheduleEditor'
import BlockScheduler from '../components/BlockScheduler'
import { getWebcalUrl, getGoogleCalendarUrl } from '../lib/calendar'
import { subscribeToPush, getPushStatus } from '../lib/supabase'

type Section = 'schedule' | 'blocks' | 'calendar' | 'notificaciones'
type CalTab  = 'iphone'   | 'google'  | 'outlook'

const NAV: { id: Section; label: string; desc: string }[] = [
  { id: 'schedule',       label: 'Horarios',        desc: 'Días y horas de atención' },
  { id: 'blocks',         label: 'Bloqueos',        desc: 'Días no disponibles' },
  { id: 'calendar',       label: 'Calendario',      desc: 'Link mágico de sincronización' },
  { id: 'notificaciones', label: 'Notificaciones',  desc: 'Avisos de nuevas citas' },
]

const STEPS_IPHONE = [
  { n:1, title:'Abre Configuración',    desc:'En tu iPhone, entra a la app Configuración.' },
  { n:2, title:'Calendar → Cuentas',   desc:'Baja hasta "Calendario" → toca "Cuentas".' },
  { n:3, title:'Añadir cuenta → Otra', desc:'Toca "Añadir cuenta" y selecciona "Otra".' },
  { n:4, title:'Calendario suscrito',  desc:'Toca "Añadir calendario suscrito".' },
  { n:5, title:'Pega el link',         desc:'Pega el link en el campo Server y toca Siguiente.' },
  { n:6, title:'¡Listo!',             desc:'Tus citas aparecerán automáticamente.' },
]
const STEPS_GOOGLE = [
  { n:1, title:'Abre Google Calendar', desc:'En el navegador, entra a calendar.google.com.' },
  { n:2, title:'Otros calendarios',   desc:'Toca el "+" junto a "Otros calendarios".' },
  { n:3, title:'Desde URL',           desc:'Selecciona "Desde URL".' },
  { n:4, title:'Pega el link',        desc:'Pega el link y toca "Añadir calendario".' },
  { n:5, title:'¡Listo!',            desc:'Google Calendar sincronizará las citas automáticamente.' },
]
const STEPS_OUTLOOK = [
  { n:1, title:'Abre Outlook',          desc:'Entra a outlook.com o abre la app de escritorio.' },
  { n:2, title:'Agregar calendario',    desc:'Clic en el ícono de calendario → "Agregar calendario".' },
  { n:3, title:'Suscribirse desde web', desc:'Selecciona "Suscribirse desde la web".' },
  { n:4, title:'Pega el link',          desc:'Pega el link y haz clic en "Importar".' },
  { n:5, title:'¡Listo!',              desc:'Las citas aparecerán en tu Outlook.' },
]

export default function SetupPage() {
  const pro = useProfessional()
  const [section, setSection]       = useState<Section>('schedule')
  const [pushStatus, setPushStatus] = useState<'active' | 'inactive' | 'unsupported' | 'loading'>('loading')
  const [pushWorking, setPushWorking] = useState(false)

  useEffect(() => {
    getPushStatus(pro.doctorId).then(setPushStatus)
  }, [pro.doctorId])

  const handleSubscribe = async () => {
    setPushWorking(true)
    const result = await subscribeToPush(pro.doctorId)
    if (result === 'subscribed' || result === 'already') setPushStatus('active')
    else if (result === 'denied') alert('Permisos de notificación denegados. Actívalos en la configuración del navegador.')
    else if (result === 'unsupported') alert('Tu navegador no soporta notificaciones push.')
    setPushWorking(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', colorScheme: 'inherit' }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--color-nav-scrolled, var(--color-surface))',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-rim)',
        padding: '.85rem clamp(1rem, 4vw, 2.5rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
          {pro.logo && <img src={pro.logo} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold)', lineHeight: 1, marginBottom: '.2rem' }}>Panel Admin</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2.5vw,1.3rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pro.name}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(.85rem,2vw,1.1rem)', color: 'var(--color-ink-dim)' }} className="hidden sm:inline">
            {pro.title}
          </span>
          <a href={`/${pro.slug}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', textDecoration: 'none', border: '1px solid var(--color-rim-l)', padding: '.4rem .9rem', transition: 'all .2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-ink-ghost)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
          >
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M4.5 1L1 5l3.5 4M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Ver sitio
          </a>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '0 clamp(1rem,4vw,2.5rem)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {NAV.map(n => {
            const active = section === n.id
            return (
              <button key={n.id} onClick={() => setSection(n.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '.85rem 1.25rem',
                  borderBottom: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                  marginBottom: -1,
                  fontFamily: 'var(--font-body)', fontSize: '.78rem',
                  fontWeight: active ? 500 : 300,
                  letterSpacing: '.08em', textTransform: 'uppercase',
                  color: active ? 'var(--color-ink)' : 'var(--color-ink-dim)',
                  transition: 'color .2s, border-color .2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                {n.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1rem,4vw,2.5rem)' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>

          {section === 'schedule' && (
            <Panel title="Horarios de atención" desc="Configura los días y horas en que aceptas citas. Los cambios aplican de inmediato al calendario de reservas.">
              <ScheduleEditor />
            </Panel>
          )}

          {section === 'blocks' && (
            <Panel title="Bloquear horarios" desc="Marca días completos o rangos de horas en que no estarás disponible — vacaciones, conferencias, feriados.">
              <BlockScheduler />
            </Panel>
          )}

          {section === 'calendar' && (
            <Panel title="Link Mágico" desc="Agrega este link una sola vez y todas las citas aparecen automáticamente en tu calendario.">
              <MagicLinkPanel />
            </Panel>
          )}

          {section === 'notificaciones' && (
            <Panel title="Notificaciones push" desc="Recibe una notificación en este dispositivo cada vez que un paciente reserve una cita — sin WhatsApp.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', border: `1px solid ${pushStatus === 'active' ? 'var(--color-gold)' : 'var(--color-rim)'}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pushStatus === 'active' ? '#4caf50' : pushStatus === 'loading' ? 'var(--color-ink-ghost)' : '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)' }}>
                    {pushStatus === 'loading'      && 'Verificando…'}
                    {pushStatus === 'active'       && 'Notificaciones activas en este dispositivo'}
                    {pushStatus === 'inactive'     && 'Notificaciones no activadas en este dispositivo'}
                    {pushStatus === 'unsupported'  && 'Tu navegador no soporta notificaciones push'}
                  </span>
                </div>

                {pushStatus !== 'active' && pushStatus !== 'unsupported' && (
                  <button onClick={handleSubscribe} disabled={pushWorking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 2rem', background: pushWorking ? 'var(--color-rim-l)' : 'var(--color-gold)', color: pushWorking ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: pushWorking ? 'not-allowed' : 'pointer', transition: 'background .3s', alignSelf: 'flex-start' }}
                    onMouseEnter={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold-l)' }}
                    onMouseLeave={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold)' }}
                  >
                    🔔 {pushWorking ? 'Activando…' : 'Activar notificaciones'}
                  </button>
                )}

                {/* iOS instructions */}
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--color-ink-dim)', marginBottom: '.6rem' }}>📱 ¿Usas iPhone?</p>
                  <ol style={{ fontSize: '.75rem', color: 'var(--color-ink-ghost)', lineHeight: 2, paddingLeft: '1.2rem', margin: 0 }}>
                    <li>Abre esta página en <strong style={{ color: 'var(--color-ink-dim)' }}>Safari</strong></li>
                    <li>Toca el botón <strong style={{ color: 'var(--color-ink-dim)' }}>Compartir</strong> (cuadrado con flecha)</li>
                    <li>Toca <strong style={{ color: 'var(--color-ink-dim)' }}>Agregar a pantalla de inicio</strong></li>
                    <li>Abre la app desde tu home y vuelve aquí</li>
                  </ol>
                </div>

                <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', lineHeight: 1.7 }}>
                  Las notificaciones se activan por dispositivo. Si usas varios, actívalas en cada uno.
                </p>
              </div>
            </Panel>
          )}

        </div>
      </main>
    </div>
  )
}

/* ── Panel wrapper ── */
function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)', marginBottom: '.45rem' }}>
          {title}
        </h2>
        <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{desc}</p>
      </div>
      {children}
    </div>
  )
}

/* ── Magic Link panel ── */
function MagicLinkPanel() {
  const pro = useProfessional()
  const [copied, setCopied]       = useState(false)
  const [calTab, setCalTab]       = useState<CalTab>('iphone')
  const [showSteps, setShowSteps] = useState(false)

  const feedUrl   = pro.calendarFeedUrl
  const webcalUrl = getWebcalUrl(feedUrl)
  const googleUrl = getGoogleCalendarUrl(feedUrl)
  const steps     = calTab === 'iphone' ? STEPS_IPHONE : calTab === 'google' ? STEPS_GOOGLE : STEPS_OUTLOOK

  const copy = async () => {
    if (!feedUrl) return
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!feedUrl) return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>
        ⚠️ Configura <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', color: 'var(--color-gold)', fontSize: '.8rem' }}>calendarFeedUrl</code> en{' '}
        <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', fontSize: '.8rem' }}>src/data/professionals.ts</code>
      </p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* URL row */}
      <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)' }}>
        <div style={{ flex: 1, background: 'var(--color-surface)', padding: '.85rem 1.25rem', fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feedUrl}
        </div>
        <button onClick={copy}
          style={{ padding: '.85rem 1.5rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0 }}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Quick buttons */}
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
        <a href={webcalUrl}
          style={OUTLINE_BTN}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
        >📱 Abrir en iPhone</a>
        <a href={googleUrl} target="_blank" rel="noreferrer"
          style={OUTLINE_BTN}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
        >🔵 Google Calendar</a>
      </div>

      {/* Collapsible instructions */}
      <div>
        <button onClick={() => setShowSteps(s => !s)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(196,153,90,.08)', border: '1px solid rgba(196,153,90,.25)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.5rem 1rem', cursor: 'pointer', transition: 'background .2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,153,90,.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(196,153,90,.08)')}
        >
          <span style={{ display: 'inline-block', transform: showSteps ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s', fontSize: '.55rem' }}>▶</span>
          {showSteps ? 'Ocultar instrucciones' : 'Ver instrucciones paso a paso'}
        </button>

        {showSteps && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rim)', marginBottom: '1.25rem' }}>
              {([['iphone','📱 iPhone'],['google','🔵 Google'],['outlook','💼 Outlook']] as [CalTab,string][]).map(([id,label]) => (
                <button key={id} onClick={() => setCalTab(id)}
                  style={{ padding: '.6rem 1.1rem', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: calTab===id?500:300, letterSpacing: '.08em', textTransform: 'uppercase', color: calTab===id?'var(--color-ink)':'var(--color-ink-dim)', borderBottom: `2px solid ${calTab===id?'var(--color-gold)':'transparent'}`, cursor: 'pointer', marginBottom: -1, transition: 'color .2s' }}
                >{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-rim)' }}>
              {steps.map((step, i) => (
                <div key={step.n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--color-surface)', padding: '.9rem 1.25rem' }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', border: `1.5px solid ${i===steps.length-1?'var(--color-gold)':'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', flexShrink: 0, color: i===steps.length-1?'var(--color-gold)':'var(--color-ink-dim)', background: i===steps.length-1?'rgba(196,153,90,.08)':'transparent' }}>
                    {i===steps.length-1?'✓':step.n}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.15rem' }}>{step.title}</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--color-ink-dim)', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const OUTLINE_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
  padding: '.55rem 1.1rem',
  background: 'transparent', border: '1px solid var(--color-rim-l)',
  color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)',
  fontSize: '.72rem', fontWeight: 300, letterSpacing: '.1em',
  textTransform: 'uppercase', textDecoration: 'none', transition: 'all .2s',
}
