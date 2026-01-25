'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, ChevronDown, ChevronUp, Trophy, Target, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';

interface BotPrediction {
  id: string;
  bot_id: string;
  game_id: string;
  predictions: Record<string, string>;
  score: number | null;
  accuracy: number | null;
  created_at: string;
}

interface BotPredictionsProps {
  gameId: string;
}

const BOT_INFO: Record<string, { emoji: string; name: string; color: string }> = {
  moose: { emoji: '🫎', name: 'Moose', color: 'bg-amber-500/10 border-amber-500/30' },
  captain_hammy: { emoji: '🧢', name: 'Captain Hammy', color: 'bg-mariners-teal/10 border-mariners-teal/30' },
  spartan: { emoji: '⚔️', name: 'Spartan', color: 'bg-red-500/10 border-red-500/30' },
};

const PREDICTION_LABELS: Record<string, string> = {
  winner: 'Winner',
  run_differential: 'Run Differential',
  total_runs: 'Total Runs',
  first_to_score: 'First to Score',
  mariners_hits: 'Mariners Hits',
  mariners_hr: 'Mariners HRs',
  total_strikeouts: 'Total Strikeouts',
  lead_after_5: 'Lead After 5',
  extra_innings: 'Extra Innings?',
  shutout: 'Shutout?',
};

export function BotPredictions({ gameId }: BotPredictionsProps) {
  const [predictions, setPredictions] = useState<BotPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    fetchBotPredictions();
  }, [gameId]);

  async function fetchBotPredictions() {
    const supabase = createClient();

    try {
      // Fetch bot predictions for this game
      const { data: botPreds, error } = await supabase
        .from('bot_predictions')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching bot predictions:', error);
        return;
      }

      setPredictions(botPreds || []);

      // Check if game is finished (any bot has a score)
      const hasScores = botPreds?.some(p => p.score !== null);
      setGameFinished(hasScores);
    } catch (error) {
      console.error('Failed to fetch bot predictions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-mariners-teal" />
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Bot className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No bot predictions for this game yet</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by score if game is finished
  const sortedPredictions = gameFinished
    ? [...predictions].sort((a, b) => (b.score || 0) - (a.score || 0))
    : predictions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-mariners-teal" />
            Bot Predictions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 px-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Collapsed view - show summary */}
      {!expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {sortedPredictions.map((pred, index) => {
                const bot = BOT_INFO[pred.bot_id] || { emoji: '🤖', name: pred.bot_id, color: 'bg-muted' };
                return (
                  <div
                    key={pred.id}
                    className="flex items-center gap-1"
                    title={bot.name}
                  >
                    <span className="text-xl">{bot.emoji}</span>
                    {gameFinished && pred.score !== null && (
                      <span className="text-sm font-medium">
                        {pred.score}
                        {index === 0 && sortedPredictions.length > 1 && (
                          <Trophy className="h-3 w-3 inline ml-0.5 text-yellow-500" />
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {gameFinished && (
              <Badge variant="outline" className="text-xs">
                Game Complete
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Expanded view - show all picks */}
      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {sortedPredictions.map((pred, index) => {
            const bot = BOT_INFO[pred.bot_id] || { emoji: '🤖', name: pred.bot_id, color: 'bg-muted' };

            return (
              <div
                key={pred.id}
                className={`p-4 rounded-lg border ${bot.color}`}
              >
                {/* Bot header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{bot.emoji}</span>
                    <div>
                      <p className="font-semibold">{bot.name}</p>
                      {gameFinished && pred.accuracy !== null && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {pred.accuracy.toFixed(0)}% accuracy
                        </p>
                      )}
                    </div>
                  </div>
                  {gameFinished && pred.score !== null && (
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {pred.score}
                        {index === 0 && sortedPredictions.length > 1 && (
                          <Trophy className="h-4 w-4 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  )}
                </div>

                {/* Predictions grid */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(pred.predictions).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm bg-background/50 rounded px-2 py-1"
                    >
                      <span className="text-muted-foreground truncate">
                        {PREDICTION_LABELS[key] || key}
                      </span>
                      <span className="font-medium capitalize ml-2">
                        {formatPredictionValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

function formatPredictionValue(value: string): string {
  // Convert underscores to spaces and format common values
  return value
    .replace(/_/g, ' ')
    .replace(/^mariners$/i, 'M\'s')
    .replace(/^opponent$/i, 'Opp');
}
