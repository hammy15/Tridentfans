'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushOptInProps {
  variant?: 'full' | 'compact' | 'button-only';
  className?: string;
  onStatusChange?: (isSubscribed: boolean) => void;
}

export function PushOptIn({ variant = 'full', className, onStatusChange }: PushOptInProps) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      setLoading(false);
      return false;
    }
    return true;
  }, []);

  // Check current permission and subscription status
  const checkStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!checkSupport()) return;

    try {
      // Check browser permission
      const browserPermission = Notification.permission;
      setPermission(browserPermission as PermissionState);

      // Check subscription status from server
      const response = await fetch(`/api/push?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(data.isSubscribed);
        onStatusChange?.(data.isSubscribed);
      }
    } catch (err) {
      console.error('Error checking push status:', err);
    } finally {
      setLoading(false);
    }
  }, [user, checkSupport, onStatusChange]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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

  // Convert VAPID key to Uint8Array
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

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!user) {
      setError('Please sign in to enable notifications');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result as PermissionState);

        if (result !== 'granted') {
          setError('Permission denied. Enable notifications in your browser settings.');
          setActionLoading(false);
          return;
        }
      }

      // Get VAPID key
      const vapidKey = await getVapidKey();
      if (!vapidKey) {
        setError('Push notifications not configured');
        setActionLoading(false);
        return;
      }

      // Register service worker if needed
      const registration = await navigator.serviceWorker.ready;

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
          userId: user.id,
          subscription: subscription.toJSON(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSubscribed(true);
      setSuccess('Push notifications enabled!');
      onStatusChange?.(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setActionLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!user) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Unsubscribe from browser
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      const response = await fetch('/api/push', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          endpoint: subscription?.endpoint,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unsubscribe');
      }

      setIsSubscribed(false);
      setSuccess('Push notifications disabled');
      onStatusChange?.(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setActionLoading(false);
    }
  };

  // Render button only
  if (variant === 'button-only') {
    if (loading) {
      return (
        <Button variant="ghost" size="icon" disabled>
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      );
    }

    if (permission === 'unsupported' || permission === 'denied') {
      return (
        <Button variant="ghost" size="icon" disabled title="Push notifications unavailable">
          <BellOff className="h-5 w-5 text-muted-foreground" />
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={actionLoading}
        title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
        className={cn(isSubscribed && 'text-mariners-teal')}
      >
        {actionLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isSubscribed ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </Button>
    );
  }

  // Render compact version
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1">
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            {permission === 'unsupported'
              ? 'Not supported in this browser'
              : permission === 'denied'
                ? 'Blocked - update browser settings'
                : isSubscribed
                  ? 'Enabled'
                  : 'Get game reminders & updates'}
          </p>
        </div>
        <Button
          variant={isSubscribed ? 'outline' : 'default'}
          size="sm"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={
            loading || actionLoading || permission === 'unsupported' || permission === 'denied'
          }
          className={cn(
            !isSubscribed && 'bg-mariners-teal hover:bg-mariners-teal/90',
            isSubscribed && 'border-mariners-teal text-mariners-teal'
          )}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="h-4 w-4 mr-1" />
              Disable
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-1" />
              Enable
            </>
          )}
        </Button>
      </div>
    );
  }

  // Render full card version
  return (
    <Card className={cn('border-mariners-navy/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isSubscribed
                ? 'bg-mariners-teal/20 text-mariners-teal'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-lg">Push Notifications</CardTitle>
            <CardDescription>
              {isSubscribed
                ? "You're receiving push notifications"
                : 'Stay updated with game reminders'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'unsupported' && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>Push notifications are not supported in this browser.</p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>Notifications are blocked. Please enable them in your browser settings.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {permission !== 'unsupported' && permission !== 'denied' && (
          <>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Get notified about:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Game reminders (30 min before)</li>
                <li>Prediction deadlines</li>
                <li>Challenge updates</li>
                <li>New achievements</li>
              </ul>
            </div>

            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={loading || actionLoading || !user}
              className={cn(
                'w-full',
                isSubscribed
                  ? 'bg-white border border-mariners-teal text-mariners-teal hover:bg-mariners-teal/10'
                  : 'bg-mariners-teal hover:bg-mariners-teal/90 text-white'
              )}
              variant={isSubscribed ? 'outline' : 'default'}
            >
              {loading || actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {loading ? 'Checking...' : isSubscribed ? 'Disabling...' : 'Enabling...'}
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Disable Push Notifications
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Push Notifications
                </>
              )}
            </Button>

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                Sign in to enable notifications
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
