// TridentFans Service Worker
const CACHE_NAME = 'tridentfans-v2';
const STATIC_CACHE_NAME = 'tridentfans-static-v2';
const OFFLINE_URL = '/offline';

// Static assets to cache on install (cache-first strategy)
const STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// Patterns for cache-first strategy (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp)$/,
  /^\/_next\/static\//,
  /^\/icons\//,
];

// Patterns for network-first strategy (API and dynamic content)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\//,
  /^\/_next\/data\//,
  /supabase/,
];

// Install event - cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Helper: Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', error);
    throw error;
  }
}

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate for pages (returns cache immediately, updates in background)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Stale-while-revalidate fetch failed:', error);
    return null;
  });

  return cachedResponse || fetchPromise;
}

// Fetch event - handle different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // Network-first for API calls
  if (matchesPattern(url.pathname, NETWORK_FIRST_PATTERNS)) {
    event.respondWith(
      networkFirst(request).catch(async () => {
        // Return cached response or error for API
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache-first for static assets
  if (matchesPattern(url.pathname, CACHE_FIRST_PATTERNS) || matchesPattern(url.href, CACHE_FIRST_PATTERNS)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for navigation and other requests
  event.respondWith(
    staleWhileRevalidate(request).then((response) => {
      if (response) return response;

      // Fallback to offline page for navigation
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }

      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'TridentFans',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'New notification from TridentFans',
    icon: '/icon-192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'tridentfans-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TridentFans', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Handle background sync (for future use - e.g., queued predictions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-predictions') {
    event.waitUntil(
      // Future: sync queued predictions when back online
      Promise.resolve()
    );
  }
});

// Handle periodic background sync (for future use)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'update-scores') {
    event.waitUntil(
      // Future: fetch latest scores in background
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded - TridentFans v2');
