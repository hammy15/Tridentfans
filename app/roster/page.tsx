import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-react';

// Mock roster data
const mockRoster = {
  pitchers: [
    {
      number: 20,
      name: 'George Kirby',
      position: 'SP',
      stats: { era: '2.89', wins: 15, losses: 8, strikeouts: 189 },
    },
    {
      number: 14,
      name: 'Logan Gilbert',
      position: 'SP',
      stats: { era: '3.12', wins: 14, losses: 7, strikeouts: 201 },
    },
    {
      number: 52,
      name: 'Bryan Woo',
      position: 'SP',
      stats: { era: '3.45', wins: 10, losses: 6, strikeouts: 145 },
    },
    {
      number: 51,
      name: 'Andres Munoz',
      position: 'CL',
      stats: { era: '1.89', wins: 4, losses: 2, saves: 35 },
    },
  ],
  catchers: [
    {
      number: 29,
      name: 'Cal Raleigh',
      position: 'C',
      stats: { avg: '.238', hr: 28, rbi: 89, ops: '.789' },
    },
  ],
  infielders: [
    {
      number: 10,
      name: 'JP Crawford',
      position: 'SS',
      stats: { avg: '.265', hr: 15, rbi: 67, ops: '.756' },
    },
    {
      number: 25,
      name: 'Dylan Moore',
      position: 'UTIL',
      stats: { avg: '.245', hr: 12, rbi: 45, ops: '.712' },
    },
    {
      number: 18,
      name: 'Mitch Garver',
      position: 'DH',
      stats: { avg: '.275', hr: 22, rbi: 78, ops: '.845' },
    },
  ],
  outfielders: [
    {
      number: 44,
      name: 'Julio Rodriguez',
      position: 'CF',
      stats: { avg: '.285', hr: 32, rbi: 98, sb: 28, ops: '.865' },
    },
    {
      number: 16,
      name: 'Luke Raley',
      position: 'LF',
      stats: { avg: '.245', hr: 18, rbi: 56, ops: '.778' },
    },
    {
      number: 33,
      name: 'Victor Robles',
      position: 'RF',
      stats: { avg: '.228', hr: 8, rbi: 34, ops: '.678' },
    },
  ],
};

interface PlayerData {
  number: number;
  name: string;
  position: string;
  stats: Record<string, string | number | undefined>;
}

function PlayerCard({ player }: { player: PlayerData }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-mariners-navy text-white text-xl font-bold">
            {player.number}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{player.name}</h3>
              <Badge variant="secondary">{player.position}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {Object.entries(player.stats)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="font-semibold text-mariners-teal">{value}</p>
                    <p className="text-xs text-muted-foreground uppercase">{key}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RosterPage() {
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
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-white/70">Team AVG</p>
            </div>
            <div>
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-white/70">Home Runs</p>
            </div>
            <div>
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-white/70">Team ERA</p>
            </div>
            <div>
              <p className="text-3xl font-bold">--</p>
              <p className="text-sm text-white/70">Saves</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-white/70">
            Stats will update once the 2026 season begins
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Players</TabsTrigger>
          <TabsTrigger value="pitchers">Pitchers</TabsTrigger>
          <TabsTrigger value="position">Position Players</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                Starting Pitchers & Bullpen
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {mockRoster.pitchers.map(player => (
                  <PlayerCard key={player.number} player={player} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                Catchers
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {mockRoster.catchers.map(player => (
                  <PlayerCard key={player.number} player={player} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                Infielders
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {mockRoster.infielders.map(player => (
                  <PlayerCard key={player.number} player={player} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mariners-teal"></span>
                Outfielders
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {mockRoster.outfielders.map(player => (
                  <PlayerCard key={player.number} player={player} />
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="pitchers">
          <div className="grid gap-4 md:grid-cols-2">
            {mockRoster.pitchers.map(player => (
              <PlayerCard key={player.number} player={player} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="position">
          <div className="grid gap-4 md:grid-cols-2">
            {[...mockRoster.catchers, ...mockRoster.infielders, ...mockRoster.outfielders].map(
              player => (
                <PlayerCard key={player.number} player={player} />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
