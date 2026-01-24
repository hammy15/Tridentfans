'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Calendar, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';

interface GameThread {
  id: string;
  title: string;
  mlb_game_id: number;
  created_at: string;
  comment_count?: number;
  is_pinned: boolean;
}

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
}

export function GameThreadBanner() {
  const [threads, setThreads] = useState<GameThread[]>([]);
  const [liveGame, setLiveGame] = useState<LiveGameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch game threads and live game data in parallel
        const [threadsRes, liveRes] = await Promise.all([
          fetch('/api/forum?type=game-threads'),
          fetch('/api/mlb?type=live'),
        ]);

        const threadsData = await threadsRes.json();
        const liveData = await liveRes.json();

        if (threadsData.threads) {
          setThreads(threadsData.threads);
        }

        if (liveData.game) {
          setLiveGame(liveData.game);
        } else if (liveData.today) {
          setLiveGame({
            ...liveData.today,
            status: 'Preview',
          });
        }
      } catch (error) {
        console.error('Failed to fetch game thread data:', error);
      }
      setLoading(false);
    }

    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-mariners-navy to-mariners-teal text-white">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading game threads...
        </CardContent>
      </Card>
    );
  }

  // Find thread for current/today's game
  const activeThread = liveGame
    ? threads.find(t => t.mlb_game_id === liveGame.gamePk)
    : null;

  const isLive = liveGame?.status === 'Live';
  const isFinal = liveGame?.status === 'Final';
  const isPreview = liveGame?.status === 'Preview';

  // If there's a game today, show prominent banner
  if (liveGame) {
    const marinersWinning =
      liveGame.marinersScore !== undefined &&
      liveGame.opponentScore !== undefined &&
      liveGame.marinersScore > liveGame.opponentScore;

    return (
      <Card
        className={`mb-6 overflow-hidden ${
          isLive
            ? 'border-red-500 border-2 bg-gradient-to-r from-red-500/10 to-mariners-navy/20'
            : isFinal
              ? marinersWinning
                ? 'bg-gradient-to-r from-green-500/10 to-mariners-teal/20'
                : 'bg-muted'
              : 'bg-gradient-to-r from-mariners-navy to-mariners-teal text-white'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Game Info */}
            <div className="flex items-center gap-4">
              {isLive && (
                <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  LIVE
                </Badge>
              )}
              {isFinal && (
                <Badge variant={marinersWinning ? 'default' : 'secondary'}>
                  {marinersWinning ? 'WIN' : 'FINAL'}
                </Badge>
              )}
              {isPreview && (
                <Badge variant="outline" className="bg-white/20 border-white/40 text-white">
                  <Calendar className="h-3 w-3 mr-1" />
                  TODAY
                </Badge>
              )}

              <div>
                <h3 className={`font-bold text-lg ${isPreview ? 'text-white' : ''}`}>
                  {isLive || isFinal ? (
                    <>
                      Mariners{' '}
                      <span className={marinersWinning ? 'text-green-500' : ''}>
                        {liveGame.marinersScore ?? 0}
                      </span>
                      {' - '}
                      <span className={!marinersWinning && liveGame.marinersScore !== liveGame.opponentScore ? 'text-red-500' : ''}>
                        {liveGame.opponentScore ?? 0}
                      </span>{' '}
                      {liveGame.opponent}
                    </>
                  ) : (
                    <>
                      Mariners {liveGame.isHome ? 'vs' : '@'} {liveGame.opponent}
                    </>
                  )}
                </h3>
                <p className={`text-sm ${isPreview ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {isLive && liveGame.inning
                    ? `${liveGame.inningHalf} ${liveGame.inning}`
                    : liveGame.statusDetail}
                </p>
              </div>
            </div>

            {/* Right: Thread Link */}
            <div className="flex items-center gap-3">
              {activeThread ? (
                <Link href={`/forum/post/${activeThread.id}`}>
                  <Button
                    variant={isPreview ? 'secondary' : 'mariners'}
                    className={isPreview ? 'bg-white text-mariners-navy hover:bg-white/90' : ''}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Game Thread
                    {activeThread.comment_count && activeThread.comment_count > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-white/20">
                        {activeThread.comment_count}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link href="/predictions">
                  <Button
                    variant={isPreview ? 'secondary' : 'mariners'}
                    className={isPreview ? 'bg-white text-mariners-navy hover:bg-white/90' : ''}
                  >
                    Make Predictions
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No game today - show recent game threads if any
  if (threads.length > 0) {
    const recentThreads = threads.slice(0, 3);

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-mariners-teal" />
              Recent Game Threads
            </h3>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {recentThreads.map(thread => (
              <Link key={thread.id} href={`/forum/post/${thread.id}`}>
                <div className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <p className="font-medium text-sm line-clamp-1">{thread.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{thread.comment_count || 0} comments</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No game threads at all
  return null;
}
