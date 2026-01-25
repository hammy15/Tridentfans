'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCountdownCompact } from '@/lib/countdown';
import { Radio, Clock, ChevronRight } from 'lucide-react';

interface GameDayCountdownCompactProps {
  className?: string;
  showLink?: boolean;
}

/**
 * Compact countdown widget for header/sidebar
 * Shows: "Next: vs LAA in 2d 5h" or "LIVE: SEA 3 - LAA 2"
 */
export function GameDayCountdownCompact({
  className = '',
  showLink = true,
}: GameDayCountdownCompactProps) {
  const { nextGame, isLive, loading } = useCountdown();
  const [mounted, setMounted] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update countdown text every second
  useEffect(() => {
    if (!nextGame || isLive) return;

    const updateText = () => {
      setCountdownText(formatCountdownCompact(nextGame.date));
    };

    updateText();
    const interval = setInterval(updateText, 1000);
    return () => clearInterval(interval);
  }, [nextGame, isLive]);

  if (!mounted || loading) {
    return (
      <div className={`animate-pulse bg-white/10 rounded-lg h-8 w-32 ${className}`} />
    );
  }

  if (!nextGame) {
    return null;
  }

  const content = (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isLive ? (
        // Live game display
        <>
          <span className="flex items-center gap-1.5 text-red-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-bold">LIVE</span>
          </span>
          <span className="text-white/70">
            SEA {nextGame.marinersScore ?? 0} - {nextGame.opponentAbbr} {nextGame.opponentScore ?? 0}
          </span>
        </>
      ) : (
        // Countdown display
        <>
          <Clock className="h-3.5 w-3.5 text-mariners-teal" />
          <span className="text-white/70">Next:</span>
          <span className="text-white font-medium">
            {nextGame.isHome ? 'vs' : '@'} {nextGame.opponentAbbr}
          </span>
          <span className="text-mariners-teal font-semibold">
            in {countdownText}
          </span>
        </>
      )}
      {showLink && (
        <ChevronRight className="h-3.5 w-3.5 text-white/50" />
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link
        href={isLive ? '/forum?category=game-day' : '/predictions'}
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Even more minimal version - just text
 */
export function GameDayCountdownMini({ className = '' }: { className?: string }) {
  const { nextGame, isLive, loading } = useCountdown();
  const [mounted, setMounted] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!nextGame || isLive) return;

    const updateText = () => {
      setCountdownText(formatCountdownCompact(nextGame.date));
    };

    updateText();
    const interval = setInterval(updateText, 1000);
    return () => clearInterval(interval);
  }, [nextGame, isLive]);

  if (!mounted || loading || !nextGame) {
    return null;
  }

  if (isLive) {
    return (
      <span className={`text-red-400 font-semibold ${className}`}>
        LIVE: SEA {nextGame.marinersScore}-{nextGame.opponentAbbr} {nextGame.opponentScore}
      </span>
    );
  }

  return (
    <span className={className}>
      {nextGame.isHome ? 'vs' : '@'} {nextGame.opponentAbbr} in {countdownText}
    </span>
  );
}

/**
 * Pill/badge style for inline use
 */
export function GameDayCountdownBadge({ className = '' }: { className?: string }) {
  const { nextGame, isLive, loading } = useCountdown();
  const [mounted, setMounted] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!nextGame || isLive) return;

    const updateText = () => {
      setCountdownText(formatCountdownCompact(nextGame.date));
    };

    updateText();
    const interval = setInterval(updateText, 1000);
    return () => clearInterval(interval);
  }, [nextGame, isLive]);

  if (!mounted || loading || !nextGame) {
    return null;
  }

  if (isLive) {
    return (
      <Link href="/forum?category=game-day">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white ${className}`}>
          <Radio className="h-3 w-3 animate-pulse" />
          LIVE: SEA {nextGame.marinersScore} - {nextGame.opponentAbbr} {nextGame.opponentScore}
        </span>
      </Link>
    );
  }

  return (
    <Link href="/predictions">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-mariners-navy text-white ${className}`}>
        <Clock className="h-3 w-3" />
        {nextGame.isHome ? 'vs' : '@'} {nextGame.opponentAbbr} in {countdownText}
      </span>
    </Link>
  );
}
