'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Trophy, Clock, ChevronRight, Circle } from 'lucide-react';

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
  // Enhanced live data
  outs?: number;
  balls?: number;
  strikes?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  currentBatter?: { name: string; avg: string };
  currentPitcher?: { name: string; era: string };
  lastPlay?: string;
  marinersHits?: number;
  opponentHits?: number;
  marinersErrors?: number;
  opponentErrors?: number;
}

// Diamond component showing runners on base
function BaseDiamond({
  onFirst,
  onSecond,
  onThird,
}: {
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
}) {
  return (
    <div className="relative w-12 h-12">
      {/* Second base (top) */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 ${
          onSecond ? 'bg-yellow-400 border-yellow-500' : 'bg-muted border-muted-foreground/30'
        }`}
      />
      {/* Third base (left) */}
      <div
        className={`absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 rotate-45 border-2 ${
          onThird ? 'bg-yellow-400 border-yellow-500' : 'bg-muted border-muted-foreground/30'
        }`}
      />
      {/* First base (right) */}
      <div
        className={`absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 rotate-45 border-2 ${
          onFirst ? 'bg-yellow-400 border-yellow-500' : 'bg-muted border-muted-foreground/30'
        }`}
      />
    </div>
  );
}

// Outs indicator
function OutsIndicator({ outs = 0 }: { outs?: number }) {
  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs text-muted-foreground mr-1">OUT</span>
      {[0, 1, 2].map(i => (
        <Circle
          key={i}
          className={`h-3 w-3 ${i < outs ? 'fill-red-500 text-red-500' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

// Count display (balls-strikes)
function CountDisplay({ balls = 0, strikes = 0 }: { balls?: number; strikes?: number }) {
  return (
    <div className="flex gap-2 text-sm">
      <div className="flex gap-0.5 items-center">
        <span className="text-xs text-muted-foreground mr-1">B</span>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < balls ? 'bg-green-500' : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex gap-0.5 items-center">
        <span className="text-xs text-muted-foreground mr-1">S</span>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < strikes ? 'bg-yellow-500' : 'bg-muted'}`}
          />
        ))}
      </div>
    </div>
  );
}

export function LiveGameBanner() {
  const [game, setGame] = useState<LiveGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchLiveGame() {
      try {
        const res = await fetch('/api/mlb?type=live');
        const data = await res.json();

        if (data.game) {
          setGame(data.game);
          setLastUpdate(new Date());
        } else if (data.today) {
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
    return null;
  }

  if (!game) {
    return null;
  }

  const isLive = game.status === 'Live';
  const isFinal = game.status === 'Final';
  const isPreview = game.status === 'Preview';

  const marinersWinning =
    game.marinersScore !== undefined &&
    game.opponentScore !== undefined &&
    game.marinersScore > game.opponentScore;

  const getInningOrdinal = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  return (
    <Card
      className={`overflow-hidden transition-all ${
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
        {/* Main Row */}
        <div className="flex items-center justify-between">
          {/* Left: Status + Score */}
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
          <div className="hidden md:flex items-center gap-6">
            {isLive && game.inning && (
              <>
                <div className="text-center">
                  <p className="font-semibold text-lg">
                    {game.inningHalf} {getInningOrdinal(game.inning)}
                  </p>
                  <OutsIndicator outs={game.outs} />
                </div>
                <BaseDiamond
                  onFirst={game.onFirst}
                  onSecond={game.onSecond}
                  onThird={game.onThird}
                />
                <CountDisplay balls={game.balls} strikes={game.strikes} />
              </>
            )}
            {isPreview && game.gameTime && (
              <div className="text-center">
                <p className="font-semibold text-lg">{game.gameTime}</p>
                <p className="text-sm text-muted-foreground">{game.statusDetail}</p>
              </div>
            )}
            {isFinal && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{game.statusDetail}</p>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isLive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="hidden md:flex"
              >
                {expanded ? 'Less' : 'More'}
              </Button>
            )}
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

        {/* Expanded Live Details */}
        {isLive && expanded && (
          <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4">
            {/* At Bat */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">At Bat</p>
              <p className="font-semibold">{game.currentBatter?.name || 'Unknown'}</p>
              {game.currentBatter?.avg && (
                <p className="text-sm text-muted-foreground">AVG: {game.currentBatter.avg}</p>
              )}
            </div>

            {/* Pitching */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pitching</p>
              <p className="font-semibold">{game.currentPitcher?.name || 'Unknown'}</p>
              {game.currentPitcher?.era && (
                <p className="text-sm text-muted-foreground">ERA: {game.currentPitcher.era}</p>
              )}
            </div>

            {/* Game Stats */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stats</p>
              <div className="grid grid-cols-3 text-center text-sm">
                <div></div>
                <div className="font-semibold">H</div>
                <div className="font-semibold">E</div>
                <div className="text-left">SEA</div>
                <div>{game.marinersHits ?? 0}</div>
                <div>{game.marinersErrors ?? 0}</div>
                <div className="text-left">{game.opponentAbbr}</div>
                <div>{game.opponentHits ?? 0}</div>
                <div>{game.opponentErrors ?? 0}</div>
              </div>
            </div>

            {/* Last Play */}
            {game.lastPlay && (
              <div className="md:col-span-3 bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Last Play
                </p>
                <p className="text-sm">{game.lastPlay}</p>
              </div>
            )}

            {/* Update Time */}
            {lastUpdate && (
              <div className="md:col-span-3 text-center text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Mobile: Condensed Info */}
        {isLive && game.inning && (
          <div className="md:hidden mt-3 pt-3 border-t flex items-center justify-between text-sm">
            <span>
              {game.inningHalf} {getInningOrdinal(game.inning)}
            </span>
            <span>{game.outs} out{game.outs !== 1 ? 's' : ''}</span>
            <span>
              {game.balls}-{game.strikes}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
