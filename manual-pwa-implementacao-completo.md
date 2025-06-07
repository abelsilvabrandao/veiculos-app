# Manual Completo para Implementação de PWA no Sistema

Este manual apresenta um passo a passo detalhado para implementar o Progressive Web App (PWA) em toda a sua aplicação, incluindo todas as páginas e arquivos relevantes.

---

## 1. Criar o arquivo `manifest.json`

Crie o arquivo `manifest.json` na raiz do projeto com o seguinte conteúdo:

```json
{
  "name": "Sistema de Controle de Entrada - Porto",
  "short_name": "Controle Porto",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2E7D32",
  "icons": [
    {
      "src": "img/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "img/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Ações:**

- Crie a pasta `img/icons/` e adicione os ícones nos tamanhos 192x192 e 512x512.

---

## 2. Modificar todos os arquivos HTML principais

Nos arquivos `index.html`, `gate.html`, `portaria.html` e `registros-portaria.html`, adicione no `<head>`:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#2E7D32">
```

---

## 3. Criar o arquivo `service-worker.js`

Na raiz do projeto, crie o arquivo `service-worker.js` com o conteúdo:

```js
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
```

---

## 4. Registrar o Service Worker nos arquivos JS principais

No arquivo `js/main.js` (ou `js/app.js` se preferir), adicione o seguinte código para registrar o service worker:

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.error('Falha ao registrar Service Worker:', error);
      });
  });
}
```

---

## 5. Testar a aplicação

- Abra a aplicação no navegador Chrome.
- Abra as DevTools (F12) e vá para a aba "Application".
- Verifique se o manifest está carregado corretamente.
- Verifique se o Service Worker está registrado.
- Teste o funcionamento offline (aba "Service Workers" > "Offline").
- Teste a instalação do app (ícone de instalação na barra de endereço).

---

## Considerações Finais

- Atualize o array `urlsToCache` no `service-worker.js` sempre que adicionar ou modificar arquivos importantes.
- Garanta que o site seja servido via HTTPS para que o Service Worker funcione.
- Para funcionalidades avançadas, como notificações push, consulte a documentação do PWA.

---

Se precisar, posso ajudar a criar scripts para automatizar essa configuração ou esclarecer dúvidas específicas.
