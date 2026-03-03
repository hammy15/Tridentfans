'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, MessageSquare, Bot, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const TOUR_KEY = 'tridentfans_quick_tour_seen';

export function QuickTour() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      // Small delay so page loads first
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-mariners-navy to-mariners-teal p-6 rounded-t-2xl text-white text-center relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-4xl mb-2">🔱</div>
          <h2 className="text-2xl font-bold">Welcome to TridentFans!</h2>
          <p className="text-white/80 text-sm mt-1">The Mariners Fan Community</p>
        </div>

        {/* Quick Links */}
        <div className="p-4 space-y-3">
          <Link href="/predictions" onClick={handleDismiss}>
            <div className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Make Predictions</p>
                <p className="text-sm text-muted-foreground">Pick winners, scores & more</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/bots" onClick={handleDismiss}>
            <div className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-mariners-teal/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-mariners-teal" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Talk to Mark</p>
                <p className="text-sm text-muted-foreground">The guy who runs this place</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/forum" onClick={handleDismiss}>
            <div className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Join the Forum</p>
                <p className="text-sm text-muted-foreground">Talk with fellow fans</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button variant="mariners" className="w-full" onClick={handleDismiss}>
            Let&apos;s Go! 🔱
          </Button>
        </div>
      </div>
    </div>
  );
}
