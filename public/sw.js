/**
 * Service Worker — Web Push Notifications + asset caching
 */

const CACHE_NAME = 'probo-assets-v4'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api')) return

  // HTML navigation: network-first, fall back to cache.
  // This ensures the browser always gets the latest HTML (with correct asset hashes).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(req, clone))
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          return cached ?? Response.error()
        }),
    )
    return
  }

  // JS/CSS/fonts/images: cache-first (Vite content-hashes these, so cached = safe).
  // Falls back to network, and only caches successful responses.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req)
      if (cached) return cached

      const res = await fetch(req).catch(() => null)
      if (res && res.ok) {
        cache.put(req, res.clone())
        return res
      }
      // Return network error as-is (browser handles it natively, no MIME confusion)
      return res ?? Response.error()
    }),
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Nueva Cita'
  const options = {
    body: data.body ?? '',
    icon: '/Probo.png',
    badge: '/Probo.png',
    tag: 'nueva-cita',
    renotify: true,
    data: { url: data.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
