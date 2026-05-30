import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'
import { ProfessionalContext } from '../context/ProfessionalContext'
import Navbar         from '../components/Navbar'
import Hero           from '../components/Hero'
import Services       from '../components/Services'
import About          from '../components/About'
import BookingSection from '../components/booking/BookingSection'
import Testimonials   from '../components/Testimonials'
import Footer         from '../components/Footer'
import SetupPage      from './SetupPage'

const Divider = () => (
  <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, transparent, var(--color-rim), transparent)' }} />
)

/** Lightens a hex color by `amount` (0-255) */
function lightenHex(hex: string, amount = 20): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export default function ProfessionalPage() {
  const { slug } = useParams<{ slug: string }>()
  const pro = getProfessional(slug ?? '')

  if (!pro) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2rem', color: 'var(--color-ink-dim)' }}>Profesional no encontrado</p>
        <p style={{ fontSize: '.82rem', color: 'var(--color-ink-ghost)' }}>/{slug}</p>
      </div>
    )
  }

  // Build CSS variable overrides for this professional's theme
  const themeVars = pro.theme ? {
    '--color-gold':   pro.theme.accent,
    '--color-gold-l': pro.theme.accentLight ?? lightenHex(pro.theme.accent, 18),
  } as React.CSSProperties : {}

  const isSetup = new URLSearchParams(window.location.search).has('setup')

  return (
    <ProfessionalContext.Provider value={pro}>
      <div style={themeVars}>
        {isSetup ? (
          // Admin panel — only shown to the professional
          <SetupPage />
        ) : (
          // Public site
          <>
            <Navbar />
            <main>
              <Hero />
              <Divider />
              <Services />
              <Divider />
              <About />
              <Divider />
              <BookingSection />
              <Divider />
              <Testimonials />
            </main>
            <Footer />
          </>
        )}
      </div>
    </ProfessionalContext.Provider>
  )
}
