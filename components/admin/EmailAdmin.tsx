'use client';

import { useState, useEffect } from 'react';
import type { DigestDay } from '@/types';

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  recentDigests: Array<{ date: string; sent: number; opened: number }>;
}

interface SubscriberInfo {
  user_id: string;
  username: string;
  display_name: string | null;
  weekly_digest: boolean;
  digest_day: DigestDay;
  email_verified: boolean;
}

export function EmailAdmin() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testUserId, setTestUserId] = useState('');
  const [selectedDay, setSelectedDay] = useState<DigestDay | 'all'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/email-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load subscribers
      const subsResponse = await fetch('/api/admin/email-subscribers');
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        setSubscribers(subsData.subscribers || []);
      }
    } catch (error) {
      console.error('Failed to load email data:', error);
      setMessage({ type: 'error', text: 'Failed to load email data' });
    } finally {
      setLoading(false);
    }
  }

  async function sendTestDigest() {
    if (!testUserId) {
      setMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_single',
          userId: testUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Test digest sent successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test digest' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test digest' });
    } finally {
      setSending(false);
    }
  }

  async function triggerBulkDigest() {
    if (!confirm('Are you sure you want to send digest to all eligible users?')) {
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedDay === 'all' ? 'send_all' : 'send_scheduled',
          day: selectedDay === 'all' ? undefined : selectedDay,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({
          type: 'success',
          text: `Sent: ${data.sent}, Failed: ${data.failed}`,
        });
        // Refresh stats
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send bulk digest' });
    } finally {
      setSending(false);
    }
  }

  const subscribedCount = subscribers.filter(s => s.weekly_digest).length;
  const verifiedCount = subscribers.filter(s => s.email_verified).length;
  const unsubscribedCount = subscribers.filter(s => !s.weekly_digest).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-mariners-navy dark:text-white">
            {stats?.totalSent || 0}
          </div>
          <div className="text-sm text-gray-500">Total Sent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600">{stats?.openRate || 0}%</div>
          <div className="text-sm text-gray-500">Open Rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-mariners-teal">{stats?.clickRate || 0}%</div>
          <div className="text-sm text-gray-500">Click Rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-mariners-navy dark:text-white">
            {subscribedCount}
          </div>
          <div className="text-sm text-gray-500">Active Subscribers</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Send Test Digest */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg text-mariners-navy dark:text-white mb-4">
            Send Test Digest
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={testUserId}
                onChange={e => setTestUserId(e.target.value)}
                placeholder="Enter user ID..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-mariners-teal focus:border-transparent"
              />
            </div>
            <button
              onClick={sendTestDigest}
              disabled={sending || !testUserId}
              className="w-full bg-mariners-navy hover:bg-mariners-navy/90 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Test Digest'}
            </button>
          </div>
        </div>

        {/* Trigger Bulk Digest */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg text-mariners-navy dark:text-white mb-4">
            Trigger Bulk Digest
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Group
              </label>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value as DigestDay | 'all')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-mariners-teal focus:border-transparent"
              >
                <option value="all">All Subscribers</option>
                <option value="monday">Monday Subscribers</option>
                <option value="friday">Friday Subscribers</option>
                <option value="sunday">Sunday Subscribers</option>
              </select>
            </div>
            <button
              onClick={triggerBulkDigest}
              disabled={sending}
              className="w-full bg-mariners-teal hover:bg-mariners-teal/90 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send to All'}
            </button>
          </div>
        </div>
      </div>

      {/* Subscriber Stats by Day */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg text-mariners-navy dark:text-white mb-4">
          Subscriber Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(['monday', 'friday', 'sunday'] as DigestDay[]).map(day => {
            const count = subscribers.filter(s => s.weekly_digest && s.digest_day === day).length;
            const percentage = subscribedCount > 0 ? Math.round((count / subscribedCount) * 100) : 0;

            return (
              <div key={day} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-mariners-navy dark:text-white">{count}</div>
                <div className="text-sm text-gray-500 capitalize">{day}</div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mariners-teal rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          <div className="text-sm text-green-700 dark:text-green-400">Verified Emails</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {subscribers.length - verifiedCount}
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-400">Pending Verification</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{unsubscribedCount}</div>
          <div className="text-sm text-red-700 dark:text-red-400">Unsubscribed</div>
        </div>
      </div>

      {/* Recent Digest History */}
      {stats?.recentDigests && stats.recentDigests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg text-mariners-navy dark:text-white mb-4">
            Recent Digest History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Sent</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Opened</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">Open Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDigests.map(digest => (
                  <tr
                    key={digest.date}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 text-gray-900 dark:text-white">
                      {new Date(digest.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {digest.sent}
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {digest.opened}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-medium ${
                          digest.sent > 0 && (digest.opened / digest.sent) * 100 > 30
                            ? 'text-green-600'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {digest.sent > 0 ? Math.round((digest.opened / digest.sent) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailAdmin;
