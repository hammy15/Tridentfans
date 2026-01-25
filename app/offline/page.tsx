'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-b from-background to-mariners-navy/5">
      <div className="max-w-md w-full text-center">
        {/* Mariners-themed offline illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Trident logo with offline styling */}
            <div className="h-32 w-32 mx-auto rounded-full bg-mariners-navy/10 dark:bg-mariners-navy/30 flex items-center justify-center border-4 border-dashed border-mariners-teal/50">
              <WifiOff className="h-16 w-16 text-mariners-teal" strokeWidth={1.5} />
            </div>
            {/* Decorative waves */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <svg
                width="120"
                height="20"
                viewBox="0 0 120 20"
                className="text-mariners-teal/30"
                fill="currentColor"
              >
                <path d="M0 10 Q15 0 30 10 T60 10 T90 10 T120 10 V20 H0 Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-mariners-navy dark:text-white mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-muted-foreground text-lg mb-2">
          Looks like you&apos;ve lost your connection.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Don&apos;t worry - TridentFans will be back when you&apos;re online!
        </p>

        {/* Action buttons */}
        <div className="space-y-3 mb-8">
          <Button
            variant="mariners"
            size="lg"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>

          <Link href="/" className="block">
            <Button variant="outline" size="lg" className="w-full border-mariners-teal text-mariners-teal hover:bg-mariners-teal/10">
              <Home className="mr-2 h-5 w-5" />
              Go to Home
            </Button>
          </Link>
        </div>

        {/* Helpful tips */}
        <div className="rounded-xl bg-mariners-navy/5 dark:bg-mariners-navy/20 p-4 text-left">
          <h3 className="font-semibold text-mariners-navy dark:text-white mb-2 text-sm">
            While you wait...
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>- Check your Wi-Fi or mobile data</li>
            <li>- Try moving to an area with better signal</li>
            <li>- Pages you&apos;ve visited before may still work</li>
          </ul>
        </div>

        {/* Footer message */}
        <div className="mt-8 pt-6 border-t border-mariners-teal/20">
          <p className="text-sm text-mariners-teal font-medium">
            Go Mariners! We&apos;ll be here when you get back.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            TridentFans - Seattle Mariners Fan Community
          </p>
        </div>
      </div>
    </div>
  );
}
