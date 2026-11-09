/* Mi Armario Diario: permite abrir la app sin conexión.
   La página se pide primero a la red (para recibir mejoras) y, si no hay cobertura, sale de la caché. */
const CACHE = 'armario-1.1.0';
const BASE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // el tiempo (Open-Meteo) va siempre a la red

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return res; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }))
  );
});
