import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'

type DeviceType = 'ios' | 'android' | 'other'
type Status = 'detecting' | 'ios' | 'android' | 'other' | 'not_found'

function detectDevice(): DeviceType {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Macintosh/i.test(ua) && !('ontouchend' in document)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'other'
}

export default function CalendarRedirect() {
  const { slug } = useParams<{ slug: string }>()
  const [status, setStatus] = useState<Status>('detecting')
  const [feedUrl, setFeedUrl] = useState('')
  const [copied,  setCopied]  = useState(false)
  const tried = useRef(false)

  useEffect(() => {
    if (tried.current) return
    tried.current = true

    const pro = getProfessional(slug ?? '')
    if (!pro?.calendarFeedUrl) { setStatus('not_found'); return }

    setFeedUrl(pro.calendarFeedUrl)
    const device = detectDevice()

    if (device === 'ios') {
      // iOS: webcal:// opens Calendar app directly
      window.location.href = pro.calendarFeedUrl.replace(/^https?:\/\//, 'webcal://')
      setTimeout(() => setStatus('ios'), 1200)
    } else {
      // Android/other: skip auto-redirect, show manual options immediately
      setStatus(device)
    }
  }, [slug])

  const copy = async () => {
    await navigator.clipboard.writeText(feedUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://')
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`

  if (status === 'not_found') return (
    <div style={PAGE}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--color-ink-dim)' }}>
        Profesional no encontrado
      </p>
    </div>
  )

  if (status === 'detecting') return (
    <div style={PAGE}>
      <div style={{ width: '2.5rem', height: '2.5rem', border: '2px solid var(--color-rim)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={PAGE}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.65rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.5rem' }}>Probo.pro</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-ink)' }}>
          Sincroniza tu <em style={{ fontStyle: 'italic', color: 'var(--color-gold)' }}>agenda</em>
        </h1>
      </div>

      {/* ── iOS ── */}
      {status === 'ios' && (
        <div style={{ textAlign: 'center', maxWidth: '22rem' }}>
          <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1.75rem' }}>
            Si no se abrió automáticamente, toca el botón:
          </p>
          <a href={webcalUrl} style={BTN_GOLD}>📱 Abrir en Calendario iPhone</a>
          <p style={{ fontSize: '.72rem', color: 'var(--color-ink-ghost)', marginTop: '1.25rem', lineHeight: 1.7 }}>
            Acepta la suscripción y tus citas aparecerán automáticamente.
          </p>
        </div>
      )}

      {/* ── Android / Samsung ── */}
      {status === 'android' && (
        <div style={{ width: '100%', maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <p style={{ fontSize: '.9rem', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '.5rem', textAlign: 'center' }}>
            Elige tu aplicación:
          </p>

          {/* Google Calendar */}
          <a href={googleUrl} target="_blank" rel="noreferrer" style={BTN_GOLD}>
            🔵 Google Calendar
          </a>

          {/* Samsung / otras apps — instrucción manual */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rim)', padding: '1.1rem 1.25rem' }}>
            <p style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '.6rem', fontWeight: 500 }}>
              Samsung Calendar u otra app
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--color-ink-dim)', lineHeight: 1.7, marginBottom: '.85rem' }}>
              Abre tu app de calendario → Ajustes → Agregar cuenta → <strong style={{ color: 'var(--color-ink)' }}>Suscripción a calendario</strong> → pega este link:
            </p>
            {/* URL copy */}
            <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)' }}>
              <div style={{ flex: 1, background: 'var(--color-bg)', padding: '.6rem .85rem', fontFamily: 'monospace', fontSize: '.65rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {feedUrl}
              </div>
              <button onClick={copy}
                style={{ padding: '.6rem 1rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'background .3s', flexShrink: 0 }}>
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '.7rem', color: 'var(--color-ink-ghost)', textAlign: 'center', lineHeight: 1.7 }}>
            Las citas nuevas aparecerán automáticamente cada vez que tu calendario se sincronice.
          </p>
        </div>
      )}

      {/* ── Desktop / other ── */}
      {status === 'other' && (
        <div style={{ width: '100%', maxWidth: '22rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a href={webcalUrl} style={BTN_GOLD}>📱 iPhone / Mac</a>
          <a href={googleUrl} target="_blank" rel="noreferrer" style={BTN_OUTLINE}>🔵 Google Calendar</a>
          <div style={{ display: 'flex', gap: 1, background: 'var(--color-rim)', marginTop: '.5rem' }}>
            <div style={{ flex: 1, background: 'var(--color-bg)', padding: '.6rem .85rem', fontFamily: 'monospace', fontSize: '.65rem', color: 'var(--color-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {feedUrl}
            </div>
            <button onClick={copy}
              style={{ padding: '.6rem 1rem', background: copied ? 'var(--color-surface2)' : 'var(--color-gold)', color: copied ? 'var(--color-ink-dim)' : 'var(--color-bg)', fontFamily: 'var(--font-body)', fontSize: '.68rem', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const PAGE: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'var(--color-bg)', padding: '2rem', gap: '1rem',
}
const BTN_GOLD: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
  padding: '.9rem 1.5rem', background: 'var(--color-gold)', color: 'var(--color-bg)',
  fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 400,
  letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none',
}
const BTN_OUTLINE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
  padding: '.9rem 1.5rem', background: 'transparent', color: 'var(--color-ink-dim)',
  fontFamily: 'var(--font-body)', fontSize: '.78rem', fontWeight: 300,
  letterSpacing: '.1em', textTransform: 'uppercase',
  textDecoration: 'none', border: '1px solid var(--color-rim-l)',
}
