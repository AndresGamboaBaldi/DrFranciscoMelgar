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

// Register service worker for asset caching (faster repeat/PWA loads)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
