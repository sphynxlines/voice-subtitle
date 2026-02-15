/**
 * Service Worker for PWA
 * Helps maintain permissions and enables offline functionality
 */

const CACHE_NAME = 'voice-subtitle-v8'; // Fixed Azure Speech SDK websocket error
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
  '/src/js/groq-client.js', // Added new file
  '/src/js/app.js',
  '/src/js/stats-page.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
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
