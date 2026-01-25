'use client';

import { useState, useEffect } from 'react';
import { DigestPreview } from '@/components/email/DigestPreview';
import type { EmailPreferences as EmailPreferencesType, DigestContent, DigestDay } from '@/types';

interface EmailPreferencesProps {
  userId: string;
  username: string;
  displayName: string | null;
}

export function EmailPreferences({ userId, username, displayName }: EmailPreferencesProps) {
  const [preferences, setPreferences] = useState<EmailPreferencesType | null>(null);
  const [digestContent, setDigestContent] = useState<DigestContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  async function fetchPreferences() {
    try {
      const response = await fetch(`/api/email/preferences?userId=${userId}`);
      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setPreferences(data.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: keyof EmailPreferencesType, value: boolean | string) {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          [key]: value,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setPreferences(data.data);
        setMessage({ type: 'success', text: 'Preferences updated' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setSaving(false);
    }
  }

  async function sendVerificationEmail() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'send_verification',
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: 'Verification email sent! Check your inbox.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send verification email' });
    } finally {
      setSaving(false);
    }
  }

  async function loadPreview() {
    setShowPreview(true);
    setPreviewLoading(true);

    try {
      const response = await fetch(`/api/email/digest?userId=${userId}`);
      const data = await response.json();

      if (!data.error) {
        setDigestContent(data.content);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-mariners-navy dark:text-white">
            Weekly Digest Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get a personalized summary of your predictions, leaderboard position, and community
            highlights.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Email Verification Status */}
          {preferences && !preferences.email_verified && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-xl">!</span>
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    Verify your email
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                    Please verify your email address to receive the weekly digest.
                  </p>
                  <button
                    onClick={sendVerificationEmail}
                    disabled={saving}
                    className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Sending...' : 'Send Verification Email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900 dark:text-white">
                Enable Weekly Digest
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive a weekly email summary
              </p>
            </div>
            <button
              onClick={() => updatePreference('weekly_digest', !preferences?.weekly_digest)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences?.weekly_digest ? 'bg-mariners-teal' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences?.weekly_digest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              Delivery Day
            </label>
            <div className="flex gap-3">
              {(['monday', 'friday', 'sunday'] as DigestDay[]).map(day => (
                <button
                  key={day}
                  onClick={() => updatePreference('digest_day', day)}
                  disabled={saving || !preferences?.weekly_digest}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    preferences?.digest_day === day
                      ? 'bg-mariners-teal text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-3">
              Include in Digest
            </label>
            <div className="space-y-3">
              {[
                { key: 'include_predictions', label: 'Your Prediction Stats' },
                { key: 'include_leaderboard', label: 'Leaderboard Position' },
                { key: 'include_forum', label: 'Hot Forum Topics' },
                { key: 'include_upcoming_games', label: 'Upcoming Games' },
                { key: 'include_news', label: 'Latest News' },
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={preferences?.[item.key as keyof EmailPreferencesType] as boolean}
                    onChange={e =>
                      updatePreference(item.key as keyof EmailPreferencesType, e.target.checked)
                    }
                    disabled={saving || !preferences?.weekly_digest}
                    className="h-5 w-5 rounded border-gray-300 text-mariners-teal focus:ring-mariners-teal disabled:opacity-50"
                  />
                  <span
                    className={`text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white ${
                      !preferences?.weekly_digest ? 'opacity-50' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={loadPreview}
            disabled={saving}
            className="w-full sm:w-auto bg-mariners-navy hover:bg-mariners-navy/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Preview Your Digest
          </button>
        </div>
      </div>

      {/* Preview Modal/Section */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl max-w-2xl w-full my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
              <h3 className="font-bold text-lg text-mariners-navy dark:text-white">
                Digest Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <DigestPreview
                user={{ username, display_name: displayName ?? null }}
                content={digestContent || undefined}
                loading={previewLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailPreferences;
