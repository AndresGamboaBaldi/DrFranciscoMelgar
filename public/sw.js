/**
 * Service Worker — Web Push Notifications + asset caching
 * Handles push events, shows native notifications, and caches static
 * assets so the app loads instantly on repeat launches (e.g. from the
 * home-screen PWA icon).
 */

const CACHE_NAME = 'probo-assets-v1'

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Stale-while-revalidate for same-origin GET requests (JS/CSS/images/fonts/HTML).
// Serves from cache instantly when available, while refreshing in the background.
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req)
      const networkFetch = fetch(req)
        .then(res => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || networkFetch
    })
  )
})

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Nueva Cita'
  const options = {
    body:    data.body  ?? '',
    icon:    '/logo.jpeg',
    badge:   '/logo.jpeg',
    tag:     'nueva-cita',          // replaces previous notification instead of stacking
    renotify: true,
    data:    { url: data.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
