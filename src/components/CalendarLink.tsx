/**
 * CalendarLink — "Link Mágico" doctor panel
 *
 * Accessible at:  /?setup
 * Shows the doctor their ICS subscription URL and step-by-step
 * instructions for iPhone and Google Calendar.
 */
import { useState } from 'react'
import { useProfessional } from '../context/ProfessionalContext'
import { getWebcalUrl, getGoogleCalendarUrl } from '../lib/calendar'

type Tab = 'iphone' | 'google' | 'outlook'

const STEPS_IPHONE = [
  { n: 1, title: 'Abre Configuración',       desc: 'En tu iPhone, entra a la app Configuración.' },
  { n: 2, title: 'Calendar → Cuentas',        desc: 'Baja hasta "Calendario" → toca "Cuentas".' },
  { n: 3, title: 'Añadir cuenta → Otra',      desc: 'Toca "Añadir cuenta" y selecciona "Otra".' },
  { n: 4, title: 'Calendario suscrito',        desc: 'Toca "Añadir calendario suscrito".' },
  { n: 5, title: 'Pega el link y continúa',   desc: 'Pega el Link Mágico en el campo Server y toca Siguiente.' },
  { n: 6, title: '¡Listo!',                   desc: 'Todas tus citas aparecerán automáticamente en tu calendario.' },
]

const STEPS_GOOGLE = [
  { n: 1, title: 'Abre Google Calendar',      desc: 'En el navegador, entra a calendar.google.com.' },
  { n: 2, title: 'Otros calendarios',         desc: 'En la barra lateral, toca el "+" junto a "Otros calendarios".' },
  { n: 3, title: 'Desde URL',                 desc: 'Selecciona "Desde URL".' },
  { n: 4, title: 'Pega el link',              desc: 'Pega el Link Mágico y toca "Añadir calendario".' },
  { n: 5, title: '¡Listo!',                   desc: 'Google Calendar sincronizará las citas automáticamente.' },
]

const STEPS_OUTLOOK = [
  { n: 1, title: 'Abre Outlook',             desc: 'Entra a outlook.com o abre la app de escritorio.' },
  { n: 2, title: 'Agregar calendario',        desc: 'Haz clic en el ícono de calendario → "Agregar calendario".' },
  { n: 3, title: 'Suscribirse desde web',     desc: 'Selecciona "Suscribirse desde la web".' },
  { n: 4, title: 'Pega el link',             desc: 'Pega el Link Mágico y haz clic en "Importar".' },
  { n: 5, title: '¡Listo!',                  desc: 'Las citas aparecerán en tu Outlook automáticamente.' },
]

export default function CalendarLink() {
  const pro = useProfessional()
  const [tab, setTab]         = useState<Tab>('iphone')
  const [copied, setCopied]   = useState(false)
  const feedUrl               = pro.calendarFeedUrl
  const webcalUrl             = getWebcalUrl(feedUrl)
  const googleUrl             = getGoogleCalendarUrl(feedUrl)
  const steps                 = tab === 'iphone' ? STEPS_IPHONE : tab === 'google' ? STEPS_GOOGLE : STEPS_OUTLOOK

  const copy = async () => {
    if (!feedUrl) return
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <section style={{ padding: '6rem 4.5rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-rim)' }}>

      {/* Header */}
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', border: '1px solid var(--color-gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📅</div>
          <div>
            <p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.3rem' }}>Panel del Doctor</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, letterSpacing: '-.02em' }}>
              Tu Link <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>Mágico</em>
            </h2>
          </div>
        </div>

        <p style={{ fontSize: '.9rem', lineHeight: 1.9, color: 'var(--color-ink-dim)', maxWidth: '42rem', marginBottom: '3rem' }}>
          Agrega este link <strong style={{ color: 'var(--color-ink)', fontWeight: 400 }}>una sola vez</strong> a tu iPhone o Google Calendar.
          Cada vez que un paciente reserve una cita, aparecerá automáticamente en tu agenda —
          con el nombre, servicio, hora y teléfono del cliente.
        </p>

        {/* ── The magic URL box ── */}
        {!feedUrl ? (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1.5rem 2rem', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-ghost)', fontSize: '.95rem' }}>
              ⚠️ Link no configurado — agrega <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', fontSize: '.8rem', color: 'var(--color-gold)' }}>VITE_CALENDAR_FEED_URL</code> en tu archivo <code style={{ background: 'var(--color-surface2)', padding: '.1rem .4rem', fontSize: '.8rem' }}>.env</code>
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--color-ink-dimmer)', marginTop: '.75rem', lineHeight: 1.8 }}>
              1. Ejecuta <code style={{ color: 'var(--color-gold)' }}>supabase_calendar_schema.sql</code> en Supabase<br />
              2. Corre en SQL Editor: <code style={{ color: 'var(--color-gold)' }}>SELECT token FROM calendar_tokens;</code><br />
              3. Añade a .env: <code style={{ color: 'var(--color-gold)' }}>VITE_CALENDAR_FEED_URL=https://&lt;project&gt;.supabase.co/functions/v1/calendar-feed?token=&lt;token&gt;</code>
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '3rem' }}>
            {/* URL display */}
            <label style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-ink-dim)', display: 'block', marginBottom: '.6rem' }}>Tu link de suscripción</label>
            <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)' }}>
              <div style={{ flex: 1, background: 'var(--color-surface)', padding: '.85rem 1.25rem', fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0 }}>
                {feedUrl}
              </div>
              <button onClick={copy}
                style={{ padding: '.85rem 1.5rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0 }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <a href={webcalUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.25rem', background: 'transparent', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                📱 Abrir en iPhone
              </a>
              <a href={googleUrl} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1.25rem', background: 'transparent', border: '1px solid var(--color-rim-l)', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-body)', fontSize: '.7rem', fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-rim-l)'; e.currentTarget.style.color = 'var(--color-ink-dim)' }}
              >
                🔵 Agregar a Google Calendar
              </a>
            </div>
          </div>
        )}

        {/* ── How it syncs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, background: 'var(--color-rim)', marginBottom: '3rem' }}>
          {[
            { icon: '🔄', title: 'Sincronización automática', desc: 'Tu iPhone revisa el link cada 15 minutos. Citas nuevas aparecen solas.' },
            { icon: '✏️', title: 'Cambios y cancelaciones', desc: 'Si se modifica o cancela una cita, tu calendario se actualiza automáticamente.' },
            { icon: '🔒', title: 'Link privado y seguro', desc: 'El link contiene un token secreto de 64 caracteres. Solo tú lo tienes.' },
            { icon: '📋', title: 'Datos completos',          desc: 'Nombre, servicio, teléfono y notas del paciente en cada evento.' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--color-surface)', padding: '1.75rem 1.5rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.75rem' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.5rem' }}>{f.title}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Step-by-step instructions ── */}
        <div>
          <p style={{ fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Instrucciones paso a paso</p>

          {/* Tab selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-rim)', marginBottom: '2.5rem' }}>
            {([['iphone','📱 iPhone'], ['google','🔵 Google Calendar'], ['outlook','💼 Outlook']] as [Tab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding: '.75rem 1.5rem', background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: '.72rem', fontWeight: tab === id ? 400 : 300, letterSpacing: '.1em', textTransform: 'uppercase', color: tab === id ? 'var(--color-ink)' : 'var(--color-ink-dim)', borderBottom: `2px solid ${tab === id ? 'var(--color-gold)' : 'transparent'}`, cursor: 'pointer', marginBottom: -1, transition: 'color .2s', }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-rim)' }}>
            {steps.map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', background: 'var(--color-surface)', padding: '1.25rem 1.75rem' }}>
                <div style={{ width: '1.75rem', height: '1.75rem', border: `1px solid ${i === steps.length - 1 ? 'var(--color-gold)' : 'var(--color-rim-l)'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', flexShrink: 0, color: i === steps.length - 1 ? 'var(--color-gold)' : 'var(--color-ink-dim)', background: i === steps.length - 1 ? 'rgba(196,153,90,.08)' : 'transparent' }}>
                  {i === steps.length - 1 ? '✓' : step.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, color: 'var(--color-ink)', marginBottom: '.3rem' }}>{step.title}</div>
                  <div style={{ fontSize: '.83rem', color: 'var(--color-ink-dim)', lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: 'rgba(196,153,90,.06)', border: '1px solid rgba(196,153,90,.2)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--color-gold)', flexShrink: 0, fontSize: '.9rem' }}>⚡</span>
            <p style={{ fontSize: '.82rem', color: 'var(--color-ink-dim)', lineHeight: 1.8 }}>
              <strong style={{ color: 'var(--color-ink)', fontWeight: 400 }}>¿Por qué funciona solo?</strong> Los calendarios de iPhone y Google están diseñados para suscribirse a feeds de internet.
              Cada 15 minutos, tu teléfono descarga el archivo actualizado con todas las citas y
              sincroniza automáticamente — sin ninguna app adicional ni configuración extra.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
