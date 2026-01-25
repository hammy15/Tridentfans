'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Swords,
  Users,
  Trophy,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { PushNotificationPreferences } from '@/types';

interface PreferenceItem {
  key: keyof Omit<PushNotificationPreferences, 'user_id'>;
  label: string;
  description: string;
  icon: typeof Bell;
}

const preferenceItems: PreferenceItem[] = [
  {
    key: 'game_reminders',
    label: 'Game Reminders',
    description: 'Get notified 30 minutes before Mariners games',
    icon: Calendar,
  },
  {
    key: 'prediction_closing',
    label: 'Prediction Deadlines',
    description: 'Reminder when predictions are about to close',
    icon: Clock,
  },
  {
    key: 'challenge_updates',
    label: 'Challenge Updates',
    description: 'Notifications for challenges received and accepted',
    icon: Swords,
  },
  {
    key: 'follower_activity',
    label: 'Follower Activity',
    description: 'See when users you follow make predictions',
    icon: Users,
  },
  {
    key: 'achievements',
    label: 'Achievements',
    description: 'Get notified when you unlock new badges',
    icon: Trophy,
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Receive a weekly summary of your stats',
    icon: Mail,
  },
];

interface NotificationPreferencesProps {
  className?: string;
  showHeader?: boolean;
}

export function NotificationPreferences({
  className,
  showHeader = true,
}: NotificationPreferencesProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PushNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/push?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Update a single preference
  const updatePreference = async (
    key: keyof Omit<PushNotificationPreferences, 'user_id'>,
    value: boolean
  ) => {
    if (!user || !preferences) return;

    // Optimistic update
    const previousValue = preferences[key];
    setPreferences({ ...preferences, [key]: value });
    setSaving(key);
    setError(null);
    setLastSaved(null);

    try {
      const response = await fetch('/api/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          preferences: { [key]: value },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      if (data.preferences) {
        setPreferences(data.preferences);
      }

      setLastSaved(key);
      setTimeout(() => setLastSaved(null), 2000);
    } catch (err) {
      // Revert on error
      setPreferences({ ...preferences, [key]: previousValue });
      setError('Failed to save preference');
      console.error('Error updating preference:', err);
    } finally {
      setSaving(null);
    }
  };

  // Enable/disable all
  const setAllPreferences = async (enabled: boolean) => {
    if (!user) return;

    setSaving('all');
    setError(null);

    const newPreferences: Partial<Omit<PushNotificationPreferences, 'user_id'>> = {};
    preferenceItems.forEach(item => {
      newPreferences[item.key] = enabled;
    });

    try {
      const response = await fetch('/api/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          preferences: newPreferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update');
      }

      if (data.preferences) {
        setPreferences(data.preferences);
      }

      setLastSaved('all');
      setTimeout(() => setLastSaved(null), 2000);
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating all preferences:', err);
    } finally {
      setSaving(null);
    }
  };

  if (!user) {
    return (
      <Card className={cn('border-mariners-navy/20', className)}>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sign in to manage notification preferences</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('border-mariners-navy/20', className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allEnabled = preferences ? preferenceItems.every(item => preferences[item.key]) : false;
  const noneEnabled = preferences ? preferenceItems.every(item => !preferences[item.key]) : true;

  return (
    <Card className={cn('border-mariners-navy/20', className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-mariners-teal" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </div>

            {/* Quick toggle all */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllPreferences(true)}
                disabled={saving !== null || allEnabled}
                className={cn(
                  'text-xs px-2 py-1 rounded transition-colors',
                  allEnabled
                    ? 'text-mariners-teal bg-mariners-teal/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Enable All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={() => setAllPreferences(false)}
                disabled={saving !== null || noneEnabled}
                className={cn(
                  'text-xs px-2 py-1 rounded transition-colors',
                  noneEnabled
                    ? 'text-red-500 bg-red-50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Disable All
              </button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn(!showHeader && 'pt-6')}>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {preferenceItems.map(item => {
            const Icon = item.icon;
            const isEnabled = preferences?.[item.key] ?? false;
            const isSaving = saving === item.key || saving === 'all';
            const justSaved = lastSaved === item.key || lastSaved === 'all';

            return (
              <div
                key={item.key}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg transition-colors',
                  'hover:bg-muted/50',
                  isEnabled && 'bg-mariners-teal/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                      isEnabled
                        ? 'bg-mariners-teal/20 text-mariners-teal'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {justSaved && !isSaving && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <Switch
                    id={item.key}
                    checked={isEnabled}
                    onCheckedChange={checked => updatePreference(item.key, checked)}
                    disabled={saving !== null}
                    className={cn(isEnabled && 'data-[state=checked]:bg-mariners-teal')}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          You can also manage notifications from your device settings
        </p>
      </CardContent>
    </Card>
  );
}
