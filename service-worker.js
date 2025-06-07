const CACHE_NAME = 'controle-porto-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/gate.html',
  '/portaria.html',
  '/registros-portaria.html',
  '/css/styles.css',
  '/css/components.css',
  '/css/gate.css',
  '/css/portaria.css',
  '/css/registros-portaria.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/profile.js',
  '/js/gate.js',
  '/js/portaria.js',
  '/js/registros-portaria.js',
  // Adicione outros arquivos essenciais aqui
];

// Instalação e cache dos arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});

// Interceptar requisições e responder com cache ou fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});