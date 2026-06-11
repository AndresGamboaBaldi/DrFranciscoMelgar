import { useState, useEffect, type CSSProperties } from 'react'
import { CalendarDays, Clock, Settings } from 'lucide-react'
import { useProfessional } from '../context/ProfessionalContext'
import { useStaff } from '../context/StaffContext'
import ScheduleEditor from '../components/ScheduleEditor'
import BlockScheduler from '../components/BlockScheduler'
import AppointmentsPanel from '../components/AppointmentsPanel'
import { getWebcalUrl, getGoogleCalendarUrl } from '../lib/calendar'
import { subscribeToPush, getPushStatus } from '../lib/supabase'

type Section = 'citas' | 'schedule' | 'config'
type CalTab  = 'iphone'   | 'google'  | 'outlook'

const NAV: { id: Section; label: string; desc: string; icon: typeof CalendarDays }[] = [
  { id: 'citas',    label: 'Citas',                 desc: 'Agenda del día',                  icon: CalendarDays },
  { id: 'schedule', label: 'Horarios',              desc: 'Días y horas de atención',         icon: Clock },
  { id: 'config',   label: 'Configuración inicial', desc: 'Calendario y notificaciones',      icon: Settings },
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
  const staff = useStaff()
  const businessId  = staff?.businessId ?? pro.businessId
  const displayName = staff?.name ?? pro.name
  const [section, setSection]       = useState<Section>('citas')
  const [pushStatus, setPushStatus] = useState<'active' | 'inactive' | 'unsupported' | 'loading'>('loading')
  const [showIosSteps, setShowIosSteps] = useState(false)
  const [pushWorking, setPushWorking] = useState(false)

  useEffect(() => {
    getPushStatus(businessId).then(setPushStatus)
  }, [businessId])

  // Setup page always uses the Bebas Neue / Inter typography, regardless of professional theme
  useEffect(() => {
    const id = 'gf-setup-bebas-inter'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const handleSubscribe = async () => {
    setPushWorking(true)
    const result = await subscribeToPush(businessId)
    if (result === 'subscribed' || result === 'already') setPushStatus('active')
    else if (result === 'denied') alert('Permisos de notificación denegados. Actívalos en la configuración del navegador.')
    else if (result === 'unsupported') alert('Tu navegador no soporta notificaciones push.')
    setPushWorking(false)
  }

  const handleUnsubscribe = async () => {
    setPushWorking(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) await sub.unsubscribe()
      setPushStatus('inactive')
    } catch (e) {
      console.error('[Push] unsubscribe failed:', e)
    }
    setPushWorking(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', colorScheme: 'inherit', '--font-display': "'Bebas Neue', serif", '--font-body': "'Inter', sans-serif" } as CSSProperties}>

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
          <a href={`/${pro.slug}`} aria-label="Volver a mi página"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '2.1rem', height: '2.1rem', flexShrink: 0, color: 'var(--color-gold)', background: 'transparent', textDecoration: 'none', border: 'none', transition: 'opacity .2s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.7' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="16" height="14" viewBox="0 0 12 10" fill="none"><path d="M4.5 1L1 5l3.5 4M1 5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </a>
          {pro.logo && <img src={pro.logo} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3.8vw,2.1rem)', fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Tab bar (desktop/tablet) ── */}
      <div className="setup-tabbar-top" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-rim)', padding: '0 clamp(1rem,4vw,2.5rem)', overflowX: 'auto', overflowY: 'hidden' }}>
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
      <main className="setup-main-mobile-pad" style={{ flex: 1, padding: 'clamp(1.5rem,3vw,2.5rem) clamp(1rem,4vw,2.5rem)' }}>
        <div style={{ maxWidth: (section === 'schedule' || section === 'config') ? '100rem' : '48rem', margin: '0 auto' }}>

          {section === 'citas' && (
            <div style={{ paddingBottom: '3rem' }}>
              <AppointmentsPanel businessId={businessId} businessName={displayName} />
            </div>
          )}

          {section === 'schedule' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '3rem', alignItems: 'start' }}>
              <Panel title="Horarios de atención" desc="">
                <ScheduleEditor />
              </Panel>

              <Panel title="Bloquear horarios (opcional)" desc="Cuando lo necesites, marca días completos o rangos de horas en que no estarás disponible — vacaciones, conferencias, feriados.">
                <BlockScheduler />
              </Panel>
            </div>
          )}

          {section === 'config' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: '3rem', alignItems: 'start', paddingBottom: '3rem' }}>
              <Panel title="Sincroniza tu calendario" desc="Conecta tu calendario una sola vez y todas las citas aparecerán automáticamente, sin que tengas que hacer nada más.">
                <MagicLinkPanel />
              </Panel>

              <Panel title="Notificaciones push" desc="Recibe una notificación en este dispositivo cada vez que un paciente reserve una cita — sin WhatsApp.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', border: `1px solid ${pushStatus === 'active' ? 'var(--color-gold)' : 'var(--color-rim)'}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pushStatus === 'active' ? '#4caf50' : pushStatus === 'loading' ? 'var(--color-ink-ghost)' : '#888', flexShrink: 0 }} />
                  <span style={{ fontSize: '.95rem', color: 'var(--color-ink-dim)' }}>
                    {pushStatus === 'loading'      && 'Verificando…'}
                    {pushStatus === 'active'       && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>Activadas</strong></>}
                    {pushStatus === 'inactive'     && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>Desactivadas</strong></>}
                    {pushStatus === 'unsupported'  && <>Estado de notificaciones: <strong style={{ color: 'var(--color-ink)' }}>No disponibles en este navegador</strong> — sigue las instrucciones abajo</>}
                  </span>
                </div>

                {pushStatus !== 'active' && pushStatus !== 'unsupported' && (
                  <button onClick={handleSubscribe} disabled={pushWorking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '1rem 2rem', background: pushWorking ? 'var(--color-rim-l)' : 'var(--color-gold)', color: pushWorking ? 'var(--color-ink-ghost)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: pushWorking ? 'not-allowed' : 'pointer', transition: 'background .3s', alignSelf: 'flex-start', borderRadius: '4px' }}
                    onMouseEnter={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold-l)' }}
                    onMouseLeave={e => { if (!pushWorking) e.currentTarget.style.background = 'var(--color-gold)' }}
                  >
                    🔔 {pushWorking ? 'Activando…' : 'Activar notificaciones'}
                  </button>
                )}

                {pushStatus === 'active' && (
                  <button onClick={handleUnsubscribe} disabled={pushWorking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 2rem', background: 'none', border: '1px solid var(--color-rim-l)', color: pushWorking ? 'var(--color-ink-ghost)' : 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 300, letterSpacing: '.12em', textTransform: 'uppercase', cursor: pushWorking ? 'not-allowed' : 'pointer', transition: 'all .3s', alignSelf: 'flex-start' }}
                    onMouseEnter={e => { if (!pushWorking) { e.currentTarget.style.color = '#c47070'; e.currentTarget.style.borderColor = '#c47070' } }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-dim)'; e.currentTarget.style.borderColor = 'var(--color-rim-l)' }}
                  >
                    🔕 {pushWorking ? 'Desactivando…' : 'Desactivar notificaciones'}
                  </button>
                )}

                {/* iOS instructions (collapsible) */}
                {pushStatus !== 'active' && (
                <div>
                  <button onClick={() => setShowIosSteps(s => !s)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(196,153,90,.08)', border: '1px solid rgba(196,153,90,.25)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', padding: '.5rem 1rem', cursor: 'pointer', transition: 'background .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,153,90,.14)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(196,153,90,.08)')}
                  >
                    <span style={{ display: 'inline-block', transform: showIosSteps ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .25s', fontSize: '.55rem' }}>▶</span>
                    {showIosSteps ? 'Ocultar pasos adicionales' : '📱 ¿Usas iPhone? Ver pasos adicionales'}
                  </button>

                  {showIosSteps && (
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1rem 1.25rem', marginTop: '1rem' }}>
                      <ol style={{ fontSize: '.88rem', color: 'var(--color-ink-ghost)', lineHeight: 2.1, paddingLeft: '1.2rem', margin: 0 }}>
                        <li>Abre esta página en <strong style={{ color: 'var(--color-ink-dim)' }}>Safari</strong></li>
                        <li>Toca el botón <strong style={{ color: 'var(--color-ink-dim)' }}>Compartir</strong> (cuadrado con flecha hacia arriba)</li>
                        <li>Toca <strong style={{ color: 'var(--color-ink-dim)' }}>Ver más</strong> y luego <strong style={{ color: 'var(--color-ink-dim)' }}>Agregar a inicio</strong></li>
                        <li>Abre la app desde la pantalla de inicio de tu celular</li>
                        <li>Vuelve aquí y toca <strong style={{ color: 'var(--color-ink-dim)' }}>Activar notificaciones</strong></li>
                      </ol>
                    </div>
                  )}
                </div>
                )}

                <p style={{ fontSize: '.85rem', color: 'var(--color-ink-ghost)', lineHeight: 1.7 }}>
                  Las notificaciones se activan por dispositivo. Si usas varios, actívalas en cada uno.
                </p>
              </div>
              </Panel>
            </div>
          )}

          {section === 'config' && <SupportFooter />}
        </div>
      </main>

      {/* ── Tab bar (mobile, fixed bottom) ── */}
      <nav className="setup-tabbar-bottom">
        {NAV.map(n => {
          const active = section === n.id
          const Icon = n.icon
          return (
            <button key={n.id} onClick={() => setSection(n.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '.3rem', padding: '.7rem .25rem .35rem', minHeight: '3.75rem', background: 'none', border: 'none',
                borderTop: `2px solid ${active ? 'var(--color-gold)' : 'transparent'}`,
                marginTop: -1, cursor: 'pointer',
                color: active ? 'var(--color-gold)' : 'var(--color-ink-dim)',
                fontFamily: 'var(--font-body)', fontSize: '.68rem',
                fontWeight: active ? 500 : 300, letterSpacing: '.04em', textTransform: 'uppercase',
                transition: 'color .2s, border-color .2s',
              }}
            >
              <Icon size={22} color={active ? 'var(--color-gold)' : 'var(--color-ink-dim)'}/>
              {n.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* ── Panel wrapper ── */
function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,2.5rem)', fontWeight: 400, letterSpacing: '-.02em', color: 'var(--color-ink)', marginBottom: desc ? '.45rem' : 0, textTransform: 'capitalize' }}>
          {title}
        </h2>
        {desc && <p style={{ fontSize: '1rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

/* ── Support footer (shown at bottom of every tab) ── */
function SupportFooter() {
  const phone = '59172235605'
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Hola, tengo una consulta sobre mi configuración en Probo.pro')}`
  return (
    <div className="support-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-rim)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.7, margin: 0 }}>
        ¿Tienes algún problema o no encuentras lo que buscas?<br />Contáctanos por WhatsApp y te ayudamos.
      </p>
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 1.5rem', background: '#25D366', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        💬 Escribir por WhatsApp
      </a>
    </div>
  )
}

/* ── Magic Link panel ── */
function MagicLinkPanel() {
  const pro = useProfessional()
  const staff = useStaff()
  const [copied, setCopied]       = useState(false)
  const [calTab, setCalTab]       = useState<CalTab>('iphone')
  const [showSteps, setShowSteps] = useState(false)

  const feedUrl   = staff?.calendarFeedUrl ?? pro.calendarFeedUrl
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
      {/* Quick sync buttons */}
      <div>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '.85rem' }}>
          Primero, prueba sincronizar con un toque:
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <a href={webcalUrl}
            style={{ ...OUTLINE_BTN, borderColor: 'var(--color-gold)', color: 'var(--color-ink)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,153,90,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >📱 Sincronizar en iPhone</a>
          <a href={googleUrl} target="_blank" rel="noreferrer"
            style={{ ...OUTLINE_BTN, borderColor: 'var(--color-gold)', color: 'var(--color-ink)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,153,90,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >🔵 Sincronizar con Google Calendar</a>
        </div>
      </div>

      {/* Fallback: link + instructions */}
      <div>
        <p style={{ fontSize: '.85rem', color: 'var(--color-ink-dim)', lineHeight: 1.6, marginBottom: '.85rem' }}>
          ¿No funcionó? Copia este link y agrégalo manualmente siguiendo las instrucciones:
        </p>
        <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)' }}>
          <div style={{ flex: 1, background: 'var(--color-surface)', padding: '.85rem 1.25rem', fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {feedUrl}
          </div>
          <button onClick={copy}
            style={{ padding: '1rem 1.5rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0, borderRadius: '4px' }}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
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
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.15rem' }}>{step.title}</div>
                    <div style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', lineHeight: 1.6 }}>{step.desc}</div>
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
