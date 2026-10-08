/* Service worker Sistem Manajemen Kelas XI TKR 2.
   Naikkan VERSION setiap kali berkas aplikasi diperbarui. */
const VERSION = 'v2.0.0';
const CACHE = 'kelas-xitkr2-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Halaman utama: ambil dari jaringan dulu agar pembaruan langsung terpakai.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Berkas statis aplikasi, pustaka Supabase, dan font: tampilkan dari cache, perbarui di latar.
  const statik = url.origin === self.location.origin ||
    url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!statik) return; // permintaan data ke Supabase tidak disimpan di cache

  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
