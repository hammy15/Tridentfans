'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Sparkles,
  Loader2,
  RefreshCw,
  Trophy,
  Star,
  Clock,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface GameResult {
  marinersScore: number;
  opponentScore: number;
  winner: 'mariners' | 'opponent';
}

interface PostGameRecapProps {
  gameId: string;
  result: GameResult;
}

interface GameRecap {
  summary: string;
  keyMoments: Array<{
    inning: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  standoutPlayers: Array<{
    name: string;
    team: 'mariners' | 'opponent';
    stats: string;
    highlight: string;
  }>;
  communityPredictions: {
    totalPredictions: number;
    predictedMariners: number;
    predictedOpponent: number;
    averageScoreGuess: { mariners: number; opponent: number };
    accuracy: number;
  };
  gameNotes: string[];
}

// Mock data generator for demonstration
function generateMockRecap(result: GameResult): GameRecap {
  const marinersWon = result.winner === 'mariners';
  const totalRuns = result.marinersScore + result.opponentScore;
  const closeGame = Math.abs(result.marinersScore - result.opponentScore) <= 2;

  const marinersPlayers = [
    { name: 'Julio Rodriguez', stats: '3-4, 2 RBI, HR, R', highlight: 'Crushed a 415-foot home run to left-center' },
    { name: 'Cal Raleigh', stats: '2-3, 2B, 2 RBI, BB', highlight: 'Key 2-RBI double in the 6th' },
    { name: 'Logan Gilbert', stats: '7 IP, 2 ER, 8 K', highlight: 'Dominated with 8 strikeouts over 7 innings' },
    { name: 'JP Crawford', stats: '2-4, R, SB', highlight: 'Excellent defense with diving stop at short' },
    { name: 'Ty France', stats: '1-3, RBI, 2 BB', highlight: 'Patient approach drew key walks' },
  ];

  const opponentPlayers = [
    { name: 'Opposing Hitter', stats: '2-4, HR, 2 RBI', highlight: 'Solo homer in the 3rd inning' },
    { name: 'Opposing Starter', stats: '5.2 IP, 4 ER, 6 K', highlight: 'Pitched well until the 6th' },
  ];

  const keyMoments = [
    {
      inning: 'Top 1st',
      description: 'Mariners take early lead with Julio Rodriguez single',
      importance: 'medium' as const,
    },
    {
      inning: 'Bot 3rd',
      description: 'Opposing team ties it up with solo home run',
      importance: 'medium' as const,
    },
    {
      inning: 'Top 6th',
      description: marinersWon
        ? 'Cal Raleigh drives in go-ahead runs with clutch double'
        : 'Mariners strand runners at 2nd and 3rd',
      importance: 'high' as const,
    },
    {
      inning: 'Bot 8th',
      description: closeGame
        ? 'Andres Munoz escapes bases-loaded jam with strikeout'
        : marinersWon
        ? 'Mariners add insurance run on wild pitch'
        : 'Opponent extends lead with 2-run single',
      importance: 'high' as const,
    },
    {
      inning: 'Bot 9th',
      description: marinersWon
        ? 'Closer records final out to seal the victory'
        : 'Mariners go down in order to end the game',
      importance: marinersWon ? 'medium' as const : 'low' as const,
    },
  ];

  const communityAccuracy = Math.floor(Math.random() * 30) + (marinersWon ? 55 : 35);
  const totalPredictions = Math.floor(Math.random() * 200) + 100;
  const predictedMariners = Math.floor(totalPredictions * (0.5 + Math.random() * 0.3));

  return {
    summary: marinersWon
      ? `The Mariners secured a ${result.marinersScore}-${result.opponentScore} victory behind a stellar performance from their pitching staff and timely hitting. ${closeGame ? 'It was a nail-biter that came down to the final innings.' : 'They controlled the game from start to finish.'}`
      : `Despite a strong effort, the Mariners fell ${result.opponentScore}-${result.marinersScore} in a ${closeGame ? 'hard-fought battle' : 'tough matchup'}. The team showed fight but couldn't overcome the opponent's ${totalRuns > 10 ? 'offensive explosion' : 'solid pitching'}.`,
    keyMoments,
    standoutPlayers: marinersWon
      ? marinersPlayers.slice(0, 3).map(p => ({ ...p, team: 'mariners' as const }))
      : [
          ...marinersPlayers.slice(0, 1).map(p => ({ ...p, team: 'mariners' as const })),
          ...opponentPlayers.map(p => ({ ...p, team: 'opponent' as const })),
        ],
    communityPredictions: {
      totalPredictions,
      predictedMariners,
      predictedOpponent: totalPredictions - predictedMariners,
      averageScoreGuess: {
        mariners: result.marinersScore + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2),
        opponent: result.opponentScore + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2),
      },
      accuracy: communityAccuracy,
    },
    gameNotes: [
      marinersWon
        ? 'Mariners improve their home record to 38-25'
        : 'Mariners drop to 2nd place in the AL West',
      `Attendance: ${(40000 + Math.floor(Math.random() * 7000)).toLocaleString()}`,
      closeGame ? 'Game time: 3:12' : 'Game time: 2:48',
      marinersWon
        ? 'Win extends current win streak'
        : 'Loss snaps 3-game winning streak',
    ],
  };
}

export function PostGameRecap({ gameId, result }: PostGameRecapProps) {
  const [recap, setRecap] = useState<GameRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecap();
  }, [gameId]);

  async function fetchRecap() {
    setLoading(true);
    setError(null);

    try {
      // In production, this would call an API endpoint
      // For now, simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockData = generateMockRecap(result);
      setRecap(mockData);
    } catch (err) {
      setError('Failed to generate recap');
      console.error('Recap fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const marinersWon = result.winner === 'mariners';

  if (loading) {
    return (
      <Card className="border-mariners-teal/20">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal mb-3" />
          <p className="text-sm text-muted-foreground">Generating AI recap...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !recap) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-destructive mb-3">{error || 'Failed to load recap'}</p>
          <Button variant="outline" size="sm" onClick={fetchRecap}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-2 ${
        marinersWon
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent'
          : 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-mariners-teal" />
            <CardTitle className="text-base">AI Game Recap</CardTitle>
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Final Score */}
        <div
          className={`p-4 rounded-lg ${
            marinersWon ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          <div className="flex items-center justify-center gap-6 mb-2">
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${
                  marinersWon ? 'text-green-600' : ''
                }`}
              >
                {result.marinersScore}
              </p>
              <p className="text-sm font-medium">Mariners</p>
            </div>
            <div className="flex flex-col items-center">
              <Badge variant={marinersWon ? 'success' : 'destructive'}>
                {marinersWon ? 'WIN' : 'LOSS'}
              </Badge>
              <span className="text-xs text-muted-foreground mt-1">Final</span>
            </div>
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${
                  !marinersWon ? 'text-red-600' : ''
                }`}
              >
                {result.opponentScore}
              </p>
              <p className="text-sm font-medium">Opponent</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm">{recap.summary}</p>
        </div>

        {/* Standout Players */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Standout Players
          </h4>
          <div className="space-y-2">
            {recap.standoutPlayers.map((player, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  player.team === 'mariners'
                    ? 'bg-mariners-navy/5 border-mariners-navy/10'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{player.name}</span>
                  <Badge
                    variant={player.team === 'mariners' ? 'mariners' : 'outline'}
                    className="text-xs"
                  >
                    {player.team === 'mariners' ? 'SEA' : 'OPP'}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{player.stats}</p>
                <p className="text-xs text-muted-foreground mt-1">{player.highlight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <>
            {/* Key Moments */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-mariners-teal" />
                Key Moments
              </h4>
              <div className="space-y-2">
                {recap.keyMoments.map((moment, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm flex items-start gap-2 ${
                      moment.importance === 'high'
                        ? 'bg-mariners-teal/10 border border-mariners-teal/20'
                        : moment.importance === 'medium'
                        ? 'bg-muted/50 border'
                        : 'bg-muted/30'
                    }`}
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      {moment.inning}
                    </Badge>
                    <span>{moment.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Predictions Accuracy */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-mariners-teal" />
                Community Prediction Accuracy
              </h4>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-mariners-teal">
                      {recap.communityPredictions.accuracy}%
                    </p>
                    <p className="text-xs text-muted-foreground">Overall Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {recap.communityPredictions.totalPredictions}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Predictions</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Predicted Mariners Win</span>
                    <span className="font-medium">
                      {recap.communityPredictions.predictedMariners} (
                      {Math.round(
                        (recap.communityPredictions.predictedMariners /
                          recap.communityPredictions.totalPredictions) *
                          100
                      )}
                      %)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average Score Guess</span>
                    <span className="font-medium">
                      {recap.communityPredictions.averageScoreGuess.mariners.toFixed(1)} -{' '}
                      {recap.communityPredictions.averageScoreGuess.opponent.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Accuracy bar */}
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        recap.communityPredictions.accuracy >= 60
                          ? 'bg-green-500'
                          : recap.communityPredictions.accuracy >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${recap.communityPredictions.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Game Notes */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-mariners-teal" />
                Game Notes
              </h4>
              <div className="flex flex-wrap gap-2">
                {recap.gameNotes.map((note, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {note}
                  </Badge>
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
            Show key moments & community predictions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
