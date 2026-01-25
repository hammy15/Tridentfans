'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { DigestDay } from '@/types';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'resubscribed' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ username?: string; weekly_digest?: boolean } | null>(null);
  const [selectedDay, setSelectedDay] = useState<DigestDay>('sunday');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please check your email and try again.');
      return;
    }

    // First check if already unsubscribed
    checkStatus();
  }, [token]);

  async function checkStatus() {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${token}&action=info`);
      const data = await response.json();

      if (data.error) {
        setStatus('error');
        setMessage(data.error);
        return;
      }

      setUserInfo(data);

      if (data.weekly_digest === false) {
        // Already unsubscribed
        setStatus('success');
        setMessage('You are already unsubscribed from the weekly digest.');
      } else {
        // Process unsubscribe
        processUnsubscribe();
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  }

  async function processUnsubscribe() {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${token}`);
      const data = await response.json();

      if (data.error) {
        setStatus('error');
        setMessage(data.error);
      } else {
        setStatus('success');
        setMessage('You have been successfully unsubscribed from the weekly digest.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  }

  async function handleResubscribe() {
    setProcessing(true);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'resubscribe',
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setStatus('resubscribed');
        setMessage('Welcome back! You have been resubscribed to the weekly digest.');
      }
    } catch (error) {
      setMessage('Failed to resubscribe. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleChangeDay() {
    setProcessing(true);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'change_day',
          digest_day: selectedDay,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage(`Your digest day has been changed to ${selectedDay}.`);
      }
    } catch (error) {
      setMessage('Failed to update preferences. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-mariners-navy dark:text-white">
              TridentFans
            </h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Seattle Mariners Fan Community
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div
            className={`p-6 text-center ${
              status === 'loading'
                ? 'bg-gray-100 dark:bg-gray-700'
                : status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : status === 'resubscribed'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-mariners-teal/10'
            }`}
          >
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto" />
                <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded mx-auto mt-3" />
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">
                  {status === 'error' ? '!' : status === 'resubscribed' ? '\u2713' : '\u2709'}
                </div>
                <h2 className="text-xl font-bold text-mariners-navy dark:text-white">
                  {status === 'error'
                    ? 'Oops!'
                    : status === 'resubscribed'
                      ? 'Welcome Back!'
                      : 'Unsubscribed'}
                </h2>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{message}</p>

            {/* Resubscribe Option (only show if successfully unsubscribed) */}
            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Changed your mind?
                  </p>
                  <button
                    onClick={handleResubscribe}
                    disabled={processing}
                    className="bg-mariners-teal hover:bg-mariners-teal/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Resubscribe'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">or</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Prefer a different day?
                  </p>
                  <div className="flex justify-center gap-2 mb-3">
                    {(['monday', 'friday', 'sunday'] as DigestDay[]).map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-colors ${
                          selectedDay === day
                            ? 'bg-mariners-navy text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleChangeDay}
                    disabled={processing}
                    className="text-mariners-teal hover:text-mariners-teal/80 text-sm font-medium disabled:opacity-50"
                  >
                    Update Delivery Day
                  </button>
                </div>
              </div>
            )}

            {/* Resubscribed confirmation */}
            {status === 'resubscribed' && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You&apos;ll receive your next digest soon.
                </p>
              </div>
            )}

            {/* Error retry */}
            {status === 'error' && (
              <div className="text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="text-mariners-teal hover:text-mariners-teal/80 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center gap-4 text-sm">
              <Link
                href="/"
                className="text-mariners-teal hover:text-mariners-teal/80 font-medium"
              >
                Go to TridentFans
              </Link>
              {userInfo?.username && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <Link
                    href="/profile"
                    className="text-mariners-teal hover:text-mariners-teal/80 font-medium"
                  >
                    Manage All Preferences
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Go Mariners!
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-mariners-teal border-t-transparent" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
