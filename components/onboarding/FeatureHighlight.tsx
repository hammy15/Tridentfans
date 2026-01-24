'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureHighlightProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
}

const HIGHLIGHTS_KEY = 'tridentfans_feature_highlights';

export function FeatureHighlight({
  id,
  title,
  description,
  children,
  position = 'bottom',
  showOnce = true,
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seenHighlights = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}');
    if (showOnce && seenHighlights[id]) {
      return;
    }

    // Show after a short delay
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [id, showOnce]);

  const handleDismiss = () => {
    const seenHighlights = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '{}');
    seenHighlights[id] = true;
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(seenHighlights));
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-mariners-navy border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-mariners-navy border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-mariners-navy border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-mariners-navy border-y-transparent border-l-transparent',
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 w-64 ${positionClasses[position]} animate-in fade-in zoom-in duration-200`}
        >
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
            style={{ borderWidth: '6px' }}
          />

          {/* Tooltip content */}
          <div className="bg-mariners-navy text-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-mariners-teal shrink-0" />
                  <span className="font-semibold text-sm">{title}</span>
                </div>
                <button onClick={handleDismiss} className="text-white/70 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-white/80 ml-6">{description}</p>
              <div className="mt-2 ml-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-transparent border-white/30 text-white hover:bg-white/10"
                  onClick={handleDismiss}
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reset all feature highlights (for testing)
 */
export function resetFeatureHighlights() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HIGHLIGHTS_KEY);
  }
}
