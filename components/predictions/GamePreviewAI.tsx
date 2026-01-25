'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  Sparkles,
  Loader2,
  RefreshCw,
  Users,
  Target,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface GamePreviewAIProps {
  gameId: string;
  opponent: string;
  gameDate: string;
}

interface GameAnalysis {
  startingPitchers: {
    mariners: { name: string; record: string; era: string; lastStart: string };
    opponent: { name: string; record: string; era: string; lastStart: string };
  };
  keyMatchups: Array<{
    description: string;
    advantage: 'mariners' | 'opponent' | 'even';
  }>;
  recentForm: {
    mariners: { wins: number; losses: number; streak: string; runsScored: number };
    opponent: { wins: number; losses: number; streak: string; runsScored: number };
  };
  predictionFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  aiPrediction: {
    confidence: number;
    projectedScore: { mariners: number; opponent: number };
    summary: string;
  };
}

// Mock data generator for demonstration
function generateMockAnalysis(opponent: string, gameDate: string): GameAnalysis {
  const marinersStarters = [
    { name: 'Logan Gilbert', record: '10-6', era: '3.18', lastStart: '7 IP, 2 ER, 8 K' },
    { name: 'George Kirby', record: '11-8', era: '3.45', lastStart: '6.1 IP, 3 ER, 7 K' },
    { name: 'Luis Castillo', record: '12-10', era: '3.62', lastStart: '6 IP, 2 ER, 9 K' },
    { name: 'Bryan Woo', record: '7-4', era: '3.08', lastStart: '5.2 IP, 1 ER, 6 K' },
  ];

  const opponentStarters = [
    { name: 'Opponent Ace', record: '9-7', era: '3.78', lastStart: '6 IP, 3 ER, 6 K' },
    { name: 'Opponent #2', record: '8-9', era: '4.12', lastStart: '5 IP, 4 ER, 5 K' },
  ];

  const marinersForm = {
    wins: Math.floor(Math.random() * 7) + 3,
    losses: Math.floor(Math.random() * 4) + 1,
    streak: ['W1', 'W2', 'W3', 'L1', 'L2'][Math.floor(Math.random() * 5)],
    runsScored: Math.floor(Math.random() * 20) + 30,
  };

  const opponentForm = {
    wins: Math.floor(Math.random() * 7) + 3,
    losses: Math.floor(Math.random() * 4) + 1,
    streak: ['W1', 'W2', 'L1', 'L2', 'L3'][Math.floor(Math.random() * 5)],
    runsScored: Math.floor(Math.random() * 20) + 28,
  };

  const confidence = Math.floor(Math.random() * 25) + 55;
  const marinersScore = Math.floor(Math.random() * 5) + 2;
  const opponentScore = Math.floor(Math.random() * 5) + 1;

  return {
    startingPitchers: {
      mariners: marinersStarters[Math.floor(Math.random() * marinersStarters.length)],
      opponent: opponentStarters[Math.floor(Math.random() * opponentStarters.length)],
    },
    keyMatchups: [
      {
        description: 'Julio Rodriguez vs. opposing starter - .312 BA in last 10 games',
        advantage: 'mariners',
      },
      {
        description: `${opponent} bullpen has struggled with 5.12 ERA in last 2 weeks`,
        advantage: 'mariners',
      },
      {
        description: `${opponent} leads series 4-2 this season at T-Mobile Park`,
        advantage: 'opponent',
      },
      {
        description: 'Cal Raleigh heating up with 4 HR in last 7 games',
        advantage: 'mariners',
      },
    ],
    recentForm: {
      mariners: marinersForm,
      opponent: opponentForm,
    },
    predictionFactors: [
      { factor: 'Home field advantage at T-Mobile Park', impact: 'positive', weight: 15 },
      { factor: 'Mariners pitching staff ranks 3rd in AL ERA', impact: 'positive', weight: 20 },
      { factor: 'Lineup struggles with RISP (.218 last 10 games)', impact: 'negative', weight: 12 },
      { factor: 'Bullpen well-rested after off day', impact: 'positive', weight: 10 },
      { factor: `${opponent} travel fatigue from West Coast trip`, impact: 'positive', weight: 8 },
    ],
    aiPrediction: {
      confidence,
      projectedScore: { mariners: marinersScore, opponent: opponentScore },
      summary: `Based on the matchup analysis, the Mariners have a favorable pitching advantage with ${marinersStarters[0].name} on the mound. The home crowd at T-Mobile Park and a rested bullpen should help secure a ${marinersScore > opponentScore ? 'win' : 'close game'}. Key to watch: Julio Rodriguez's performance against the opposing starter.`,
    },
  };
}

export function GamePreviewAI({ gameId, opponent, gameDate }: GamePreviewAIProps) {
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [gameId, opponent, gameDate]);

  async function fetchAnalysis() {
    setLoading(true);
    setError(null);

    try {
      // In production, this would call an API endpoint
      // For now, simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = generateMockAnalysis(opponent, gameDate);
      setAnalysis(mockData);
    } catch (err) {
      setError('Failed to generate analysis');
      console.error('Analysis fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-mariners-teal/20">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal mb-3" />
          <p className="text-sm text-muted-foreground">Generating AI analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-destructive mb-3">{error || 'Failed to load analysis'}</p>
          <Button variant="outline" size="sm" onClick={fetchAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = new Date(gameDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="border-mariners-teal/30 bg-gradient-to-br from-mariners-navy/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-mariners-teal" />
            <CardTitle className="text-base">AI Game Preview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 px-2"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Mariners vs {opponent} - {formattedDate}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Prediction Summary - Always Visible */}
        <div className="p-4 rounded-lg bg-mariners-teal/10 border border-mariners-teal/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-mariners-teal" />
              <span className="font-semibold text-sm">AI Prediction</span>
            </div>
            <Badge variant="mariners">
              {analysis.aiPrediction.confidence}% Confidence
            </Badge>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-mariners-teal">
                {analysis.aiPrediction.projectedScore.mariners}
              </p>
              <p className="text-xs text-muted-foreground">Mariners</p>
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {analysis.aiPrediction.projectedScore.opponent}
              </p>
              <p className="text-xs text-muted-foreground">{opponent}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{analysis.aiPrediction.summary}</p>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <>
            {/* Starting Pitchers */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-mariners-teal" />
                Starting Pitchers
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-mariners-navy/5 border border-mariners-navy/10">
                  <p className="font-medium text-sm text-mariners-teal">Mariners</p>
                  <p className="font-semibold">{analysis.startingPitchers.mariners.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.startingPitchers.mariners.record} | {analysis.startingPitchers.mariners.era} ERA
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {analysis.startingPitchers.mariners.lastStart}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm">{opponent}</p>
                  <p className="font-semibold">{analysis.startingPitchers.opponent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {analysis.startingPitchers.opponent.record} | {analysis.startingPitchers.opponent.era} ERA
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last: {analysis.startingPitchers.opponent.lastStart}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Matchups */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-mariners-teal" />
                Key Matchups
              </h4>
              <div className="space-y-2">
                {analysis.keyMatchups.map((matchup, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm flex items-center gap-2 ${
                      matchup.advantage === 'mariners'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : matchup.advantage === 'opponent'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-muted/50 border'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        matchup.advantage === 'mariners'
                          ? 'bg-green-500'
                          : matchup.advantage === 'opponent'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span>{matchup.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Form */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-mariners-teal" />
                Last 10 Games
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-mariners-navy/5 border border-mariners-navy/10">
                  <p className="font-medium text-sm text-mariners-teal mb-1">Mariners</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {analysis.recentForm.mariners.wins}-{analysis.recentForm.mariners.losses}
                    </span>
                    <Badge
                      variant={analysis.recentForm.mariners.streak.startsWith('W') ? 'success' : 'destructive'}
                      className="text-xs"
                    >
                      {analysis.recentForm.mariners.streak}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.recentForm.mariners.runsScored} runs scored
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm mb-1">{opponent}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {analysis.recentForm.opponent.wins}-{analysis.recentForm.opponent.losses}
                    </span>
                    <Badge
                      variant={analysis.recentForm.opponent.streak.startsWith('W') ? 'success' : 'destructive'}
                      className="text-xs"
                    >
                      {analysis.recentForm.opponent.streak}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.recentForm.opponent.runsScored} runs scored
                  </p>
                </div>
              </div>
            </div>

            {/* Prediction Factors */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-mariners-teal" />
                Prediction Factors
              </h4>
              <div className="space-y-2">
                {analysis.predictionFactors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          factor.impact === 'positive'
                            ? 'bg-green-500'
                            : factor.impact === 'negative'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span>{factor.factor}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {factor.weight}% weight
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Expand/Collapse hint */}
        {!expanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Show full analysis
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
