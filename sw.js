const CACHE_VERSION = 'v3';
const STATIC_CACHE = `open-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `open-media-${CACHE_VERSION}`;
const FONTS_CACHE = `open-fonts-${CACHE_VERSION}`;

const CURRENT_CACHES = [STATIC_CACHE, MEDIA_CACHE, FONTS_CACHE];

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/css/main.css',
  '/css/pages.css',
  '/css/components.css',
  '/css/modals.css',
  '/js/main.js',
  '/js/modules/shader.js',
  '/js/modules/cursor.js',
  '/js/modules/particles.js',
  '/js/modules/music.js',
  '/js/modules/router.js',
  '/js/modules/evasion.js',
  '/js/modules/lightbox.js',
  '/js/modules/letter.js',
  '/js/modules/counter.js',
  '/js/modules/features.js',
  '/js/modules/visualizer.js',
  '/js/modules/constellation.js',
  '/js/modules/exporter.js',
  '/js/modules/polaroid.js',
  '/js/modules/stories.js',
  '/js/modules/pwa.js'
];

const MEDIA_ASSETS = [
  '/LSmusica.mp3',
  '/imagensParaADD/foto_1.jpeg',
  '/imagensParaADD/foto_2.jpeg',
  '/imagensParaADD/foto_3.jpeg',
  '/imagensParaADD/foto_4.jpeg',
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

// Install: Cache critical App Shell first, then cache media resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => {
        // Pre-cache media non-blockingly so failures in media won't fail the SW install
        return caches.open(MEDIA_CACHE).then((mediaCache) => {
          return Promise.allSettled(
            MEDIA_ASSETS.map((url) =>
              fetch(url)
                .then((res) => {
                  if (res.ok) return mediaCache.put(url, res);
                })
                .catch((err) => console.warn(`[SW] Pre-caching failed for ${url}:`, err))
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Handle range requests for audio files stored in CacheStorage
async function handleRangeRequest(request, cacheName) {
  const cache = await caches.open(cacheName);
  let response = await cache.match(request.url);

  if (!response) {
    try {
      response = await fetch(request);
      if (response.ok) {
        cache.put(request.url, response.clone());
      }
    } catch (err) {
      return new Response('Network error occurred while fetching media', { status: 408 });
    }
  }

  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    return response;
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytesMatch = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
  if (!bytesMatch) {
    return response;
  }

  const start = parseInt(bytesMatch[1], 10);
  const end = bytesMatch[2] ? parseInt(bytesMatch[2], 10) : arrayBuffer.byteLength - 1;
  const slicedBuffer = arrayBuffer.slice(start, end + 1);

  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      'Content-Length': String(slicedBuffer.byteLength),
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes'
    }
  });
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation requests (HTML document) -> Network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put('/index.html', response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. Audio & Media files (support HTTP 206 Range Requests)
  if (url.pathname.endsWith('.mp3') || request.headers.has('range')) {
    event.respondWith(handleRangeRequest(request, MEDIA_CACHE));
    return;
  }

  // 3. Google Fonts (stylesheets & webfont files) -> Stale-While-Revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 4. Same-origin assets (CSS, JS, Images, Icons) -> Cache first, fallback to network
  if (url.origin === self.location.origin) {
    const isMedia = url.pathname.startsWith('/imagensParaADD/') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.png');
    const targetCache = isMedia ? MEDIA_CACHE : STATIC_CACHE;

    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background if not media
          if (!isMedia) {
            fetch(request).then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(targetCache).then((cache) => cache.put(request, networkResponse));
              }
            }).catch(() => {/* Offline, keep cache */});
          }
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(targetCache).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        });
      })
    );
  }
});
