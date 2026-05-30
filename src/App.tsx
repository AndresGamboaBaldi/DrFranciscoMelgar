import Navbar         from './components/Navbar'
import Hero           from './components/Hero'
import Services       from './components/Services'
import About          from './components/About'
import BookingSection from './components/booking/BookingSection'
import Testimonials   from './components/Testimonials'
import Footer         from './components/Footer'
import CalendarLink   from './components/CalendarLink'

const Divider = () => (
  <div style={{ width: '100%', height: 1, background: 'linear-gradient(to right, transparent, var(--color-rim), transparent)' }} />
)

// Access the doctor setup panel at /?setup
const isSetupMode = new URLSearchParams(window.location.search).has('setup')

export default function App() {
  return (
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
        {isSetupMode && (
          <>
            <Divider />
            <CalendarLink />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}
