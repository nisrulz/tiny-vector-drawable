// Tiny Vector Drawable — service worker.
// Caches the app shell so the tool works offline and is installable as a PWA.
const CACHE = 'tvd-v4';
const ASSETS = [
  '.',
  'index.html',
  'app.js',
  'css/theme.css',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'js/state.js',
  'js/util.js',
  'js/zip.js',
  'js/model.js',
  'js/scheduler.js',
  'js/optimizer.js',
  'js/optimize.js',
  'js/ui.js',
  'js/theme.js',
  'js/credits.js',
  'lib/avocado.bundle.js',
  'manifest.webmanifest',
  'icons/favicon.svg',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GET requests; fall back to network then cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
