import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home             from './pages/Home'
import ProfessionalPage from './pages/ProfessionalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<Home />} />
        <Route path="/:slug" element={<ProfessionalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
