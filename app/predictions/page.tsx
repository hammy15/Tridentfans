'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Trophy, Calendar, CheckCircle, Clock, TrendingUp, Medal } from 'lucide-react';

// Mock data
const mockGames = [
  {
    id: '1',
    opponent: 'Los Angeles Angels',
    opponentAbbr: 'LAA',
    date: '2026-01-25',
    time: '7:10 PM PT',
    isHome: true,
    status: 'upcoming',
    predictionsClose: '2026-01-25T18:40:00',
  },
  {
    id: '2',
    opponent: 'Texas Rangers',
    opponentAbbr: 'TEX',
    date: '2026-01-27',
    time: '6:40 PM PT',
    isHome: false,
    status: 'upcoming',
    predictionsClose: '2026-01-27T18:10:00',
  },
];

const mockLeaderboard = [
  { rank: 1, username: 'SeattleSogKing', points: 1245, accuracy: 68, predictions: 45 },
  { rank: 2, username: 'JulioFan2024', points: 1189, accuracy: 65, predictions: 42 },
  { rank: 3, username: 'TrueToTheBlue', points: 1156, accuracy: 64, predictions: 48 },
  { rank: 4, username: 'RefuseToLose', points: 1098, accuracy: 62, predictions: 40 },
  { rank: 5, username: 'MarinersForLife', points: 1045, accuracy: 60, predictions: 38 },
  { rank: 6, username: 'KingsDomeMem', points: 998, accuracy: 58, predictions: 35 },
  { rank: 7, username: 'SodoMojo', points: 945, accuracy: 56, predictions: 33 },
  { rank: 8, username: 'GriffeysKid', points: 912, accuracy: 55, predictions: 32 },
  { rank: 9, username: 'IchiroLegend', points: 889, accuracy: 54, predictions: 31 },
  { rank: 10, username: 'FelixForever', points: 856, accuracy: 53, predictions: 30 },
];

const mockHistory = [
  {
    id: 'h1',
    game: 'vs Angels',
    date: '2026-01-20',
    prediction: { winner: 'mariners', runs: 5 },
    actual: { winner: 'mariners', marinersRuns: 6, opponentRuns: 3 },
    points: 25,
    correct: true,
  },
  {
    id: 'h2',
    game: '@ Astros',
    date: '2026-01-18',
    prediction: { winner: 'mariners', runs: 4 },
    actual: { winner: 'opponent', marinersRuns: 2, opponentRuns: 5 },
    points: 5,
    correct: false,
  },
];

export default function PredictionsPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [predictions, setPredictions] = useState({
    winner: '' as 'mariners' | 'opponent' | '',
    marinersRuns: '',
    opponentRuns: '',
  });

  const handleSubmit = () => {
    console.log('Submitting prediction:', { game: selectedGame, ...predictions });
    alert('Prediction submitted! (Demo mode)');
    setSelectedGame(null);
    setPredictions({ winner: '', marinersRuns: '', opponentRuns: '' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-mariners-teal" />
          Predictions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Make your picks and compete for the top of the leaderboard
        </p>
      </div>

      <Tabs defaultValue="predict">
        <TabsList className="mb-6">
          <TabsTrigger value="predict">Make Predictions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
        </TabsList>

        {/* Make Predictions Tab */}
        <TabsContent value="predict">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-mariners-teal" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>Select a game to make your prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockGames.map(game => (
                    <div
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedGame === game.id
                          ? 'border-mariners-teal bg-accent'
                          : 'hover:border-mariners-teal/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold">
                            {game.opponentAbbr}
                          </div>
                          <div>
                            <p className="font-medium">
                              {game.isHome ? 'vs' : '@'} {game.opponent}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {game.date} • {game.time}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Open
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {mockGames.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No upcoming games available for predictions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prediction Form */}
            <Card>
              <CardHeader>
                <CardTitle>Your Prediction</CardTitle>
                <CardDescription>
                  {selectedGame
                    ? 'Make your picks for this game'
                    : 'Select a game to make predictions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedGame ? (
                  <div className="space-y-6">
                    {/* Winner Selection */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Who will win?</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setPredictions({ ...predictions, winner: 'mariners' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            predictions.winner === 'mariners'
                              ? 'border-mariners-teal bg-mariners-teal/10'
                              : 'border-muted hover:border-mariners-teal/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">🔱</div>
                          <p className="font-medium">Mariners</p>
                        </button>
                        <button
                          onClick={() => setPredictions({ ...predictions, winner: 'opponent' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            predictions.winner === 'opponent'
                              ? 'border-mariners-navy bg-mariners-navy/10'
                              : 'border-muted hover:border-mariners-navy/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">
                            {mockGames.find(g => g.id === selectedGame)?.opponentAbbr || 'OPP'}
                          </div>
                          <p className="font-medium">Opponent</p>
                        </button>
                      </div>
                    </div>

                    {/* Score Prediction */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Predicted Score</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Mariners Runs
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={predictions.marinersRuns}
                            onChange={e =>
                              setPredictions({
                                ...predictions,
                                marinersRuns: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Opponent Runs
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={predictions.opponentRuns}
                            onChange={e =>
                              setPredictions({
                                ...predictions,
                                opponentRuns: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      variant="mariners"
                      className="w-full"
                      disabled={
                        !predictions.winner ||
                        !predictions.marinersRuns ||
                        !predictions.opponentRuns
                      }
                      onClick={handleSubmit}
                    >
                      Submit Prediction
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Predictions close 30 minutes before game time
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a game from the list to make your prediction</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-mariners-gold" />
                Season Leaderboard
              </CardTitle>
              <CardDescription>Top predictors for the 2026 season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLeaderboard.map(entry => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.rank <= 3 ? 'bg-gradient-to-r' : 'bg-muted/30'
                    } ${
                      entry.rank === 1
                        ? 'from-yellow-500/20 to-yellow-500/5'
                        : entry.rank === 2
                          ? 'from-gray-400/20 to-gray-400/5'
                          : entry.rank === 3
                            ? 'from-amber-700/20 to-amber-700/5'
                            : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-500 text-white'
                            : entry.rank === 2
                              ? 'bg-gray-400 text-white'
                              : entry.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-muted text-foreground'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.predictions} predictions • {entry.accuracy}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-mariners-teal">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-mariners-teal" />
                My Prediction History
              </CardTitle>
              <CardDescription>Track your past predictions and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockHistory.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      {entry.correct ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-500 text-xs">✗</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{entry.game}</p>
                        <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Predicted:{' '}
                        <span className="font-medium">
                          {entry.prediction.winner === 'mariners' ? 'Mariners' : 'Opponent'} win
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Actual: {entry.actual.marinersRuns} - {entry.actual.opponentRuns}
                      </p>
                    </div>
                    <Badge variant={entry.correct ? 'success' : 'secondary'} className="ml-4">
                      +{entry.points} pts
                    </Badge>
                  </div>
                ))}
                {mockHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No prediction history yet. Make your first prediction!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
