/* Deep Dash — Sistema Financeiro: service worker mínimo
   Objetivo: permitir "Adicionar à tela inicial" e dar um fallback offline simples
   para o shell do app. Chamadas ao Supabase sempre vão direto pra rede — nunca
   servimos dados financeiros do cache. */

const CACHE_NAME = 'deep-dash-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // só cuida de GET; Supabase e chamadas de API sempre direto da rede
  if (req.method !== 'GET' || req.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(req))
  );
});
