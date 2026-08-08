const CACHE_VERSION = 'auditcheck-v1.0.0';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('auditcheck-') && k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function swr(request) {
  return caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((hit) => {
      const net = fetch(request).then((res) => {
        if (res.ok) cache.put(request, res.clone());
        return res;
      });
      return hit || net;
    })
  );
}

function networkFirst(request) {
  return fetch(request)
    .then((res) => {
      if (res.ok) caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
      return res;
    })
    .catch(() => caches.match(request));
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data.json')) {
    e.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    e.respondWith(swr(request).catch(() => caches.match('/index.html')));
    return;
  }

  e.respondWith(swr(request));
});
