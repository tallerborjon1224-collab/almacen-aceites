const CACHE_NAME = 'taller-borjon-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/EstiloXd.css',
  '/Funciones.js',
  '/icono.png',
  '/icono-192.png',
  '/icono-512.png',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Cache antiguo eliminado:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptación de peticiones
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si la petición está en cache, devolverla
        if (response) {
          return response;
        }

        // Si no está en cache, hacer la petición a la red
        return fetch(event.request);
      })
  );
});
