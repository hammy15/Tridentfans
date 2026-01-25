'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from './PWAProvider';

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
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}

interface InstallPromptProps {
  variant?: 'banner' | 'button' | 'card';
  className?: string;
  onDismiss?: () => void;
}

export function InstallPrompt({ variant = 'banner', className = '', onDismiss }: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // For non-installable platforms (not iOS, not supported browser), don't show
  if (!isInstallable && platform !== 'ios') {
    return null;
  }

  const PlatformIcon = platform === 'ios' ? Apple : platform === 'desktop' ? Monitor : Smartphone;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-mariners-navy">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-mariners-navy dark:text-white">
              Install TridentFans
            </h3>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white text-xs font-bold">
                1
              </div>
              <p>
                Tap the <span className="font-semibold">Share</span> button at the bottom of your browser
                <span className="ml-1 inline-block">
                  <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z"/>
                  </svg>
                </span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white text-xs font-bold">
                2
              </div>
              <p>
                Scroll down and tap <span className="font-semibold">Add to Home Screen</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white text-xs font-bold">
                3
              </div>
              <p>
                Tap <span className="font-semibold">Add</span> in the top right corner
              </p>
            </div>
          </div>

          <Button
            variant="mariners"
            className="mt-6 w-full"
            onClick={() => setShowIOSInstructions(false)}
          >
            Got it!
          </Button>
        </div>
      </div>
    );
  }

  // Button variant - compact install button
  if (variant === 'button') {
    return (
      <Button
        variant="mariners"
        size="sm"
        onClick={handleInstall}
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
    );
  }

  // Card variant - larger promotional card
  if (variant === 'card') {
    return (
      <div className={`rounded-xl border-2 border-mariners-teal bg-gradient-to-br from-mariners-navy to-mariners-navy/90 p-6 text-white shadow-lg ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mariners-teal">
            <PlatformIcon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">Get the TridentFans App</h3>
            <p className="mt-1 text-sm text-gray-300">
              Install our app for the best experience. Get instant access to predictions, live scores, and community discussions.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleInstall}
                className="bg-mariners-teal hover:bg-mariners-teal/90 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
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

  // Banner variant (default) - sticky bottom banner
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t-2 border-mariners-teal bg-mariners-navy p-4 shadow-lg md:bottom-4 md:left-auto md:right-4 md:w-96 md:rounded-xl md:border-2 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white">
          <PlatformIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white">Install TridentFans</h3>
          <p className="text-sm text-gray-300 mt-0.5">
            Add to your home screen for quick access
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-mariners-teal hover:bg-mariners-teal/90 text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/10"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
