'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from './PWAProvider';
import { useAuth } from '@/contexts/AuthContext';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

export function PostLoginInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    // Show prompt after login on mobile
    if (user && isMobile() && !isInstalled) {
      const dismissedKey = `pwa-login-prompt-dismissed-${user.id}`;
      const lastDismissed = localStorage.getItem(dismissedKey);

      // Don't show if dismissed in the last 7 days
      if (lastDismissed) {
        const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      // Show after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, isInstalled]);

  const handleDismiss = () => {
    setShowPrompt(false);
    if (user) {
      localStorage.setItem(`pwa-login-prompt-dismissed-${user.id}`, Date.now().toString());
    }
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSSteps(true);
    } else {
      await promptInstall();
      handleDismiss();
    }
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  // iOS Instructions
  if (showIOSSteps) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
        <div className="w-full sm:max-w-md bg-white dark:bg-mariners-navy rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Apple className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Install TridentFans</h2>
                  <p className="text-sm text-white/80">Add to your iPhone</p>
                </div>
              </div>
              <button
                onClick={() => { setShowIOSSteps(false); handleDismiss(); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="p-6 space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-mariners-teal rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Tap the Share button</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Find the share icon at the bottom of Safari
                </p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <Share className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Share</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-mariners-teal rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Add to Home Screen</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scroll down and tap &quot;Add to Home Screen&quot;
                </p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add to Home Screen</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-mariners-teal rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Confirm</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap &quot;Add&quot; in the top right corner
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0">
            <Button
              variant="mariners"
              className="w-full h-12 text-base"
              onClick={() => { setShowIOSSteps(false); handleDismiss(); }}
            >
              Got it!
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main prompt (Android/Desktop)
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-mariners-navy rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🔱</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Get the App!</h2>
              <p className="text-white/80">Install TridentFans on your phone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 bg-mariners-teal/10 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-mariners-teal" />
              </div>
              <div>
                <p className="font-medium">Quick Access</p>
                <p className="text-sm text-muted-foreground">Launch from your home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 bg-mariners-teal/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-mariners-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get game alerts & updates</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 bg-mariners-teal/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-mariners-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Works Offline</p>
                <p className="text-sm text-muted-foreground">Browse even without internet</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            {platform === 'ios' ? (
              <Button
                variant="mariners"
                className="w-full h-12 text-base"
                onClick={handleInstall}
              >
                <Apple className="w-5 h-5 mr-2" />
                Add to Home Screen
              </Button>
            ) : isInstallable ? (
              <Button
                variant="mariners"
                className="w-full h-12 text-base"
                onClick={handleInstall}
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            ) : (
              <Button
                variant="mariners"
                className="w-full h-12 text-base"
                onClick={handleInstall}
              >
                <Download className="w-5 h-5 mr-2" />
                Add to Home Screen
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleDismiss}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostLoginInstallPrompt;
