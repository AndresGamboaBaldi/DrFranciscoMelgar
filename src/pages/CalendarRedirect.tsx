import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'

/**
 * Smart calendar redirect page — /doctor_melgar/calendar
 *
 * Detects the device and redirects to the right calendar app:
 *  · iPhone / iPad / Mac  →  webcal://  (opens iOS/macOS Calendar)
 *  · Android / other      →  Google Calendar "add by URL"
 *
 * This URL is sent in the WhatsApp notification so the doctor
 * can tap once and get their calendar synced — no setup page needed.
 */
export default function CalendarRedirect() {
  const { slug }       = useParams<{ slug: string }>()
  const [status, setStatus] = useState<'redirecting' | 'manual' | 'not_found'>('redirecting')
  const [links, setLinks]   = useState<{ webcal: string; google: string } | null>(null)

  useEffect(() => {
    const pro = getProfessional(slug ?? '')
    if (!pro || !pro.calendarFeedUrl) { setStatus('not_found'); return }

    const webcalUrl = pro.calendarFeedUrl.replace(/^https?:\/\//, 'webcal://')
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(pro.calendarFeedUrl)}`
    setLinks({ webcal: webcalUrl, google: googleUrl })

    // Detect Apple devices
    const ua    = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isMac = /Macintosh/i.test(ua) && 'ontouchend' in document === false

    setTimeout(() => {
      if (isIOS || isMac) {
        window.location.href = webcalUrl
      } else {
        window.location.href = googleUrl
      }
      // If redirect didn't work, show manual buttons
      setTimeout(() => setStatus('manual'), 1500)
    }, 300)
  }, [slug])

  if (status === 'not_found') {
    return (
      <div style={PAGE}>
        <p style={TITLE}>Profesional no encontrado</p>
        <p style={SUBTITLE}>/{slug}</p>
      </div>
    )
  }

  return (
    <div style={PAGE}>
      {/* Logo / brand */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.65rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Pro.bo</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-ink)' }}>
          Sincroniza tu <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>agenda</em>
        </h1>
      </div>

      {status === 'redirecting' ? (
        <>
          <div style={{ width: '2.5rem', height: '2.5rem', border: `2px solid var(--color-rim)`, borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1.5rem' }} />
          <p style={SUBTITLE}>Abriendo tu calendario...</p>
        </>
      ) : (
        <>
          <p style={{ ...SUBTITLE, marginBottom: '2rem' }}>Elige tu aplicación de calendario:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '22rem' }}>
            {links && (
              <>
                <a href={links.webcal} style={BTN_GOLD}>
                  📱 iPhone / iPad / Mac
                </a>
                <a href={links.google} target="_blank" rel="noreferrer" style={BTN_OUTLINE}>
                  🔵 Google Calendar
                </a>
              </>
            )}
          </div>
          <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '1.5rem', textAlign: 'center', maxWidth: '22rem', lineHeight: 1.7 }}>
            Las citas nuevas aparecerán en tu calendario automáticamente, sin hacer nada más.
          </p>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/* ── Styles ── */
const PAGE: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'var(--color-bg)',
  padding: '2rem',
}
const TITLE: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontStyle: 'italic',
  fontSize: '1.5rem', color: 'var(--color-ink-dim)',
}
const SUBTITLE: React.CSSProperties = {
  fontSize: '.88rem', color: 'var(--color-ink-dim)',
  fontFamily: 'var(--font-display)', fontStyle: 'italic',
}
const BTN_GOLD: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
  padding: '.9rem 1.5rem',
  background: 'var(--color-gold)', color: 'var(--color-bg)',
  fontFamily: 'var(--font-body)', fontSize: '.78rem',
  fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase',
  textDecoration: 'none',
}
const BTN_OUTLINE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
  padding: '.9rem 1.5rem',
  background: 'transparent', color: 'var(--color-ink-dim)',
  fontFamily: 'var(--font-body)', fontSize: '.78rem',
  fontWeight: 300, letterSpacing: '.1em', textTransform: 'uppercase',
  textDecoration: 'none', border: '1px solid var(--color-rim-l)',
}
