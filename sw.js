// TNR Athletics — offline fallback only. Every same-origin file is network-first, so the phone
// always runs one consistent version when online; the cache only serves when there is no network.
// Supabase data is never cached here: the app reads it live.
const CACHE = 'recup-v42';
const SHELL = ['./', './index.html', './supabase-db.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

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
// The 9 h and 20 h summaries (sent by the Supabase function `notify`): show them, and open the app when touched.
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (err) { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'TNR Athletics', {body: d.body || '', tag: d.tag || 'tnr', renotify: true,
    icon: 'icon-192.png?v=tnr', badge: 'icon-192.png?v=tnr', data: {url: d.url || './'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    const w = list.find(c => c.url.startsWith(self.registration.scope));
    return w ? w.focus() : self.clients.openWindow(e.notification.data?.url || './');
  }));
});
