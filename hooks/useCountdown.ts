'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCountdown, isGameDay, type CountdownTime, type NextGameInfo } from '@/lib/countdown';

export interface UseCountdownResult {
  countdown: CountdownTime;
  isGameDay: boolean;
  isLive: boolean;
  nextGame: NextGameInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Real-time countdown hook that updates every second
 * Fetches next game info and maintains live countdown
 */
export function useCountdown(): UseCountdownResult {
  const [nextGame, setNextGame] = useState<NextGameInfo | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNextGame = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/mlb?type=next-game');
      const data = await res.json();

      if (data.game) {
        setNextGame({
          ...data.game,
          date: new Date(data.game.date),
        });
      } else if (data.upcoming && data.upcoming.length > 0) {
        // Fallback to upcoming games list
        const game = data.upcoming[0];
        setNextGame({
          gamePk: game.gamePk,
          date: new Date(game.date),
          opponent: game.opponent,
          opponentAbbr: game.opponentAbbr,
          isHome: game.isHome,
          venue: game.venue,
          status: game.status || 'Preview',
          statusDetail: game.statusDetail || '',
          marinersScore: game.marinersScore,
          opponentScore: game.opponentScore,
        });
      } else {
        setNextGame(null);
      }
    } catch (err) {
      console.error('Failed to fetch next game:', err);
      setError('Failed to load game info');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch game data on mount and periodically
  useEffect(() => {
    fetchNextGame();

    // Refresh game data every 60 seconds
    const dataInterval = setInterval(fetchNextGame, 60000);

    return () => clearInterval(dataInterval);
  }, [fetchNextGame]);

  // Update countdown every second
  useEffect(() => {
    if (!nextGame) return;

    const updateCountdown = () => {
      const newCountdown = formatCountdown(nextGame.date);
      setCountdown(newCountdown);
    };

    // Initial update
    updateCountdown();

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [nextGame]);

  const isGameDayFlag = nextGame ? isGameDay(nextGame.date) : false;
  const isLive = nextGame?.status === 'Live';

  return {
    countdown,
    isGameDay: isGameDayFlag,
    isLive,
    nextGame,
    loading,
    error,
    refresh: fetchNextGame,
  };
}

/**
 * Simple countdown hook for a specific date
 * Lighter weight version for when you already have the game info
 */
export function useSimpleCountdown(targetDate: Date | null): CountdownTime {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      setCountdown(formatCountdown(targetDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}
