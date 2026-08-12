const CACHE_NAME = 'murilo-ana-v2';
const APP_SHELL = [
  '/', '/index.html', '/manifest.json', '/robots.txt', '/icons/icon.svg',
  '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png',
  '/css/main.css', '/css/pages.css', '/css/components.css', '/css/modals.css',
  '/js/main.js', '/js/modules/shader.js', '/js/modules/cursor.js',
  '/js/modules/particles.js', '/js/modules/music.js', '/js/modules/router.js',
  '/js/modules/evasion.js', '/js/modules/lightbox.js', '/js/modules/letter.js',
  '/js/modules/counter.js', '/js/modules/features.js', '/js/modules/pwa.js'
];
const PERSONAL_MEDIA = [
  '/LSmusica.mp3',
  '/imagensParaADD/foto_1.jpeg', '/imagensParaADD/foto_2.jpeg',
  '/imagensParaADD/foto_3.jpeg', '/imagensParaADD/foto_4.jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41.jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(1).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(2).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(3).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(4).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(5).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(6).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(7).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(8).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(9).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(10).jpeg',
  '/imagensParaADD/WhatsApp%20Image%202026-08-08%20at%2018.12.41%20(11).jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([...APP_SHELL, ...PERSONAL_MEDIA]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }))
  );
});
