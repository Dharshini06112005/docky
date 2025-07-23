// Simple service worker for Docky
const CACHE_NAME = 'docky-v4';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker installed');
        return cache.addAll([
          '/',
          '/index.html',
          '/404.html'
        ]);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // For navigation requests, always return index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch('/index.html').catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For all other requests, try network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch((error) => {
        console.log('Fetch failed for:', request.url, error);
        // Try to get from cache
        return caches.match(request);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
    })
  );
}); 