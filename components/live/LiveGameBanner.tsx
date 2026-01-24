'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Trophy, Clock, ChevronRight } from 'lucide-react';

interface LiveGameData {
  gamePk: number;
  status: 'Live' | 'Final' | 'Preview';
  statusDetail: string;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  marinersScore?: number;
  opponentScore?: number;
  inning?: number;
  inningHalf?: 'Top' | 'Bottom';
  gameTime?: string;
}

export function LiveGameBanner() {
  const [game, setGame] = useState<LiveGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchLiveGame() {
      try {
        const res = await fetch('/api/mlb?type=live');
        const data = await res.json();

        if (data.game) {
          setGame(data.game);
          setLastUpdate(new Date());
        } else if (data.today) {
          // Show today's upcoming game
          setGame({
            ...data.today,
            status: 'Preview',
          });
        } else {
          setGame(null);
        }
      } catch (error) {
        console.error('Failed to fetch live game:', error);
      }
      setLoading(false);
    }

    // Initial fetch
    fetchLiveGame();

    // Poll every 30 seconds for live games
    const interval = setInterval(fetchLiveGame, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!game) {
    return null; // No game today
  }

  const isLive = game.status === 'Live';
  const isFinal = game.status === 'Final';
  const isPreview = game.status === 'Preview';

  // Determine if Mariners are winning
  const marinersWinning =
    game.marinersScore !== undefined &&
    game.opponentScore !== undefined &&
    game.marinersScore > game.opponentScore;

  return (
    <Card
      className={`overflow-hidden ${
        isLive
          ? 'border-red-500 bg-gradient-to-r from-red-500/10 to-mariners-navy/10'
          : isFinal
            ? marinersWinning
              ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-mariners-teal/10'
              : 'border-gray-400'
            : 'border-mariners-teal'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Game Status */}
          <div className="flex items-center gap-4">
            {isLive && (
              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                <Radio className="h-3 w-3" />
                LIVE
              </Badge>
            )}
            {isFinal && (
              <Badge
                variant={marinersWinning ? 'default' : 'secondary'}
                className={marinersWinning ? 'bg-green-600' : ''}
              >
                <Trophy className="h-3 w-3 mr-1" />
                {marinersWinning ? 'WIN' : 'FINAL'}
              </Badge>
            )}
            {isPreview && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                TODAY
              </Badge>
            )}

            <div className="flex items-center gap-3">
              {/* Mariners */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold">
                  SEA
                </div>
                {!isPreview && (
                  <span className={`text-2xl font-bold ${marinersWinning ? 'text-green-600' : ''}`}>
                    {game.marinersScore ?? 0}
                  </span>
                )}
              </div>

              <span className="text-muted-foreground text-lg">{game.isHome ? 'vs' : '@'}</span>

              {/* Opponent */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 text-white font-bold text-sm">
                  {game.opponentAbbr}
                </div>
                {!isPreview && (
                  <span
                    className={`text-2xl font-bold ${
                      !marinersWinning && game.marinersScore !== game.opponentScore
                        ? 'text-red-500'
                        : ''
                    }`}
                  >
                    {game.opponentScore ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Game Info */}
          <div className="hidden md:block text-center">
            {isLive && game.inning && (
              <p className="font-semibold">
                {game.inningHalf} {game.inning}
                {game.inning === 1
                  ? 'st'
                  : game.inning === 2
                    ? 'nd'
                    : game.inning === 3
                      ? 'rd'
                      : 'th'}
              </p>
            )}
            {isPreview && game.gameTime && <p className="font-semibold">{game.gameTime}</p>}
            <p className="text-sm text-muted-foreground">{game.statusDetail}</p>
            {lastUpdate && isLive && (
              <p className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isPreview && (
              <Link href="/predictions">
                <Button variant="mariners" size="sm">
                  Predict
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
            {isLive && (
              <Link href="/forum?category=game-day">
                <Button variant="mariners" size="sm">
                  Game Thread
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
