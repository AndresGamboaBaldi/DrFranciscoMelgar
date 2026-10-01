import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { getProfessional } from '../data/professionals'
import { ProfessionalContext } from '../context/ProfessionalContext'
import { StaffContext } from '../context/StaffContext'
import { BookingDialogContext } from '../context/BookingDialogContext'
import { ProSEOHead } from '../components/SEOHead'
import Navbar        from '../components/Navbar'
import Hero          from '../components/Hero'
import Services      from '../components/Services'
import About         from '../components/About'
import Footer        from '../components/Footer'
import QuoteSection  from '../components/QuoteSection'
import BookingDialog from '../components/booking/BookingDialog'
import { buildThemeVars } from '../lib/theme'

// El panel del profesional arrastra ScheduleEditor, BlockScheduler y
// AppointmentsPanel. Diferirlo saca todo eso del bundle que descarga
// el cliente que solo viene a reservar una cita.
const SetupPage  = lazy(() => import('./SetupPage'))
const SetupGuard = lazy(() => import('../components/SetupGuard'))


/** Placeholder mientras baja el chunk del panel. Usa las vars del tema ya aplicadas. */
function PanelLoading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          border: '2px solid var(--color-rim)',
          borderTopColor: 'var(--color-gold)',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export default function ProfessionalPage() {
  const { slug, staffId } = useParams<{ slug: string; staffId?: string }>()
  const pro = getProfessional(slug ?? '')
  const staffMember = staffId ? pro?.staff?.find(s => s.id === staffId) ?? null : null
  const [bookingOpen, setBookingOpen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pendingQrPayment')
      if (!saved) return false
      const { businessId } = JSON.parse(saved)
      return businessId === (pro?.businessId ?? '')
    } catch { return false }
  })

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
    // No cleanup â€” fonts stay cached for performance
  }, [pro.slug, pro.theme?.fonts?.googleFontsUrl])
  // Preload staff photos on page load so they're cached before the booking dialog opens
  useEffect(() => {
    pro.staff?.forEach(s => {
      if (s.photo) { const img = new Image(); img.src = s.photo }
    })
  }, [pro.staff])

  const isSetup    = window.location.pathname.includes('/setup')

  return (
    <ProfessionalContext.Provider value={pro}>
      <StaffContext.Provider value={staffMember}>
      <BookingDialogContext.Provider value={{ openBooking: () => setBookingOpen(true) }}>
        {!isSetup && <ProSEOHead pro={pro} />}
        {/* background + color use the INLINE var overrides, not the :root dark defaults */}
        <div style={{ ...themeVars, colorScheme: isLight ? 'light' : 'dark', background: 'var(--color-bg)', color: 'var(--color-ink)', minHeight: '100vh' }}>
          {isSetup ? (
            <Suspense fallback={<PanelLoading />}>
              <SetupGuard><SetupPage /></SetupGuard>
            </Suspense>
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
            </>
          )}
        </div>
      </BookingDialogContext.Provider>
      </StaffContext.Provider>
    </ProfessionalContext.Provider>
  )
}
