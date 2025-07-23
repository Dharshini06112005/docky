// Service worker to handle caching and routing
const CACHE_NAME = 'docky-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/404.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If the response is successful, return it
          if (response.status === 200) {
            return response;
          }
          // If it's a 404, return the index.html
          return fetch('/index.html');
        })
        .catch(() => {
          // If network fails, return cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(request);
        })
        .catch(() => {
          // If both cache and network fail, return empty response
          return new Response('', { status: 404 });
        })
    );
    return;
  }

  // For all other requests, try network first
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 