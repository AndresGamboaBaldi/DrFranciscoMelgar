import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

// Eager: es la ruta que abre casi todo el tráfico (el cliente que viene a reservar).
// Dejarla en el bundle inicial le evita un viaje extra.
import ProfessionalPage from './pages/ProfessionalPage'

// Diferidas: cada una viaja en su propio chunk y solo se baja si se visita.
const Home       = lazy(() => import('./pages/Home'))
const CancelPage = lazy(() => import('./pages/CancelPage'))
const CajaPage   = lazy(() => import('./pages/caja/CajaPage'))

/** Hides the HTML splash screen once React has mounted and painted */
function HideSplash() {
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('hide')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  }, [])
  return null
}

/** Scrolls to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      {/* HideSplash va DENTRO del Suspense a propósito: mientras una ruta diferida
          se descarga, todo este subárbol queda suspendido y el splash del HTML
          sigue visible, en vez de esconderse y dejar la pantalla en blanco.
          El timeout de 4s en main.tsx sigue siendo la red de seguridad. */}
      <Suspense fallback={null}>
        <HideSplash />
        <ScrollToTop />
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/cancel/:id"        element={<CancelPage />} />
          <Route path="/:slug/caja"        element={<CajaPage />} />
          <Route path="/:slug/setup/:staffId" element={<ProfessionalPage />} />
          <Route path="/:slug/setup"       element={<ProfessionalPage />} />
          <Route path="/:slug"             element={<ProfessionalPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
