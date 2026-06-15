// Control de Gastos — service worker mínimo (instalable + red primero)
const CACHE = 'gastos-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // nunca cachear mutaciones
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;           // datos siempre frescos
  // Red primero; si falla, intenta caché (para abrir la app sin señal)
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.status === 200 && url.origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
