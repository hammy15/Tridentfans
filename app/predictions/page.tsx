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
  Zap,
  Target,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ComprehensivePredictions } from '@/components/predictions/ComprehensivePredictions';
import { BotVsHumanLeaderboard } from '@/components/predictions/BotVsHumanLeaderboard';

interface PredictionGame {
  id: string;
  opponent: string;
  opponent_abbr: string;
  game_date: string;
  game_time: string;
  is_home: boolean;
  status: 'scheduled' | 'live' | 'completed';
  mariners_score?: number;
  opponent_score?: number;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  total_points: number;
  accuracy_percentage: number;
  subscription_tier: string;
}

// Mock games for demo
const mockGames: PredictionGame[] = [
  {
    id: 'demo-game-1',
    opponent: 'Los Angeles Angels',
    opponent_abbr: 'LAA',
    game_date: '2026-03-03',
    game_time: '19:10',
    is_home: true,
    status: 'scheduled',
  },
  {
    id: 'demo-game-2',
    opponent: 'Texas Rangers',
    opponent_abbr: 'TEX',
    game_date: '2026-03-05',
    game_time: '18:40',
    is_home: false,
    status: 'scheduled',
  },
];

export default function PredictionsPageV2() {
  const { user } = useAuth();
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<PredictionGame | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const getTeamLogo = (teamName: string) => {
    const size = 64;
    
    switch (teamName.toLowerCase()) {
      case 'seattle mariners':
      case 'seattle':
      case 'mariners':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#0C2340"/>
            <path d="M20 8L20 32M12 16L20 8L28 16M15 20L20 15L25 20M20 25L18 27L22 27L20 25Z" stroke="#005C5C" strokeWidth="2" fill="#005C5C"/>
            <circle cx="20" cy="32" r="2" fill="#005C5C"/>
          </svg>
        );
      
      case 'chicago white sox':
      case 'white sox':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#27251F"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">CWS</text>
          </svg>
        );
      
      case 'milwaukee brewers':
      case 'brewers':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#12284B"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#FFC52F" textAnchor="middle">MIL</text>
          </svg>
        );
      
      case 'arizona diamondbacks':
      case 'diamondbacks':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#A71930"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#E3D4AD" textAnchor="middle">ARI</text>
          </svg>
        );
      
      case 'texas rangers':
      case 'rangers':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#003278"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#C4CED4" textAnchor="middle">TEX</text>
          </svg>
        );
      
      case 'los angeles angels':
      case 'angels':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#BA0021"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">LAA</text>
          </svg>
        );
      
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#4A5568"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">MLB</text>
          </svg>
        );
    }
  };

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
          fetch('/api/admin/prediction-stats'),
        ]);

        const gamesData = await gamesRes.json();
        const leaderboardData = await leaderboardRes.json();

        // Use real data if available, fallback to mock
        setGames(gamesData.games?.length > 0 ? gamesData.games : mockGames);
        setLeaderboard(leaderboardData.leaderboard || [
          { rank: 1, user_id: '1', display_name: 'SeattleSogKing', total_points: 1245, accuracy_percentage: 68.5, subscription_tier: 'premium' },
          { rank: 2, user_id: '2', display_name: 'JulioFan2024', total_points: 1189, accuracy_percentage: 65.2, subscription_tier: 'free' },
          { rank: 3, user_id: '3', display_name: 'TrueToTheBlue', total_points: 1156, accuracy_percentage: 64.1, subscription_tier: 'champion' },
          { rank: 4, user_id: '4', display_name: 'RefuseToLose', total_points: 1098, accuracy_percentage: 62.3, subscription_tier: 'free' },
          { rank: 5, user_id: '5', display_name: 'MarinersForLife', total_points: 1045, accuracy_percentage: 60.7, subscription_tier: 'premium' },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setGames(mockGames);
        setLeaderboard([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

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

    if (hoursLeft > 24) {
      const days = Math.floor(hoursLeft / 24);
      return `${days}d ${hoursLeft % 24}h`;
    }
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minsLeft}m`;
    }
    return `${minsLeft}m left`;
  };

  const isGameLocked = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const gameDate = new Date(dateStr + 'T00:00:00');
    gameDate.setHours(hours, minutes, 0, 0);
    return currentTime >= gameDate;
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'champion':
        return <Badge className="bg-purple-100 text-purple-800">Champion</Badge>;
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-10 w-10 text-mariners-teal" />
          Prediction Games 2.0
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The ultimate Mariners prediction experience. Compete against Mark, Hammy, and Spartan 
          across 15+ categories per game. Earn points, climb leaderboards, and prove you know the M&apos;s better than anyone.
        </p>
        
        {/* Feature highlights */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto mt-8">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">15+ Predictions Per Game</h3>
              <p className="text-sm text-green-700">From basic wins to advanced player stats</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4 text-center">
              <Bot className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-800">AI Competition</h3>
              <p className="text-sm text-purple-700">Beat Mark, Hammy, and Spartan to earn bonus points</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold text-red-800">Bonus Categories</h3>
              <p className="text-sm text-red-700">200+ point predictions for the bold</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="predict">
        <TabsList className="mb-6">
          <TabsTrigger value="predict">Make Predictions</TabsTrigger>
          <TabsTrigger value="leaderboard">Season Leaderboard</TabsTrigger>
          <TabsTrigger value="bot-vs-human">
            <Bot className="h-4 w-4 mr-1" />
            vs AI Champions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predict">
          {!selectedGame ? (
            /* Game Selection */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Select a Game</h2>
                <p className="text-muted-foreground">
                  Choose an upcoming Mariners game to make your predictions
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
                  </div>
                ) : (
                  games.map(game => (
                    <Card
                      key={game.id}
                      className="cursor-pointer hover:border-mariners-teal hover:shadow-lg transition-all duration-200"
                      onClick={() => setSelectedGame(game)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-16 w-16 rounded-xl flex items-center justify-center">
                            {getTeamLogo(game.opponent)}
                          </div>
                          <div>
                            <p className="text-xl font-bold">
                              {game.is_home ? 'vs' : '@'} {game.opponent}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(game.game_date)} • {formatTime(game.game_time)}
                            </p>
                            <p className="text-xs text-mariners-teal">
                              {game.is_home ? 'T-Mobile Park' : `@ ${game.opponent}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {isGameLocked(game.game_date, game.game_time) ? 
                              'Game Started' : 
                              getTimeUntilGame(game.game_date, game.game_time)
                            }
                          </div>
                          {isGameLocked(game.game_date, game.game_time) ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          ) : (
                            <div className="flex flex-col items-end">
                              <Badge variant="secondary" className="bg-mariners-teal/10 text-mariners-teal mb-1">
                                15+ Categories
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Up to 1000+ points
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {!loading && games.length === 0 && (
                  <div className="col-span-full">
                    <Card className="p-12 text-center">
                      <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Games Available</h3>
                      <p className="text-muted-foreground mb-4">
                        No upcoming games are currently available for predictions.
                      </p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Refresh Page
                      </Button>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Comprehensive Predictions Component */
            <div>
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedGame(null)}
                  className="mb-4"
                >
                  ← Back to Games
                </Button>
              </div>
              <ComprehensivePredictions game={selectedGame} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-yellow-500" />
                2026 Season Leaderboard
              </CardTitle>
              <CardDescription>
                Top predictors competing for ultimate bragging rights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map(entry => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.rank <= 3 ? 'bg-gradient-to-r' : 'bg-muted/30'
                    } ${
                      entry.rank === 1
                        ? 'from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30'
                        : entry.rank === 2
                          ? 'from-gray-400/20 to-gray-400/5 border border-gray-400/30'
                          : entry.rank === 3
                            ? 'from-amber-700/20 to-amber-700/5 border border-amber-700/30'
                            : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-500 text-white'
                            : entry.rank === 2
                              ? 'bg-gray-400 text-white'
                              : entry.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-muted-foreground/20'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{entry.display_name}</p>
                          {getSubscriptionBadge(entry.subscription_tier)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(entry.accuracy_percentage || 0).toFixed(1)}% accuracy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-mariners-teal">
                        {entry.total_points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
                
                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Season leaderboard will appear here once games begin</p>
                  </div>
                )}
              </div>

              {/* Sign up prompt */}
              {!user && (
                <div className="mt-8 p-6 bg-mariners-teal/10 rounded-lg border border-mariners-teal/20">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-mariners-teal mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Join the Competition</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign up to make predictions, compete on the leaderboard, and prove you know the Mariners better than anyone.
                    </p>
                    <Link href="/auth/register">
                      <Button className="bg-mariners-teal hover:bg-mariners-teal/90">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bot-vs-human">
          <div className="space-y-6">
            {/* AI Champions Introduction */}
            <Card className="bg-gradient-to-r from-mariners-navy/20 to-mariners-teal/20 border-mariners-teal/30">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Bot className="h-6 w-6 text-mariners-teal" />
                  Challenge the AI Champions
                </h2>
                <p className="text-muted-foreground mb-4">
                  Think you know the Mariners better than our AI experts? Prove it by consistently beating Mark, Hammy, and Spartan across all prediction categories.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-3xl mb-2">⚓</div>
                    <h3 className="font-semibold">Mark</h3>
                    <p className="text-sm text-muted-foreground">Site Owner • Gut Feeling Expert</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-3xl mb-2">🧢</div>
                    <h3 className="font-semibold">Captain Hammy</h3>
                    <p className="text-sm text-muted-foreground">Trade Analyst • Matchup Master</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <div className="text-3xl mb-2">⚔️</div>
                    <h3 className="font-semibold">Spartan</h3>
                    <p className="text-sm text-muted-foreground">Stats Guru • Advanced Metrics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bot vs Human Leaderboard Component */}
            <BotVsHumanLeaderboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}