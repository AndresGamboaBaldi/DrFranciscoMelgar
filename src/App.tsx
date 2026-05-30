import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home             from './pages/Home'
import ProfessionalPage from './pages/ProfessionalPage'
import CalendarRedirect from './pages/CalendarRedirect'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/:slug/calendar"    element={<CalendarRedirect />} />
        <Route path="/:slug"             element={<ProfessionalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
