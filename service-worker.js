const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';
const WEATHER_CACHE = 'weather-cache-v1';

// Assets estáticos críticos para pré-cache
const STATIC_ASSETS = [
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
  '/js/weather.js',
  '/js/components/header-profile.js',
  '/js/components/footer.js',
  '/js/components/profile-manager.js',
  '/veiculos-app/img/',
  'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm'
];

// Tempo de cache para dados do clima (30 minutos)
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;

// Instalação e pre-cache de assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Limpeza de caches antigos na ativação
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, WEATHER_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Função para verificar se é uma requisição de API de clima
function isWeatherRequest(url) {
  return url.includes('api.open-meteo.com') || url.includes('nominatim.openstreetmap.org');
}

// Função para verificar se o cache do clima está válido
async function isWeatherCacheValid(response) {
  if (!response) return false;
  const cachedData = await response.json();
  return cachedData.timestamp && (Date.now() - cachedData.timestamp < WEATHER_CACHE_DURATION);
}

// Estratégia Stale While Revalidate para dados do clima
async function handleWeatherRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && await isWeatherCacheValid(cachedResponse.clone())) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(WEATHER_CACHE);
    
    // Adicionar timestamp aos dados do clima
    const data = await networkResponse.clone().json();
    data.timestamp = Date.now();
    
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return cachedResponse || new Response(JSON.stringify({
      error: 'Dados indisponíveis offline'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Interceptação de requisições com diferentes estratégias de cache
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Estratégia para APIs do clima
  if (isWeatherRequest(request.url)) {
    event.respondWith(handleWeatherRequest(request));
    return;
  }

  // Estratégia para assets estáticos
  if (STATIC_ASSETS.includes(request.url)) {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
    return;
  }

  // Estratégia Cache First para imagens
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request).then(networkResponse => {
            return caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
    );
    return;
  }

  // Estratégia Network First para outras requisições
  event.respondWith(
    fetch(request)
      .then(response => {
        return caches.open(DYNAMIC_CACHE)
          .then(cache => {
            cache.put(request, response.clone());
            return response;
          });
      })
      .catch(() => caches.match(request))
  );
});