const CACHE_NAME = 'novamind-cache-v10-recommended-layout';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './css/variables.css',
  './css/responsive.css',
  './css/animation.css',
  './css/refresh.css',
  './js/bundle.js',
  './js/ui-refresh.js',
  './assets/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('novamind-cache-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // No Cache for API
  if (requestUrl.pathname.startsWith('/api/')) {
    return; // Fallback to default network behavior
  }

  // Network First for CSS/JS so UI fixes are visible immediately after reload.
  const isCodeAsset = requestUrl.pathname.match(/\.(css|js)$/i);

  if (isCodeAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache First for static media/fonts.
  const isAsset = requestUrl.pathname.match(/\.(png|jpg|jpeg|svg|woff2?|ttf|eot)$/i);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network First for HTML and others
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          return caches.match(new URL('index.html', self.registration.scope));
        }
        return Response.error();
      })
  );
});
