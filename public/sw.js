const CACHE_VERSION = 'auditcheck-v1.0.1';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

const openCache = () => caches.open(CACHE_VERSION);

self.addEventListener('install', (e) => {
  e.waitUntil(
    openCache().then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('auditcheck-') && k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function cachePut(cache, request, res) {
  if (res.status === 200) cache.put(request, res.clone());
}

function swr(request) {
  return openCache().then(async (cache) => {
    const hit = await cache.match(request);
    const net = fetch(request)
      .then((res) => {
        cachePut(cache, request, res);
        return res;
      })
      .catch(() => null);
    if (hit) return hit;
    const res = await net;
    if (res) return res;
    throw new Error('offline');
  });
}

function networkFirst(request) {
  return openCache().then((cache) =>
    fetch(request)
      .then((res) => {
        cachePut(cache, request, res);
        return res;
      })
      .catch(() => cache.match(request))
  );
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/data.json') {
    e.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    e.respondWith(swr(request).catch(() => caches.match('/index.html')));
    return;
  }

  e.respondWith(swr(request));
});
