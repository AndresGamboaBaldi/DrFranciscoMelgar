/**
 * Service Worker — Web Push Notifications
 * Handles push events and shows native notifications to the professional.
 */

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
