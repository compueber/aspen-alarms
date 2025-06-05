// Service Worker para ASPEN Digital Alarms PWA
const CACHE_NAME = 'aspen-alarms-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/css/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/alarm.mp3'
];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Service Worker: Instalado com sucesso');
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
  console.log('⚡ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('✅ Service Worker: Ativado');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições (Estratégia Cache First)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Verifica se recebemos uma resposta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Manipular notificações push
self.addEventListener('push', function(event) {
  console.log('📨 Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Hora do seu compromisso ASPEN Digital!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'aspen-alarm',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'snooze',
        title: 'Soneca 5min',
        icon: '/icons/action-snooze.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('⏰ ASPEN Digital Alarms', options)
  );
});

// Manipular cliques nas notificações
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notificação clicada:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'open') {
    // Abrir ou focar na aplicação
    event.waitUntil(
      clients.matchAll({
        type: 'window'
      }).then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'snooze') {
    // Agendar nova notificação em 5 minutos
    setTimeout(() => {
      self.registration.showNotification('⏰ Soneca - ASPEN Digital', {
        body: 'Tempo da soneca acabou!',
        icon: '/icons/icon-192x192.png',
        tag: 'aspen-snooze'
      });
    }, 5 * 60 * 1000); // 5 minutos
  }
});

// Sincronização em segundo plano
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronização em segundo plano');
    event.waitUntil(
      // Lógica de sincronização aqui
      Promise.resolve()
    );
  }
});

// Manipular eventos de conexão
self.addEventListener('online', function(event) {
  console.log('📶 Conexão restaurada');
});

self.addEventListener('offline', function(event) {
  console.log('📵 Sem conexão');
});

// Atualização em segundo plano
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Limpeza periódica de cache (executar a cada hora)
setInterval(() => {
  console.log('🧹 Limpeza periódica de cache');
  
  caches.open(CACHE_NAME).then(cache => {
    cache.keys().then(keys => {
      keys.forEach(request => {
        // Remover entradas antigas se necessário
        if (request.url.includes('temp-')) {
          cache.delete(request);
        }
      });
    });
  });
}, 60 * 60 * 1000); // 1 hora
