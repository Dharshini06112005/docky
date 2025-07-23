// Service worker to handle caching and routing
const CACHE_NAME = 'docky-v3';
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

  // Handle JavaScript files specifically
  if (request.destination === 'script') {
    event.respondWith(
      fetch(request, {
        headers: {
          'Accept': 'application/javascript, text/javascript, */*'
        }
      })
      .then((response) => {
        // Check if response is actually JavaScript
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          // If server returns HTML instead of JS, try to get from cache
          return caches.match(request);
        }
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch((error) => {
        console.log('Script fetch failed:', request.url, error);
        // If network fails, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cached version, return a simple error response
          return new Response('console.error("Script failed to load");', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        });
      })
    );
    return;
  }

  // Handle CSS files
  if (request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
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