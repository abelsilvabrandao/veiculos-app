# Manual para Implementação de PWA (Progressive Web App)

Este manual apresenta um passo a passo para transformar sua aplicação web atual em um PWA, permitindo que você execute a implementação manualmente.

---

## O que é um PWA?

Um Progressive Web App (PWA) é uma aplicação web que utiliza tecnologias modernas para oferecer uma experiência similar a um aplicativo nativo, incluindo:

- Instalação no dispositivo do usuário
- Funcionamento offline ou com conexão instável
- Atualizações automáticas
- Notificações push (opcional)

---

## Passo 1: Criar o arquivo `manifest.json`

Este arquivo descreve a aplicação para o sistema operacional, definindo nome, ícones, cores, etc.

Exemplo básico de `manifest.json`:

```json
{
  "name": "Nome da Sua Aplicação",
  "short_name": "AppCurto",
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
- Salve o arquivo `manifest.json` na raiz do projeto.

---

## Passo 2: Adicionar o link para o manifest no `index.html`

No `<head>` do seu `index.html`, adicione:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#2E7D32">
```

---

## Passo 3: Criar o Service Worker

O Service Worker é um script que roda em segundo plano e permite funcionalidades offline e cache.

Exemplo básico de `service-worker.js`:

```js
const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  // Adicione aqui outros arquivos essenciais
];

// Instalação do Service Worker e cache dos arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativação do Service Worker e limpeza de caches antigos
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

**Ações:**

- Crie o arquivo `service-worker.js` na raiz do projeto.
- Adicione os arquivos essenciais ao array `urlsToCache`.

---

## Passo 4: Registrar o Service Worker no seu JavaScript principal

No arquivo JS principal (ex: `js/main.js` ou `js/app.js`), adicione:

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

## Passo 5: Testar o PWA

- Abra o site no Chrome.
- Abra as DevTools (F12) > aba "Application".
- Verifique se o manifest está carregado corretamente.
- Verifique se o Service Worker está registrado.
- Teste o funcionamento offline (aba "Service Workers" > "Offline").
- Teste a instalação do app (ícone de instalação na barra de endereço).

---

## Considerações Finais

- Atualize os arquivos no cache do Service Worker sempre que fizer alterações importantes.
- Para funcionalidades avançadas, como notificações push, consulte a documentação do PWA.
- Garanta que seu site seja servido via HTTPS para que o Service Worker funcione.

---

Se precisar, posso ajudar a criar os arquivos iniciais ou scripts para automatizar a configuração do PWA.
