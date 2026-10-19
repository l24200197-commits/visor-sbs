/**
 * Service worker: permite abrir el visor sin Internet después de la primera visita.
 * Archivos propios: red primero (siempre la última versión publicada) y caché si no hay red.
 * Bibliotecas CDN y fuentes: caché primero (sus URL llevan versión fija).
 */
const CACHE = 'stereolab-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './js/main.js', './js/viewer.js', './js/scene.js', './js/controls.js', './js/fileLoader.js',
  './js/ui.js', './js/wizard.js', './js/gestures.js', './js/exporter.js',
  './assets/images/demo-sbs-1.jpg', './assets/images/demo-sbs-2.jpg', './assets/icons/icon-192.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  const sameOrigin = new URL(request.url).origin === self.location.origin;

  if (sameOrigin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true })),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok || response.type === 'opaque') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    })),
  );
});
