'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Loader2 } from 'lucide-react';
import type { MLBPlayer } from '@/lib/mlb-api';

interface RosterPlayer extends MLBPlayer {
  stats?: Record<string, string | number>;
}

// Mock stats until season starts
const mockStats: Record<string, Record<string, string | number>> = {
  'George Kirby': { era: '2.89', W: 15, L: 8, K: 189 },
  'Logan Gilbert': { era: '3.12', W: 14, L: 7, K: 201 },
  'Julio Rodriguez': { avg: '.285', HR: 32, RBI: 98, SB: 28 },
  'Cal Raleigh': { avg: '.238', HR: 28, RBI: 89, OPS: '.789' },
  'JP Crawford': { avg: '.265', HR: 15, RBI: 67, OPS: '.756' },
};

function PlayerCard({ player }: { player: RosterPlayer }) {
  const stats = mockStats[player.fullName] || {};

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-mariners-navy text-white text-xl font-bold">
            {player.primaryNumber || '--'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{player.fullName}</h3>
              <Badge variant="secondary">{player.primaryPosition.abbreviation}</Badge>
            </div>
            {Object.keys(stats).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="font-semibold text-mariners-teal">{value}</p>
                    <p className="text-xs text-muted-foreground uppercase">{key}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Stats available when season begins
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoster() {
      try {
        const res = await fetch('/api/mlb?type=roster');
        const data = await res.json();
        if (data.roster) {
          setRoster(data.roster);
        }
      } catch (error) {
        console.error('Failed to fetch roster:', error);
      }
      setLoading(false);
    }
    fetchRoster();
  }, []);

  const pitchers = roster.filter(
    p =>
      p.primaryPosition.abbreviation === 'P' ||
      p.primaryPosition.abbreviation === 'SP' ||
      p.primaryPosition.abbreviation === 'RP'
  );

  const catchers = roster.filter(p => p.primaryPosition.abbreviation === 'C');

  const infielders = roster.filter(p =>
    ['1B', '2B', 'SS', '3B', 'DH'].includes(p.primaryPosition.abbreviation)
  );

  const outfielders = roster.filter(p =>
    ['LF', 'CF', 'RF', 'OF'].includes(p.primaryPosition.abbreviation)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-mariners-teal" />
          Roster
        </h1>
        <p className="mt-2 text-muted-foreground">Seattle Mariners 2026 roster and player stats</p>
      </div>

      {/* Team Stats Summary */}
      <Card className="mb-8 bg-gradient-to-r from-mariners-navy to-mariners-teal text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">{roster.length}</p>
              <p className="text-sm text-white/70">Active Roster</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{pitchers.length}</p>
              <p className="text-sm text-white/70">Pitchers</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{infielders.length + catchers.length}</p>
              <p className="text-sm text-white/70">Infielders</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{outfielders.length}</p>
              <p className="text-sm text-white/70">Outfielders</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-white/70">
            Player stats will update once the 2026 season begins
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Players ({roster.length})</TabsTrigger>
          <TabsTrigger value="pitchers">Pitchers ({pitchers.length})</TabsTrigger>
          <TabsTrigger value="position">
            Position Players ({catchers.length + infielders.length + outfielders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-8">
            {pitchers.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                  Pitchers
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pitchers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </section>
            )}

            {catchers.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                  Catchers
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {catchers.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </section>
            )}

            {infielders.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                  Infielders
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {infielders.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </section>
            )}

            {outfielders.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                  Outfielders
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {outfielders.map(player => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </section>
            )}

            {roster.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No roster data available</p>
                <p className="text-sm mt-2">Roster will be updated when the season begins</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pitchers">
          <div className="grid gap-4 md:grid-cols-2">
            {pitchers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
            {pitchers.length === 0 && (
              <p className="text-center text-muted-foreground py-8 col-span-2">
                No pitchers data available
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="position">
          <div className="grid gap-4 md:grid-cols-2">
            {[...catchers, ...infielders, ...outfielders].map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
            {catchers.length + infielders.length + outfielders.length === 0 && (
              <p className="text-center text-muted-foreground py-8 col-span-2">
                No position players data available
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
