// Lightweight Zero-Maintenance Service Worker for DJR Akademi
const CACHE_NAME = 'djrakademi-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API requests, Appwrite calls, or dynamic backend endpoints
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/v1') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-First with Cache fallback for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
