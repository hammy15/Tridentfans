'use client';

import { useEffect, useState } from 'react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isStreakActive = currentStreak > 0;

  // Trigger animation on mount and when streak changes
  useEffect(() => {
    if (isStreakActive) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, isStreakActive]);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Main streak display */}
      <div className="flex items-center gap-2">
        {/* Animated flame */}
        <div className={`relative ${isStreakActive ? 'animate-[flame_0.8s_ease-in-out_infinite]' : ''}`}>
          <span
            className={`text-3xl transition-transform duration-300 ${
              isAnimating ? 'scale-125' : 'scale-100'
            }`}
            role="img"
            aria-label="fire"
          >
            {isStreakActive ? '🔥' : '💨'}
          </span>

          {/* Glow effect when active */}
          {isStreakActive && (
            <div className="absolute inset-0 blur-lg bg-orange-400/40 rounded-full -z-10" />
          )}
        </div>

        {/* Streak count and text */}
        <div className="flex flex-col">
          <span
            className={`text-2xl font-bold transition-colors ${
              isStreakActive
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-muted-foreground'
            }`}
          >
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-muted-foreground">
            {isStreakActive ? 'streak' : 'no streak'}
          </span>
        </div>
      </div>

      {/* Longest streak display */}
      {longestStreak > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Best: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          {currentStreak === longestStreak && currentStreak > 0 && (
            <span className="ml-1 text-mariners-gold">Personal best!</span>
          )}
        </p>
      )}

    </div>
  );
}

// Compact version for inline display
interface CompactStreakProps {
  currentStreak: number;
}

export function CompactStreak({ currentStreak }: CompactStreakProps) {
  const isActive = currentStreak > 0;

  return (
    <div className="inline-flex items-center gap-1">
      <span className={isActive ? 'animate-pulse' : ''}>
        {isActive ? '🔥' : '💨'}
      </span>
      <span
        className={`text-sm font-medium ${
          isActive ? 'text-orange-500' : 'text-muted-foreground'
        }`}
      >
        {currentStreak}
      </span>
    </div>
  );
}
