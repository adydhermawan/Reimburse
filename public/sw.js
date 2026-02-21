// Recashly Service Worker — App Shell + Cache-First Strategy
const CACHE_NAME = 'recashly-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests and API calls
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api')) return;

    // For navigation requests — network-first with cache fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match('/')))
        );
        return;
    }

    // For static assets — cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});
