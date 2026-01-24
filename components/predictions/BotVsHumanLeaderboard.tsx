'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Users, Trophy, TrendingUp } from 'lucide-react';

interface BotStats {
  botId: string;
  displayName: string;
  points: number;
  predictions: number;
  accuracy: number;
}

interface HumanEntry {
  user_id: string;
  total_points: number;
  predictions_made: number;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

const BOT_EMOJIS: Record<string, string> = {
  moose: '🫎',
  captain_hammy: '🧢',
  spartan: '⚔️',
};

export function BotVsHumanLeaderboard() {
  const [botStats, setBotStats] = useState<BotStats[]>([]);
  const [humanStats, setHumanStats] = useState<HumanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/bot-predictions?type=leaderboard');
      const data = await res.json();
      setBotStats(data.bots || []);
      setHumanStats(data.humans || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  // Combine and sort all entries
  const combinedLeaderboard = [
    ...botStats.map(bot => ({
      id: bot.botId,
      name: bot.displayName,
      emoji: BOT_EMOJIS[bot.botId],
      points: bot.points,
      predictions: bot.predictions,
      accuracy: bot.accuracy,
      isBot: true,
    })),
    ...humanStats.map(human => ({
      id: human.user_id,
      name: human.profiles?.display_name || human.profiles?.username || 'Unknown',
      emoji: '👤',
      points: human.total_points,
      predictions: human.predictions_made,
      accuracy: human.predictions_made > 0 ? (human.total_points / (human.predictions_made * 10)) * 100 : 0,
      isBot: false,
    })),
  ].sort((a, b) => b.points - a.points);

  const topBots = botStats.slice().sort((a, b) => b.points - a.points);
  const avgBotAccuracy =
    botStats.length > 0
      ? botStats.reduce((sum, b) => sum + b.accuracy, 0) / botStats.length
      : 0;
  const avgHumanAccuracy =
    humanStats.length > 0
      ? humanStats.reduce((sum, h) => {
          const acc = h.predictions_made > 0 ? (h.total_points / (h.predictions_made * 10)) * 100 : 0;
          return sum + acc;
        }, 0) / humanStats.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-mariners-teal" />
              <div>
                <p className="text-2xl font-bold">{avgBotAccuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Bot Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{avgHumanAccuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Human Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {avgBotAccuracy > avgHumanAccuracy ? 'Bots' : avgHumanAccuracy > avgBotAccuracy ? 'Humans' : 'Tie'}
                </p>
                <p className="text-sm text-muted-foreground">Leading</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="combined">
        <TabsList>
          <TabsTrigger value="combined">Combined</TabsTrigger>
          <TabsTrigger value="bots">Bots Only</TabsTrigger>
          <TabsTrigger value="humans">Humans Only</TabsTrigger>
        </TabsList>

        <TabsContent value="combined">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Combined Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {combinedLeaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No predictions yet</p>
                ) : (
                  combinedLeaderboard.slice(0, 15).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.isBot ? 'bg-mariners-teal/10' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8">{index + 1}</span>
                        <span className="text-xl">{entry.emoji}</span>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.predictions} predictions
                          </p>
                        </div>
                        {entry.isBot && (
                          <Badge variant="outline" className="text-xs">
                            Bot
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.points}</p>
                        <p className="text-xs text-muted-foreground">{entry.accuracy.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bots">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Bot Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBots.map((bot, index) => (
                  <div
                    key={bot.botId}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-2xl font-bold ${
                          index === 0
                            ? 'text-yellow-500'
                            : index === 1
                              ? 'text-gray-400'
                              : 'text-amber-700'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="text-3xl">{BOT_EMOJIS[bot.botId]}</span>
                      <div>
                        <p className="font-semibold text-lg">{bot.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {bot.predictions} predictions made
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{bot.points}</p>
                      <p className="text-sm text-muted-foreground">{bot.accuracy.toFixed(1)}% accuracy</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="humans">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Human Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {humanStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No human predictions yet</p>
                ) : (
                  humanStats.map((human, index) => {
                    const accuracy =
                      human.predictions_made > 0
                        ? (human.total_points / (human.predictions_made * 10)) * 100
                        : 0;
                    return (
                      <div
                        key={human.user_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold w-8">{index + 1}</span>
                          <span className="text-xl">👤</span>
                          <div>
                            <p className="font-medium">
                              {human.profiles?.display_name || human.profiles?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {human.predictions_made} predictions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{human.total_points}</p>
                          <p className="text-xs text-muted-foreground">{accuracy.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
