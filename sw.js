/**
 * Service Worker for PWA
 * Helps maintain permissions and enables offline functionality
 */

const CACHE_NAME = 'voice-subtitle-v19'; // Added SiliconFlow AI summarization
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/help.html',
  '/stats.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/src/css/main.css',
  '/src/css/help.css',
  '/src/css/stats.css',
  '/src/js/config.js',
  '/src/js/errors.js',
  '/src/js/utils.js',
  '/src/js/api.js',
  '/src/js/token-manager.js',
  '/src/js/wake-lock.js',
  '/src/js/network-monitor.js',
  '/src/js/speech-recognition.js',
  '/src/js/ui-controller.js',
  '/src/js/ai-client.js',
  '/src/js/app.js',
  '/src/js/stats-page.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_NAME);
  event.waitUntil(
    // Delete ALL old caches first
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip API calls - always fetch fresh
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip Azure Speech SDK - always fetch fresh
  if (event.request.url.includes('aka.ms/csspeech')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
