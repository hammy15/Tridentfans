'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PushNotificationPreferences } from '@/types';

interface UsePushNotificationsOptions {
  userId?: string;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  preferences: PushNotificationPreferences | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (
    prefs: Partial<Omit<PushNotificationPreferences, 'user_id'>>
  ) => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  error: string | null;
}

export function usePushNotifications({
  userId,
  onSubscriptionChange,
}: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<PushNotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check browser support
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      setIsLoading(false);
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch subscription status
  const fetchStatus = useCallback(async () => {
    if (!userId || !isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/push?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(data.isSubscribed);
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching push status:', err);
      setError('Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSupported]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Get VAPID public key
  const getVapidKey = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/push?action=vapid-key');
      const data = await response.json();
      return data.publicKey || null;
    } catch {
      return null;
    }
  };

  // Convert VAPID key to ArrayBuffer
  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  };

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId || !isSupported) {
      setError('Push notifications not available');
      return false;
    }

    setError(null);

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await requestPermission();
        if (result !== 'granted') {
          setError('Notification permission denied');
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setError('Notifications are blocked. Enable them in browser settings.');
        return false;
      }

      // Get VAPID key
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        setError('Push notifications not configured');
        return false;
      }

      // Register service worker
      let registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSubscribed(true);
      onSubscriptionChange?.(true);

      // Refresh preferences
      await fetchStatus();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      console.error('Push subscription error:', err);
      return false;
    }
  }, [userId, isSupported, requestPermission, onSubscriptionChange, fetchStatus]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setError(null);

    try {
      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Notify server
      const response = await fetch('/api/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      setIsSubscribed(false);
      onSubscriptionChange?.(false);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
      console.error('Push unsubscription error:', err);
      return false;
    }
  }, [userId, onSubscriptionChange]);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (newPrefs: Partial<Omit<PushNotificationPreferences, 'user_id'>>): Promise<boolean> => {
      if (!userId) return false;

      setError(null);

      try {
        const response = await fetch('/api/push', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            preferences: newPrefs,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preferences';
        setError(message);
        console.error('Preferences update error:', err);
        return false;
      }
    },
    [userId]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    requestPermission,
    error,
  };
}
