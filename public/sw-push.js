// Push Notification Service Worker for TridentFans

// Handle push events
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'TridentFans',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    image: data.image,
    tag: data.tag || 'tridentfans-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [100, 50, 100],
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // Determine URL based on action and data
  let url = '/';

  if (action === 'predict') {
    url = '/predictions';
  } else if (action === 'accept' || action === 'decline') {
    url = '/challenges';
  } else if (data.url) {
    url = data.url;
  } else if (data.type) {
    switch (data.type) {
      case 'game_reminder':
      case 'prediction_closing':
        url = '/predictions';
        break;
      case 'challenge_received':
      case 'challenge_accepted':
        url = '/challenges';
        break;
      case 'badge_earned':
        url = '/profile';
        break;
      case 'follower_activity':
        url = '/leaderboard';
        break;
      default:
        url = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event.notification.tag);
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');

  event.waitUntil(
    // Re-subscribe with the same options
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          // Note: userId would need to be stored in IndexedDB or similar
        }),
      });
    })
  );
});

// Log service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing push service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Push service worker activated');
  event.waitUntil(clients.claim());
});
