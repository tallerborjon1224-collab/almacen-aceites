// Service Worker para Taller Borjón PWA
const CACHE_NAME = 'taller-borjon-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/EstiloXd.css',
  '/Funciones.js',
  '/icono.png',
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
          console.log('Service Worker: Sirviendo desde cache:', event.request.url);
          return response;
        }

        // Si no está en cache, hacer la petición a la red
        return fetch(event.request).then(function(response) {
          // Verificar si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta para guardarla en cache
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Notificación de instalación
self.addEventListener('beforeinstallprompt', function(event) {
  console.log('Service Worker: Evento de instalación detectado');
  event.preventDefault();
  
  // Guardar el evento para mostrarlo más tarde
  self.deferredPrompt = event;
  
  // Opcional: Mostrar tu propia UI de instalación
  return false;
});
