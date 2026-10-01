import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// Safety net: hide splash after 4s no matter what (prevents permanent spinner on errors)
setTimeout(() => {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.classList.add('hide')
  splash.addEventListener('transitionend', () => splash.remove(), { once: true })
}, 4000)

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

// Register service worker for asset caching (faster repeat/PWA loads).
//
// Solo en producción: el SW sirve JS con estrategia cache-first, y en
// desarrollo las URLs de los módulos son fijas (/src/App.tsx), así que el
// caché congela el código viejo y ni recargar lo actualiza. En producción
// no pasa porque Vite le pone hash al nombre de cada archivo.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Limpia el SW que haya quedado registrado de antes de este cambio.
  navigator.serviceWorker.getRegistrations()
    .then(rs => rs.forEach(r => r.unregister()))
    .catch(() => {})
  caches?.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {})
}
