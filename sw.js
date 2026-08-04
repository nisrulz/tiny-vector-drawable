// Tiny Vector Drawable — service worker.
// Caches the app shell so the tool works offline and is installable as a PWA.
const CACHE_PREFIX = 'tvd-';
const CACHE = `${CACHE_PREFIX}v6`;
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
  'js/file-validation.js',
  'js/optimizer.js',
  'js/optimizer-worker.js',
  'js/optimize.js',
  'js/ui.js',
  'js/theme.js',
  'js/credits.js',
  'lib/avocado.bundle.js',
  'manifest.webmanifest',
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
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GET requests; fall back to network then cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === 'basic') {
          await cache.put(req, res.clone());
        }
        return res;
      } catch {
        return Response.error();
      }
    })
  );
});
