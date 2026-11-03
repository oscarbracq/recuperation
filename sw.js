// Récupération — offline fallback only. Every same-origin file is network-first, so the phone
// always runs one consistent version when online; the cache only serves when there is no network.
// Supabase data is never cached here: the app reads it live.
const CACHE = 'recup-v16';
const SHELL = ['./', './index.html', './supabase-db.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const key = e.request.mode === 'navigate' ? './index.html' : e.request;
  e.respondWith(fetch(e.request, {cache: 'no-cache'})
    .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); return r; })
    .catch(() => caches.match(key)));
});
