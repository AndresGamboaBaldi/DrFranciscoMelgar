import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'
import { ProfessionalContext } from '../context/ProfessionalContext'
import { BookingDialogContext } from '../context/BookingDialogContext'
import { ProSEOHead } from '../components/SEOHead'
import Navbar        from '../components/Navbar'
import Hero          from '../components/Hero'
import Services      from '../components/Services'
import About         from '../components/About'
import Footer        from '../components/Footer'
import QuoteSection  from '../components/QuoteSection'
import BookingDialog from '../components/booking/BookingDialog'
import SetupPage     from './SetupPage'
import SetupGuard    from '../components/SetupGuard'
import type { Professional } from '../types/professional'

function lightenHex(hex: string, amount = 20): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#',''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function buildThemeVars(pro: Professional): React.CSSProperties {
  const accent  = pro.theme?.accent      ?? '#c4995a'
  const accentL = pro.theme?.accentLight ?? lightenHex(accent, 18)
  const mode    = pro.theme?.mode        ?? 'dark'
  const fonts   = pro.theme?.fonts

  const shared: Record<string, string> = {
    '--color-gold':      accent,
    '--color-gold-l':    accentL,
    '--color-gold-glow': hexToRgba(accent, 0.1),
  }

  // Override font variables if custom fonts are specified
  if (fonts) {
    shared['--font-display'] = `'${fonts.display}', serif`
    shared['--font-body']    = `'${fonts.body}', sans-serif`
  }

  if (mode === 'light') {
    return {
      ...shared,
      '--color-bg':           '#fafaf8',
      '--color-surface':      '#ffffff',
      '--color-surface2':     '#f0ece3',
      '--color-rim':          '#ddd8cc',
      '--color-rim-l':        '#cac4b8',
      '--color-ink':          '#18160f',   // más profundo — mayor contraste
      '--color-ink-dim':      '#3d3830',   // era #6b6259, ahora mucho más oscuro
      '--color-ink-ghost':    '#6a6055',   // era #a09080, ahora legible
      '--color-nav-scrolled': 'rgba(250,250,248,.96)',
      '--watermark-stroke':   hexToRgba(accent, 0.22),
      '--grain-opacity':      '0.04',
    } as React.CSSProperties
  }

  return {
    ...shared,
    '--color-nav-scrolled': 'rgba(10,9,7,.93)',
    '--watermark-stroke':   hexToRgba(accent, 0.07),
    '--grain-opacity':      '0.025',
  } as React.CSSProperties
}

export default function ProfessionalPage() {
  const { slug } = useParams<{ slug: string }>()
  const pro = getProfessional(slug ?? '')
  const [bookingOpen, setBookingOpen] = useState(false)

  if (!pro) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--color-ink-dim)' }}>Profesional no encontrado</p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)' }}>/{slug}</p>
      </div>
    )
  }

  const isLight   = pro.theme?.mode === 'light'
  const themeVars = buildThemeVars(pro)

  // Dynamically load Google Fonts if the professional has custom fonts
  useEffect(() => {
    const url = pro.theme?.fonts?.googleFontsUrl
    if (!url) return
    const existing = document.getElementById(`gf-${pro.slug}`)
    if (existing) return  // already loaded
    const link = document.createElement('link')
    link.id   = `gf-${pro.slug}`
    link.rel  = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
    // No cleanup — fonts stay cached for performance
  }, [pro.slug, pro.theme?.fonts?.googleFontsUrl])
  const isSetup    = new URLSearchParams(window.location.search).has('setup')

  return (
    <ProfessionalContext.Provider value={pro}>
      <BookingDialogContext.Provider value={{ openBooking: () => setBookingOpen(true) }}>
        <ProSEOHead pro={pro} />
        {/* background + color use the INLINE var overrides, not the :root dark defaults */}
        <div style={{ ...themeVars, colorScheme: isLight ? 'light' : 'dark', background: 'var(--color-bg)', color: 'var(--color-ink)', minHeight: '100vh' }}>
          {isSetup ? (
            <SetupGuard><SetupPage /></SetupGuard>
          ) : (
            <>
              <Navbar />
              <main>
                <Hero />
                <div className="divider" />
                <Services />
                <div className="divider" />
                <About />
                {pro.finalQuote && <><div className="divider" /><QuoteSection /></>}
              </main>
              <Footer />
              {bookingOpen && <BookingDialog onClose={() => setBookingOpen(false)} />}
              {/* Admin button — protected by SetupGuard, safe to always show */}
              <a href="?setup"
                style={{ position: 'fixed', bottom: '1.25rem', right: '1.25rem', width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-ghost)', fontSize: '1rem', textDecoration: 'none', zIndex: 40, boxShadow: '0 2px 8px rgba(0,0,0,.3)', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-gold)'; e.currentTarget.style.borderColor = 'var(--color-gold)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-ghost)'; e.currentTarget.style.borderColor = 'var(--color-rim)' }}
                title="Panel de administración"
              >⚙</a>
            </>
          )}
        </div>
      </BookingDialogContext.Provider>
    </ProfessionalContext.Provider>
  )
}
