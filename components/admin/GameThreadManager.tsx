'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Plus, CheckCircle } from 'lucide-react';

interface UpcomingGame {
  gamePk: number;
  date: string;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  venue: string;
}

export function GameThreadManager({ adminPassword }: { adminPassword: string }) {
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [existingCount, setExistingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  const [createdThreads, setCreatedThreads] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchGameThreads();
  }, []);

  async function fetchGameThreads() {
    try {
      const res = await fetch('/api/game-threads');
      const data = await res.json();
      setUpcomingGames(data.upcoming || []);
      setExistingCount(data.existing || 0);
    } catch (error) {
      console.error('Failed to fetch game threads:', error);
    }
    setLoading(false);
  }

  async function createThread(gamePk: number) {
    setCreatingFor(gamePk);
    try {
      const res = await fetch('/api/game-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamePk, password: adminPassword }),
      });

      if (res.ok) {
        setCreatedThreads(prev => new Set([...prev, gamePk]));
        setUpcomingGames(prev => prev.filter(g => g.gamePk !== gamePk));
      } else if (res.status === 409) {
        // Thread already exists
        setCreatedThreads(prev => new Set([...prev, gamePk]));
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
    setCreatingFor(null);
  }

  async function createAllThreads() {
    for (const game of upcomingGames) {
      await createThread(game.gamePk);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{upcomingGames.length}</p>
            <p className="text-sm text-muted-foreground">Games Need Threads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{existingCount}</p>
            <p className="text-sm text-muted-foreground">Existing Threads</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Games */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Games
              </CardTitle>
              <CardDescription>Create game day threads for upcoming Mariners games</CardDescription>
            </div>
            {upcomingGames.length > 0 && (
              <Button variant="mariners" onClick={createAllThreads}>
                <Plus className="h-4 w-4 mr-2" />
                Create All Threads
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All upcoming games have threads!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingGames.map(game => {
                const gameDate = new Date(game.date);
                const isCreated = createdThreads.has(game.gamePk);

                return (
                  <div
                    key={game.gamePk}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {gameDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="font-bold">
                          {gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {game.isHome ? 'vs' : '@'} {game.opponent}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {gameDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}{' '}
                          • {game.venue}
                        </p>
                      </div>
                      <Badge variant={game.isHome ? 'default' : 'outline'}>
                        {game.isHome ? 'Home' : 'Away'}
                      </Badge>
                    </div>
                    <Button
                      variant={isCreated ? 'outline' : 'mariners'}
                      onClick={() => createThread(game.gamePk)}
                      disabled={creatingFor === game.gamePk || isCreated}
                    >
                      {creatingFor === game.gamePk ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCreated ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Created
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Thread
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auto-Creation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Game threads are automatically created in the <strong>Game Day</strong> forum category
            and pinned to the top.
          </p>
          <p>
            To enable automatic thread creation, set up a cron job to call{' '}
            <code className="bg-muted px-1 rounded">/api/game-threads</code> daily with your CRON_SECRET.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
