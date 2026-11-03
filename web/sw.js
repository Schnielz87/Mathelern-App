/* Offline-Speicher und Updates der Web-App (iPhone/PWA). */
const VERSION = '__VERSION__';
const CACHE = 'tia-mathe-' + (self.registration ? new URL(self.registration.scope).pathname.replace(/\W+/g, '') : '') + '-' + VERSION;
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/version.js', 'js/edition.js', 'js/mathcore.js', 'js/figs.js', 'js/art.js', 'js/topics8.js', 'js/topics9.js', 'js/topics10.js', 'js/check.js', 'js/app.js', 'js/board.js', 'js/family.js', 'js/ai.js', 'js/lib/qrcode.js', 'js/lib/jsQR.js',
  'fonts/bangers.woff2', 'fonts/nunito.woff2', 'fonts/caveat.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => (k.startsWith(CACHE.replace(/-[^-]*$/, '-')) || /^tia-mathe-\d/.test(k)) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // KI & Familie: immer direkt ins Netz
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: true })).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then((c) => c.match('index.html'))))
  );
});
