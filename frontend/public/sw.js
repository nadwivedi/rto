// Enhanced Service Worker for RTO Sarthi
const CACHE_NAME = 'rtosarthi-v' + Date.now(); // Unique version on each build
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon_converted.avif',
  '/icon.svg'
];

// Install event: cache core assets and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching core assets');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first strategy for navigation (HTML)
// to prevent white-screen issues after new deployments.
self.addEventListener('fetch', (event) => {
  // For navigation requests (loading the page), try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For other assets, use Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(fetchResponse => {
          // Don't cache dynamic API calls
          if (event.request.url.includes('/api/')) return fetchResponse;
          
          return fetchResponse;
      });
    })
  );
});
