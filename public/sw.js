// Minimal push-notification service worker. Not a full offline/PWA cache —
// ponytail: add caching strategies if offline support is ever needed.
self.addEventListener('push', (event) => {
  let data = { title: 'Aurora Systems', body: 'New activity' };
  try { data = event.data.json(); } catch (_) { /* use default */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon-white.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
