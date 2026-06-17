import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home             from './pages/Home'
import ProfessionalPage from './pages/ProfessionalPage'
import CancelPage       from './pages/CancelPage'

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
      <HideSplash />
      <ScrollToTop />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/cancel/:id"        element={<CancelPage />} />
        <Route path="/:slug/setup/:staffId" element={<ProfessionalPage />} />
        <Route path="/:slug/setup"       element={<ProfessionalPage />} />
        <Route path="/:slug"             element={<ProfessionalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
