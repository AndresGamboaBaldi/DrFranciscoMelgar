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
import CalendarLink   from '../components/CalendarLink'

const Divider = () => (
  <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, transparent, var(--color-rim), transparent)' }} />
)

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

  const isSetup = new URLSearchParams(window.location.search).has('setup')

  return (
    <ProfessionalContext.Provider value={pro}>
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
        {isSetup && (<><Divider /><CalendarLink /></>)}
      </main>
      <Footer />
    </ProfessionalContext.Provider>
  )
}
