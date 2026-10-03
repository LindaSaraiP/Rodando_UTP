'use strict';

const CACHE_VERSION = 'rodando-utp-v3.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.webmanifest',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/hero-carpool.svg',
  '/img/utp-route.svg',
  '/img/innovation-network.svg',
  '/img/student-community.svg',
  '/img/video-poster.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Las peticiones Range (por ejemplo video) se dejan a la red para evitar respuestas parciales cacheadas.
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nunca almacenar respuestas de la API para no persistir datos privados,
  // cookies de sesión ni información de reservaciones en el caché del SW.
  if (url.pathname.startsWith('/api/')) return;

  // Las navegaciones usan red primero y el HTML en caché como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Recursos estáticos: cache-first con actualización silenciosa desde la red.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
