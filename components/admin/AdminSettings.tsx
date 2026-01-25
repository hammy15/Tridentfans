'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings,
  Save,
  AlertTriangle,
  Megaphone,
  Wrench,
  RefreshCw,
  Loader2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  Clock,
} from 'lucide-react';

interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementType: 'info' | 'warning' | 'success';
  defaultTimezone: string;
  features: {
    predictions: boolean;
    forum: boolean;
    bots: boolean;
    tournaments: boolean;
    challenges: boolean;
    polls: boolean;
    notifications: boolean;
    email: boolean;
    prospects: boolean;
    playerCompare: boolean;
  };
}

const defaultSettings: SiteSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'TridentFans is currently undergoing scheduled maintenance. Please check back soon!',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
  defaultTimezone: 'America/Los_Angeles',
  features: {
    predictions: true,
    forum: true,
    bots: true,
    tournaments: true,
    challenges: true,
    polls: true,
    notifications: true,
    email: true,
    prospects: true,
    playerCompare: true,
  },
};

const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'UTC', label: 'UTC' },
];

interface FeatureToggleProps {
  name: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function FeatureToggle({ name, description, enabled, onChange }: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-mariners-teal text-white' : 'bg-muted'}`}
      >
        {enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
      </button>
    </div>
  );
}

export function AdminSettings({ adminPassword: _adminPassword }: { adminPassword: string }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load settings from localStorage for demo
    // In production, this would be an API call
    const stored = localStorage.getItem('tridentfans_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        setSettings(defaultSettings);
      }
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      // In production, save to backend
      // await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(settings) });

      // For demo, save to localStorage
      localStorage.setItem('tridentfans_settings', JSON.stringify(settings));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }

    setSaving(false);
  };

  const handleClearCache = async (cacheType: string) => {
    setClearingCache(cacheType);

    // Simulate cache clear
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setClearingCache(null);
    alert(`${cacheType} cache cleared successfully!`);
  };

  const handleFeatureToggle = (feature: keyof SiteSettings['features'], enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <Card className={settings.maintenanceMode ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Enable maintenance mode to temporarily disable the site for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.maintenanceMode && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                {settings.maintenanceMode ? 'Maintenance Mode Active' : 'Site is Live'}
              </span>
            </div>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
              className={`p-2 rounded-lg transition-colors ${settings.maintenanceMode ? 'bg-yellow-500 text-white' : 'bg-muted'}`}
            >
              {settings.maintenanceMode ? (
                <ToggleRight className="h-6 w-6" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>
          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea
                value={settings.maintenanceMessage}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
                }
                placeholder="Message to show users during maintenance..."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Site Announcement
          </CardTitle>
          <CardDescription>
            Display a banner announcement to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Checkbox
              id="announcement-enabled"
              checked={settings.announcementEnabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, announcementEnabled: checked === true }))
              }
            />
            <Label htmlFor="announcement-enabled">Enable announcement banner</Label>
          </div>

          {settings.announcementEnabled && (
            <>
              <div className="space-y-2">
                <Label>Announcement Text</Label>
                <Textarea
                  value={settings.announcementText}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, announcementText: e.target.value }))
                  }
                  placeholder="Your announcement message..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Banner Type</Label>
                <select
                  value={settings.announcementType}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      announcementType: e.target.value as 'info' | 'warning' | 'success',
                    }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="success">Success (Green)</option>
                </select>
              </div>
              {/* Preview */}
              {settings.announcementText && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    settings.announcementType === 'info'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : settings.announcementType === 'warning'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}
                >
                  <strong>Preview:</strong> {settings.announcementText}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Default Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Default Timezone
          </CardTitle>
          <CardDescription>
            Set the default timezone for displaying game times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={settings.defaultTimezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, defaultTimezone: e.target.value }))}
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Toggles
          </CardTitle>
          <CardDescription>
            Enable or disable site features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureToggle
            name="Predictions"
            description="Game predictions and leaderboards"
            enabled={settings.features.predictions}
            onChange={(enabled) => handleFeatureToggle('predictions', enabled)}
          />
          <FeatureToggle
            name="Forum"
            description="Community discussion forum"
            enabled={settings.features.forum}
            onChange={(enabled) => handleFeatureToggle('forum', enabled)}
          />
          <FeatureToggle
            name="AI Bots"
            description="Chat with AI Mariners experts"
            enabled={settings.features.bots}
            onChange={(enabled) => handleFeatureToggle('bots', enabled)}
          />
          <FeatureToggle
            name="Tournaments"
            description="Weekly and monthly prediction tournaments"
            enabled={settings.features.tournaments}
            onChange={(enabled) => handleFeatureToggle('tournaments', enabled)}
          />
          <FeatureToggle
            name="Challenges"
            description="Head-to-head prediction challenges"
            enabled={settings.features.challenges}
            onChange={(enabled) => handleFeatureToggle('challenges', enabled)}
          />
          <FeatureToggle
            name="Polls"
            description="Community polls and surveys"
            enabled={settings.features.polls}
            onChange={(enabled) => handleFeatureToggle('polls', enabled)}
          />
          <FeatureToggle
            name="Notifications"
            description="Push and in-app notifications"
            enabled={settings.features.notifications}
            onChange={(enabled) => handleFeatureToggle('notifications', enabled)}
          />
          <FeatureToggle
            name="Email"
            description="Email notifications and digests"
            enabled={settings.features.email}
            onChange={(enabled) => handleFeatureToggle('email', enabled)}
          />
          <FeatureToggle
            name="Prospects"
            description="Prospect tracking and rankings"
            enabled={settings.features.prospects}
            onChange={(enabled) => handleFeatureToggle('prospects', enabled)}
          />
          <FeatureToggle
            name="Player Compare"
            description="Player comparison tool"
            enabled={settings.features.playerCompare}
            onChange={(enabled) => handleFeatureToggle('playerCompare', enabled)}
          />
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear cached data to refresh content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => handleClearCache('MLB API')}
              disabled={clearingCache !== null}
            >
              {clearingCache === 'MLB API' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Clear MLB Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClearCache('Forum')}
              disabled={clearingCache !== null}
            >
              {clearingCache === 'Forum' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Clear Forum Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClearCache('All')}
              disabled={clearingCache !== null}
            >
              {clearingCache === 'All' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Clear All Caches
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          {saveStatus === 'success' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Settings saved successfully</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Failed to save settings</span>
            </>
          )}
        </div>
        <Button variant="mariners" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
