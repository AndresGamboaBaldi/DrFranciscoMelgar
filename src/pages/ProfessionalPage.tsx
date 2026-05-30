import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'
import { ProfessionalContext } from '../context/ProfessionalContext'
import Navbar         from '../components/Navbar'
import Hero           from '../components/Hero'
import Services       from '../components/Services'
import About          from '../components/About'
import BookingSection from '../components/booking/BookingSection'
import Footer         from '../components/Footer'
import SetupPage      from './SetupPage'
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
  const r = (n >> 16) & 255
  const g = (n >> 8)  & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function buildThemeVars(pro: Professional): React.CSSProperties {
  const accent  = pro.theme?.accent      ?? '#c4995a'
  const accentL = pro.theme?.accentLight ?? lightenHex(accent, 18)
  const mode    = pro.theme?.mode        ?? 'dark'

  const shared = {
    '--color-gold':      accent,
    '--color-gold-l':    accentL,
    '--color-gold-glow': hexToRgba(accent, 0.1),
  }

  if (mode === 'light') {
    return {
      ...shared,
      '--color-bg':             '#fafaf8',
      '--color-surface':        '#ffffff',
      '--color-surface2':       '#f3f0e9',
      '--color-rim':            '#e5e0d5',
      '--color-rim-l':          '#d5cfc3',
      '--color-ink':            '#1c1a18',
      '--color-ink-dim':        '#6b6259',
      '--color-ink-ghost':      '#a09080',
      '--color-nav-scrolled':   'rgba(250,250,248,.96)',
      '--watermark-stroke':     hexToRgba(accent, 0.1),
      '--grain-opacity':        '0.04',
    } as React.CSSProperties
  }

  // Dark mode — only override accent + nav bg
  return {
    ...shared,
    '--color-nav-scrolled':  'rgba(10,9,7,.93)',
    '--watermark-stroke':    hexToRgba(accent, 0.07),
    '--grain-opacity':       '0.025',
  } as React.CSSProperties
}

export default function ProfessionalPage() {
  const { slug } = useParams<{ slug: string }>()
  const pro = getProfessional(slug ?? '')

  if (!pro) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--color-ink-dim)' }}>
          Profesional no encontrado
        </p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)' }}>/{slug}</p>
      </div>
    )
  }

  const isLight    = pro.theme?.mode === 'light'
  const themeVars  = buildThemeVars(pro)
  const isSetup    = new URLSearchParams(window.location.search).has('setup')

  return (
    <ProfessionalContext.Provider value={pro}>
      {/* colorScheme makes native controls (time, date, checkbox) match the theme */}
      <div style={{ ...themeVars, colorScheme: isLight ? 'light' : 'dark' }}>
        {isSetup ? (
          <SetupPage />
        ) : (
          <>
            <Navbar />
            <main>
              <Hero />
              <div className="divider" />
              <Services />
              <div className="divider" />
              <About />
              <div className="divider" />
              <BookingSection />
            </main>
            <Footer />
          </>
        )}
      </div>
    </ProfessionalContext.Provider>
  )
}
