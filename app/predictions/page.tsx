'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Trophy,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Medal,
  Loader2,
  LogIn,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { PredictionGame, UserPrediction, LeaderboardEntry } from '@/types';
import { BotVsHumanLeaderboard } from '@/components/predictions/BotVsHumanLeaderboard';
import { ShareButton } from '@/components/common/ShareButton';
import { getPredictionShareData, getLeaderboardShareData } from '@/lib/share';

// Mock data for when database is empty
const mockGames = [
  {
    id: 'mock-1',
    opponent: 'Los Angeles Angels',
    opponent_abbr: 'LAA',
    game_date: '2026-01-25',
    game_time: '19:10',
    is_home: true,
    status: 'scheduled' as const,
    actual_result: null,
  },
  {
    id: 'mock-2',
    opponent: 'Texas Rangers',
    opponent_abbr: 'TEX',
    game_date: '2026-01-27',
    game_time: '18:40',
    is_home: false,
    status: 'scheduled' as const,
    actual_result: null,
  },
  {
    id: 'mock-3',
    opponent: 'Houston Astros',
    opponent_abbr: 'HOU',
    game_date: '2026-01-30',
    game_time: '19:10',
    is_home: true,
    status: 'scheduled' as const,
    actual_result: null,
  },
];

const mockLeaderboard = [
  { rank: 1, username: 'SeattleSogKing', points: 1245, accuracy: 68, predictions: 45 },
  { rank: 2, username: 'JulioFan2024', points: 1189, accuracy: 65, predictions: 42 },
  { rank: 3, username: 'TrueToTheBlue', points: 1156, accuracy: 64, predictions: 48 },
  { rank: 4, username: 'RefuseToLose', points: 1098, accuracy: 62, predictions: 40 },
  { rank: 5, username: 'MarinersForLife', points: 1045, accuracy: 60, predictions: 38 },
];

export default function PredictionsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [predictions, setPredictions] = useState({
    winner: '' as 'mariners' | 'opponent' | '',
    marinersRuns: '',
    opponentRuns: '',
  });

  // Fetch games
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch('/api/predictions?type=games');
        const data = await res.json();
        if (data.games && data.games.length > 0) {
          setGames(data.games);
        } else {
          // Use mock data if no games in database
          setGames(mockGames as PredictionGame[]);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
        setGames(mockGames as PredictionGame[]);
      }
    }
    fetchGames();
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/predictions?type=leaderboard');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  // Fetch history when user is logged in
  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const res = await fetch(`/api/predictions?type=history&userId=${user.id}`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      }
    }
    fetchHistory();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !selectedGame) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: selectedGame,
          predictions: {
            winner: predictions.winner,
            mariners_runs: parseInt(predictions.marinersRuns),
            opponent_runs: parseInt(predictions.opponentRuns),
          },
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('Prediction submitted successfully!');
        setSelectedGame(null);
        setPredictions({ winner: '', marinersRuns: '', opponentRuns: '' });
        // Refresh history
        const histRes = await fetch(`/api/predictions?type=history&userId=${user.id}`);
        const histData = await histRes.json();
        setHistory(histData.history || []);
      }
    } catch (error) {
      console.error('Failed to submit prediction:', error);
      alert('Failed to submit prediction');
    }
    setSubmitting(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm} PT`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Use mock leaderboard if database is empty
  const displayLeaderboard =
    leaderboard.length > 0
      ? leaderboard.map((e, i) => ({
          rank: e.rank || i + 1,
          username: e.user?.username || 'Anonymous',
          points: e.total_points,
          accuracy: e.accuracy,
          predictions: 0,
        }))
      : mockLeaderboard;

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
          <TabsTrigger value="bot-vs-human">
            <Bot className="h-4 w-4 mr-1" />
            Bot vs Human
          </TabsTrigger>
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
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {games.map(game => (
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold text-sm">
                              {game.opponent_abbr}
                            </div>
                            <div>
                              <p className="font-medium">
                                {game.is_home ? 'vs' : '@'} {game.opponent}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(game.game_date)} • {formatTime(game.game_time)}
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
                    {games.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No upcoming games available for predictions
                      </p>
                    )}
                  </div>
                )}
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
                {!authLoading && !user ? (
                  <div className="text-center py-12">
                    <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Sign in to make predictions</p>
                    <Link href="/auth/login">
                      <Button variant="mariners">Sign In</Button>
                    </Link>
                  </div>
                ) : selectedGame ? (
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
                            {games.find(g => g.id === selectedGame)?.opponent_abbr || 'OPP'}
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
                        !predictions.opponentRuns ||
                        submitting
                      }
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Prediction'
                      )}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-mariners-gold" />
                    Season Leaderboard
                  </CardTitle>
                  <CardDescription>Top predictors for the 2026 season</CardDescription>
                </div>
                {profile && displayLeaderboard.find(e => e.username === profile.username) && (
                  <ShareButton
                    data={getLeaderboardShareData({
                      rank: displayLeaderboard.findIndex(e => e.username === profile.username) + 1,
                      points:
                        displayLeaderboard.find(e => e.username === profile.username)?.points || 0,
                      accuracy:
                        displayLeaderboard.find(e => e.username === profile.username)?.accuracy ||
                        0,
                    })}
                    variant="mariners"
                    size="sm"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayLeaderboard.map(entry => (
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

        {/* Bot vs Human Tab */}
        <TabsContent value="bot-vs-human">
          <BotVsHumanLeaderboard />
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
              {!user ? (
                <div className="text-center py-12">
                  <LogIn className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Sign in to view your history</p>
                  <Link href="/auth/login">
                    <Button variant="mariners">Sign In</Button>
                  </Link>
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No prediction history yet. Make your first prediction!
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        {entry.score !== null && entry.score >= 10 ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : entry.score !== null ? (
                          <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-500 text-xs">✗</span>
                          </div>
                        ) : (
                          <Clock className="h-6 w-6 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">
                            {entry.game?.is_home ? 'vs' : '@'} {entry.game?.opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">{entry.game?.game_date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          Predicted:{' '}
                          <span className="font-medium">
                            {entry.predictions.winner === 'mariners' ? 'Mariners' : 'Opponent'} (
                            {entry.predictions.mariners_runs}-{entry.predictions.opponent_runs})
                          </span>
                        </p>
                        {entry.game?.actual_result && (
                          <p className="text-sm text-muted-foreground">
                            Actual: {entry.game.actual_result.mariners_runs} -{' '}
                            {entry.game.actual_result.opponent_runs}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {entry.score !== null && (
                          <Badge variant={entry.score >= 10 ? 'default' : 'secondary'}>
                            +{entry.score} pts
                          </Badge>
                        )}
                        <ShareButton
                          data={getPredictionShareData({
                            winner: entry.predictions.winner,
                            marinersRuns: entry.predictions.mariners_runs,
                            opponentRuns: entry.predictions.opponent_runs,
                            opponent: entry.game?.opponent || 'Opponent',
                            gameDate: entry.game?.game_date || '',
                          })}
                          size="icon"
                          showLabel={false}
                          variant="ghost"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
