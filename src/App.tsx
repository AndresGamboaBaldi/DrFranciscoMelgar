import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home             from './pages/Home'
import ProfessionalPage from './pages/ProfessionalPage'

/** Scrolls to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/:slug/setup"       element={<ProfessionalPage />} />
        <Route path="/:slug"             element={<ProfessionalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
