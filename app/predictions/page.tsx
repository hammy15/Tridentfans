'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Clock,
  Medal,
  Loader2,
  LogIn,
  Bot,
  Check,
  Users,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { PredictionGame, LeaderboardEntry } from '@/types';
import { BotVsHumanLeaderboard } from '@/components/predictions/BotVsHumanLeaderboard';

interface PredictionOption {
  id: string;
  label: string;
  description: string;
  options: { value: string; label: string }[];
  points: number;
}

const PREDICTION_CATEGORIES: PredictionOption[] = [
  {
    id: 'winner',
    label: '1. Who Wins?',
    description: 'Pick the winning team',
    options: [
      { value: 'mariners', label: 'Mariners' },
      { value: 'opponent', label: 'Opponent' },
    ],
    points: 10,
  },
  {
    id: 'run_differential',
    label: '2. Run Differential',
    description: 'How many runs will separate the teams?',
    options: [
      { value: '1', label: '1 run' },
      { value: '2-3', label: '2-3 runs' },
      { value: '4-5', label: '4-5 runs' },
      { value: '6+', label: '6+ runs' },
    ],
    points: 5,
  },
  {
    id: 'total_runs',
    label: '3. Total Runs (Over/Under)',
    description: 'Combined runs scored by both teams',
    options: [
      { value: 'under_5', label: 'Under 5' },
      { value: '5-7', label: '5-7 runs' },
      { value: '8-10', label: '8-10 runs' },
      { value: 'over_10', label: 'Over 10' },
    ],
    points: 5,
  },
  {
    id: 'first_to_score',
    label: '4. First to Score',
    description: 'Which team scores first?',
    options: [
      { value: 'mariners', label: 'Mariners' },
      { value: 'opponent', label: 'Opponent' },
    ],
    points: 5,
  },
  {
    id: 'mariners_hits',
    label: '5. Mariners Total Hits',
    description: 'How many hits will the Mariners get?',
    options: [
      { value: '0-5', label: '0-5 hits' },
      { value: '6-8', label: '6-8 hits' },
      { value: '9-11', label: '9-11 hits' },
      { value: '12+', label: '12+ hits' },
    ],
    points: 5,
  },
  {
    id: 'mariners_hr',
    label: '6. Mariners Home Runs',
    description: 'How many HRs will the Mariners hit?',
    options: [
      { value: '0', label: 'None' },
      { value: '1', label: '1 HR' },
      { value: '2', label: '2 HRs' },
      { value: '3+', label: '3+ HRs' },
    ],
    points: 5,
  },
  {
    id: 'total_strikeouts',
    label: '7. Total Strikeouts',
    description: 'Combined Ks by both teams',
    options: [
      { value: 'under_10', label: 'Under 10' },
      { value: '10-14', label: '10-14 Ks' },
      { value: '15-19', label: '15-19 Ks' },
      { value: '20+', label: '20+ Ks' },
    ],
    points: 5,
  },
  {
    id: 'lead_after_5',
    label: '8. Leading After 5 Innings',
    description: 'Who leads after 5?',
    options: [
      { value: 'mariners', label: 'Mariners' },
      { value: 'opponent', label: 'Opponent' },
      { value: 'tie', label: 'Tied' },
    ],
    points: 5,
  },
  {
    id: 'extra_innings',
    label: '9. Extra Innings?',
    description: 'Will the game go to extras?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
    points: 10,
  },
  {
    id: 'shutout',
    label: '10. Shutout?',
    description: 'Will either team get shut out?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'mariners', label: 'Mariners shutout opponent' },
      { value: 'opponent', label: 'Opponent shuts out Mariners' },
    ],
    points: 10,
  },
];

// Mock data
const mockGames: PredictionGame[] = [
  {
    id: 'mock-1',
    opponent: 'Los Angeles Angels',
    opponent_abbr: 'LAA',
    game_date: '2026-01-25',
    game_time: '19:10',
    is_home: true,
    status: 'scheduled',
    actual_result: null,
  },
  {
    id: 'mock-2',
    opponent: 'Texas Rangers',
    opponent_abbr: 'TEX',
    game_date: '2026-01-27',
    game_time: '18:40',
    is_home: false,
    status: 'scheduled',
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
  const { user } = useAuth();
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PredictionGame | null>(null);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [communityPicks, setCommunityPicks] = useState<Record<string, Record<string, number>>>({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamesRes, leaderboardRes] = await Promise.all([
          fetch('/api/predictions?type=games'),
          fetch('/api/predictions?type=leaderboard'),
        ]);
        const gamesData = await gamesRes.json();
        const leaderboardData = await leaderboardRes.json();

        setGames(gamesData.games?.length > 0 ? gamesData.games : mockGames);
        setLeaderboard(leaderboardData.leaderboard || []);
      } catch {
        setGames(mockGames);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handlePredictionChange = (categoryId: string, value: string) => {
    setPredictions(prev => ({ ...prev, [categoryId]: value }));
  };

  // Fetch community picks when game is selected
  useEffect(() => {
    async function fetchCommunityPicks() {
      if (!selectedGame) return;
      try {
        const res = await fetch(`/api/predictions?type=community&gameId=${selectedGame.id}`);
        const data = await res.json();
        if (data.picks) {
          setCommunityPicks(data.picks);
        }
        if (data.totalParticipants !== undefined) {
          setTotalParticipants(data.totalParticipants);
        }
      } catch {
        // Ignore errors
      }
    }
    fetchCommunityPicks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCommunityPicks, 30000);
    return () => clearInterval(interval);
  }, [selectedGame]);

  const handleSubmit = async () => {
    if (!user || !selectedGame) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          gameId: selectedGame.id,
          predictions,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      alert('Failed to submit prediction');
    }
    setSubmitting(false);
  };

  const completedCount = Object.keys(predictions).length;
  const totalPoints = PREDICTION_CATEGORIES.filter(c => predictions[c.id]).reduce(
    (sum, c) => sum + c.points,
    0
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'} PT`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeUntilGame = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const gameDate = new Date(dateStr + 'T00:00:00');
    gameDate.setHours(hours, minutes, 0, 0);

    const diff = gameDate.getTime() - currentTime.getTime();

    if (diff <= 0) return 'Locked';

    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secsLeft = Math.floor((diff % (1000 * 60)) / 1000);

    if (hoursLeft > 24) {
      const days = Math.floor(hoursLeft / 24);
      return `${days}d ${hoursLeft % 24}h`;
    }
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minsLeft}m`;
    }
    return `${minsLeft}m ${secsLeft}s`;
  };

  const isGameLocked = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const gameDate = new Date(dateStr + 'T00:00:00');
    gameDate.setHours(hours, minutes, 0, 0);
    return currentTime >= gameDate;
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-mariners-teal" />
          Predictions
        </h1>
        <p className="mt-2 text-muted-foreground">
          Make 10 predictions per game • All picks lock at first pitch
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
        </TabsList>

        <TabsContent value="predict">
          {!selectedGame ? (
            /* Game Selection */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
                </div>
              ) : (
                games.map(game => (
                  <Card
                    key={game.id}
                    className="cursor-pointer hover:border-mariners-teal transition-colors"
                    onClick={() => {
                      setSelectedGame(game);
                      setPredictions({});
                      setSubmitted(false);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-14 w-14 rounded-xl bg-mariners-navy text-white flex items-center justify-center text-lg font-bold">
                          {game.opponent_abbr}
                        </div>
                        <div>
                          <p className="text-lg font-semibold">
                            {game.is_home ? 'vs' : '@'} {game.opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(game.game_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTime(game.game_time)}
                        </div>
                        {isGameLocked(game.game_date, game.game_time) ? (
                          <Badge variant="destructive">Locked</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-mariners-teal/10 text-mariners-teal">
                            {getTimeUntilGame(game.game_date, game.game_time)} left
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              {!loading && games.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No upcoming games available
                </div>
              )}
            </div>
          ) : submitted ? (
            /* Success State */
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Predictions Submitted!</h2>
                <p className="text-muted-foreground mb-6">
                  You made {completedCount} predictions worth up to {totalPoints} points.
                  <br />
                  Results will be scored after the game ends.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedGame(null);
                      setSubmitted(false);
                    }}
                  >
                    Pick Another Game
                  </Button>
                  <Link href="/forum">
                    <Button variant="mariners">Discuss in Forum</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : selectedGame && isGameLocked(selectedGame.game_date, selectedGame.game_time) ? (
            /* Game Locked - View Only Mode */
            <div className="max-w-2xl mx-auto">
              {/* Game Header with Locked Badge */}
              <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-mariners-navy text-white flex items-center justify-center font-bold">
                        {selectedGame.opponent_abbr}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {selectedGame.is_home ? 'vs' : '@'} {selectedGame.opponent}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedGame.game_date)} • {formatTime(selectedGame.game_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Game Started
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedGame(null)}>
                        Back
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Picks Summary */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-mariners-teal" />
                    Community Picks
                  </CardTitle>
                  <CardDescription>
                    {totalParticipants} fan{totalParticipants !== 1 ? 's' : ''} made predictions
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* View-only prediction results */}
              <div className="space-y-4">
                {PREDICTION_CATEGORIES.map(category => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{category.label}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {category.points} pts
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {category.options.map(option => {
                          const pct = communityPicks[category.id]?.[option.value] || 0;
                          return (
                            <div key={option.value} className="relative">
                              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 relative overflow-hidden">
                                <div
                                  className="absolute inset-0 bg-mariners-teal/20 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative z-10 font-medium">{option.label}</span>
                                <span className="relative z-10 text-sm text-muted-foreground">
                                  {pct > 0 ? `${pct}%` : '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setSelectedGame(null)}>
                  View Other Games
                </Button>
              </div>
            </div>
          ) : (
            /* Prediction Form */
            <div className="max-w-2xl mx-auto">
              {/* Game Header */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-mariners-navy text-white flex items-center justify-center font-bold">
                        {selectedGame.opponent_abbr}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {selectedGame.is_home ? 'vs' : '@'} {selectedGame.opponent}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedGame.game_date)} • {formatTime(selectedGame.game_time)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGame(null)}>
                      Change Game
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Login prompt - only show when trying to submit */}

              {/* Progress */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {completedCount} of 10 predictions made
                  </span>
                  <span className="text-sm text-mariners-teal font-semibold">
                    {totalPoints} pts possible
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mariners-teal transition-all"
                    style={{ width: `${(completedCount / 10) * 100}%` }}
                  />
                </div>
                {totalParticipants > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {totalParticipants} fan{totalParticipants !== 1 ? 's' : ''} have made predictions for this game
                  </p>
                )}
              </div>

              {/* Prediction Categories */}
              <div className="space-y-4">
                {PREDICTION_CATEGORIES.map(category => (
                  <Card
                    key={category.id}
                    className={predictions[category.id] ? 'border-mariners-teal/50' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{category.label}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {category.points} pts
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.options.map(option => {
                          const pct = communityPicks[category.id]?.[option.value] || 0;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handlePredictionChange(category.id, option.value)}
                              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all overflow-hidden ${
                                predictions[category.id] === option.value
                                  ? 'bg-mariners-teal text-white'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              {/* Community percentage bar (subtle background) */}
                              {totalParticipants > 0 && (
                                <div
                                  className={`absolute inset-0 transition-all ${
                                    predictions[category.id] === option.value
                                      ? 'bg-white/20'
                                      : 'bg-mariners-teal/10'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-2">
                                {option.label}
                                {totalParticipants > 0 && pct > 0 && (
                                  <span className={`text-xs ${
                                    predictions[category.id] === option.value
                                      ? 'text-white/80'
                                      : 'text-muted-foreground'
                                  }`}>
                                    {pct}%
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Submit */}
              <div className="mt-6 sticky bottom-4">
                <Card className="shadow-lg">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{completedCount}/10 predictions</p>
                      <p className="text-sm text-muted-foreground">
                        Locks at {formatTime(selectedGame.game_time)}
                      </p>
                    </div>
                    {!user ? (
                      <Link href="/auth/login">
                        <Button variant="mariners" size="lg">
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In to Submit
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="mariners"
                        size="lg"
                        disabled={completedCount === 0 || submitting}
                        onClick={handleSubmit}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Predictions'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-yellow-500" />
                Season Leaderboard
              </CardTitle>
              <CardDescription>Top predictors for the 2026 season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                                : 'bg-muted'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-sm text-muted-foreground">{entry.accuracy}% accuracy</p>
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

        <TabsContent value="bot-vs-human">
          <BotVsHumanLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
