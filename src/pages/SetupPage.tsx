import { useState } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import ScheduleEditor  from '../components/ScheduleEditor'
import BlockScheduler  from '../components/BlockScheduler'
import { getWebcalUrl, getGoogleCalendarUrl } from '../lib/calendar'

type Tab = 'iphone' | 'google' | 'outlook'

const STEPS_IPHONE = [
  { n:1, title:'Abre Configuración',    desc:'En tu iPhone, entra a la app Configuración.' },
  { n:2, title:'Calendar → Cuentas',   desc:'Baja hasta "Calendario" → toca "Cuentas".' },
  { n:3, title:'Añadir cuenta → Otra', desc:'Toca "Añadir cuenta" y selecciona "Otra".' },
  { n:4, title:'Calendario suscrito',  desc:'Toca "Añadir calendario suscrito".' },
  { n:5, title:'Pega el link',         desc:'Pega el Link Mágico en el campo Server y toca Siguiente.' },
  { n:6, title:'¡Listo!',             desc:'Todas tus citas aparecerán automáticamente en tu calendario.' },
]
const STEPS_GOOGLE = [
  { n:1, title:'Abre Google Calendar', desc:'En el navegador, entra a calendar.google.com.' },
  { n:2, title:'Otros calendarios',   desc:'Toca el "+" junto a "Otros calendarios".' },
  { n:3, title:'Desde URL',           desc:'Selecciona "Desde URL".' },
  { n:4, title:'Pega el link',        desc:'Pega el Link Mágico y toca "Añadir calendario".' },
  { n:5, title:'¡Listo!',            desc:'Google Calendar sincronizará las citas automáticamente.' },
]
const STEPS_OUTLOOK = [
  { n:1, title:'Abre Outlook',         desc:'Entra a outlook.com o abre la app de escritorio.' },
  { n:2, title:'Agregar calendario',   desc:'Clic en el ícono de calendario → "Agregar calendario".' },
  { n:3, title:'Suscribirse desde web',desc:'Selecciona "Suscribirse desde la web".' },
  { n:4, title:'Pega el link',         desc:'Pega el Link Mágico y haz clic en "Importar".' },
  { n:5, title:'¡Listo!',             desc:'Las citas aparecerán en tu Outlook automáticamente.' },
]

const Divider = () => <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-rim), transparent)', margin: '3rem 0' }} />

export default function SetupPage() {
  const pro = useProfessional()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '5rem 4.5rem 6rem', colorScheme: 'inherit' }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Pro.bo · Panel Admin</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, letterSpacing: '-.02em', color: 'var(--color-ink)' }}>
            {pro.name}
          </h1>
        </div>

        {/* ── 01 Horarios de atención ── */}
        <AdminSection num="01" title="Horarios de atención" desc="Configura los días y horas en que aceptas citas. Los cambios aplican de inmediato.">
          <ScheduleEditor />
        </AdminSection>

        <Divider />

        {/* ── 02 Bloquear horarios ── */}
        <AdminSection num="02" title="Bloquear horarios" desc="Marca días o rangos de horas en que no estarás disponible (vacaciones, conferencias, feriados).">
          <BlockScheduler />
        </AdminSection>

        <Divider />

        {/* ── 03 Link Mágico ── */}
        <AdminSection num="03" title="Link Mágico" desc="Suscríbete una sola vez y todas las citas aparecen automáticamente en tu calendario.">
          <MagicLinkPanel />
        </AdminSection>

      </div>
    </div>
  )
}

/* ── Admin Section wrapper ── */
function AdminSection({ title, desc, children }: { num?: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-rim)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,3vw,2.25rem)', fontWeight: 400, letterSpacing: '-.02em', marginBottom: '.5rem', color: 'var(--color-ink)' }}>
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
  const [tab, setTab]             = useState<Tab>('iphone')
  const [showSteps, setShowSteps] = useState(false)

  const feedUrl   = pro.calendarFeedUrl
  const webcalUrl = getWebcalUrl(feedUrl)
  const googleUrl = getGoogleCalendarUrl(feedUrl)
  const steps     = tab === 'iphone' ? STEPS_IPHONE : tab === 'google' ? STEPS_GOOGLE : STEPS_OUTLOOK

  const copy = async () => {
    if (!feedUrl) return
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (!feedUrl) return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.9rem' }}>
        ⚠️ Configura <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', color: 'var(--color-gold)', fontSize: '.8rem' }}>calendarFeedUrl</code> en <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', fontSize: '.8rem' }}>src/data/professionals.ts</code>
      </p>
    </div>
  )

  return (
    <div>
      {/* URL row */}
      <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)', marginBottom: '1rem' }}>
        <div style={{ flex: 1, background: 'var(--color-surface)', padding: '.85rem 1.25rem', fontFamily: 'monospace', fontSize: '.73rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feedUrl}</div>
        <button onClick={copy} style={{ padding: '.85rem 1.5rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0 }}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Quick buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <a href={webcalUrl} style={QUICK_BTN} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-gold)';e.currentTarget.style.color='var(--color-ink)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--color-rim-l)';e.currentTarget.style.color='var(--color-ink-dim)'}}>📱 Abrir en iPhone</a>
        <a href={googleUrl} target="_blank" rel="noreferrer" style={QUICK_BTN} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--color-gold)';e.currentTarget.style.color='var(--color-ink)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--color-rim-l)';e.currentTarget.style.color='var(--color-ink-dim)'}}>🔵 Google Calendar</a>
      </div>

      {/* Collapsible instructions — styled with gold accent */}
      <button onClick={() => setShowSteps(s => !s)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.55rem 1.1rem', background: 'rgba(196,153,90,.08)', border: '1px solid rgba(196,153,90,.3)', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,153,90,.15)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,153,90,.08)' }}
      >
        <span style={{ display: 'inline-block', transition: 'transform .25s', transform: showSteps ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '.6rem' }}>▶</span>
        {showSteps ? 'Ocultar instrucciones' : 'Ver instrucciones paso a paso'}
      </button>

      {showSteps && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rim)', marginBottom: '1.5rem' }}>
            {([['iphone','📱 iPhone'],['google','🔵 Google'],['outlook','💼 Outlook']] as [Tab,string][]).map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding: '.65rem 1.25rem', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: tab===id?400:300, letterSpacing: '.1em', textTransform: 'uppercase', color: tab===id?'var(--color-ink)':'var(--color-ink-dim)', borderBottom: `2px solid ${tab===id?'var(--color-gold)':'transparent'}`, cursor: 'pointer', marginBottom: -1, transition: 'color .2s' }}
              >{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-rim)' }}>
            {steps.map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: 'var(--color-surface)', padding: '1rem 1.5rem' }}>
                <div style={{ width: '1.6rem', height: '1.6rem', border: `1px solid ${i===steps.length-1?'var(--color-gold)':'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', flexShrink: 0, color: i===steps.length-1?'var(--color-gold)':'var(--color-ink-dim)', background: i===steps.length-1?'rgba(196,153,90,.08)':'transparent' }}>
                  {i===steps.length-1?'✓':step.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '.95rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.2rem' }}>{step.title}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--color-ink-dim)', lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const QUICK_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '.5rem',
  padding: '.6rem 1.25rem', background: 'transparent',
  border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)',
  fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 300,
  letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none',
  transition: 'all .3s',
}
