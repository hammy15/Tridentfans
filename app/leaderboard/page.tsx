'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Calendar,
  Users,
  Star,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareButton } from '@/components/common/ShareButton';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-auth';
import type { LeaderboardEntry } from '@/types';

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'season' | 'all_time';

interface LeaderboardUser extends LeaderboardEntry {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Mock data for demo
const mockLeaderboard: LeaderboardUser[] = [
  { rank: 1, user_id: '1', username: 'SeattleSogKing', display_name: 'Soggy King', avatar_url: null, total_points: 2450, accuracy: 72, season: 2026 },
  { rank: 2, user_id: '2', username: 'JulioFan2024', display_name: 'Julio Fan', avatar_url: null, total_points: 2280, accuracy: 69, season: 2026 },
  { rank: 3, user_id: '3', username: 'TrueToTheBlue', display_name: null, avatar_url: null, total_points: 2150, accuracy: 67, season: 2026 },
  { rank: 4, user_id: '4', username: 'RefuseToLose', display_name: 'Refuse', avatar_url: null, total_points: 1980, accuracy: 65, season: 2026 },
  { rank: 5, user_id: '5', username: 'MarinersForLife', display_name: null, avatar_url: null, total_points: 1875, accuracy: 63, season: 2026 },
  { rank: 6, user_id: '6', username: 'TMobileFanatic', display_name: 'T-Mobile Fan', avatar_url: null, total_points: 1790, accuracy: 61, season: 2026 },
  { rank: 7, user_id: '7', username: 'KingFelix34', display_name: 'King Felix', avatar_url: null, total_points: 1720, accuracy: 60, season: 2026 },
  { rank: 8, user_id: '8', username: 'SafecoSunsets', display_name: null, avatar_url: null, total_points: 1650, accuracy: 58, season: 2026 },
  { rank: 9, user_id: '9', username: 'GarfieldBoy', display_name: 'Garfield', avatar_url: null, total_points: 1580, accuracy: 57, season: 2026 },
  { rank: 10, user_id: '10', username: 'ProtonsFan', display_name: null, avatar_url: null, total_points: 1520, accuracy: 55, season: 2026 },
];

const timeFrameLabels: Record<TimeFrame, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  season: '2026 Season',
  all_time: 'All Time',
};

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('season');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<{ points: number; accuracy: number } | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Build query based on timeframe
      let query = supabase
        .from('leaderboard')
        .select(`
          *,
          user:profiles!leaderboard_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .order('total_points', { ascending: false })
        .limit(100);

      // Filter by season for season tab
      if (timeFrame === 'season') {
        query = query.eq('season', 2026);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        // Use mock data on error
        setLeaderboard(mockLeaderboard);
      } else if (data && data.length > 0) {
        const transformedData: LeaderboardUser[] = data.map((entry, index) => ({
          rank: index + 1,
          user_id: entry.user_id,
          username: entry.user?.username || 'Anonymous',
          display_name: entry.user?.display_name || null,
          avatar_url: entry.user?.avatar_url || null,
          total_points: entry.total_points,
          accuracy: entry.accuracy && !isNaN(entry.accuracy) ? entry.accuracy : 0,
          season: entry.season,
        }));
        setLeaderboard(transformedData);

        // Find current user's rank
        if (user) {
          const userEntry = transformedData.find(e => e.user_id === user.id);
          if (userEntry) {
            setUserRank(userEntry.rank);
            setUserStats({ points: userEntry.total_points, accuracy: userEntry.accuracy });
          }
        }
      } else {
        setLeaderboard(mockLeaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard(mockLeaderboard);
    } finally {
      setLoading(false);
    }
  }, [user, timeFrame]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    let base = 'flex items-center justify-between p-4 rounded-lg transition-colors';

    if (isCurrentUser) {
      base += ' bg-mariners-teal/10 border-2 border-mariners-teal';
    } else if (rank === 1) {
      base += ' bg-gradient-to-r from-yellow-500/20 to-yellow-500/5';
    } else if (rank === 2) {
      base += ' bg-gradient-to-r from-gray-400/20 to-gray-400/5';
    } else if (rank === 3) {
      base += ' bg-gradient-to-r from-amber-700/20 to-amber-700/5';
    } else {
      base += ' bg-muted/30 hover:bg-muted/50';
    }

    return base;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-muted';
  };

  // Helper function to safely display accuracy percentage
  const formatAccuracy = (accuracy: number | null | undefined): string => {
    if (accuracy === null || accuracy === undefined || isNaN(accuracy)) {
      return '0';
    }
    return Math.round(accuracy).toString();
  };

  const shareData = {
    title: 'TridentFans Leaderboard',
    text: userRank
      ? `I'm ranked #${userRank} on the TridentFans prediction leaderboard! Can you beat my score?`
      : 'Check out the prediction leaderboard on TridentFans!',
    url: 'https://tridentfans.com/leaderboard',
  };

  const displayLeaderboard = friendsOnly
    ? leaderboard.filter(() => false) // TODO: implement friends filter
    : leaderboard;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-mariners-navy to-mariners-teal p-8 text-white">
        <div className="absolute right-0 top-0 opacity-10">
          <Trophy className="h-64 w-64 -translate-y-8 translate-x-8" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="h-8 w-8" />
                Leaderboard
              </h1>
              <p className="mt-2 text-white/80">
                Top Mariners predictors ranked by accuracy and points
              </p>
            </div>
            <ShareButton data={shareData} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </div>

          {/* User's Current Rank Card */}
          {user && userRank && userStats && (
            <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${getRankBadgeStyle(userRank)}`}>
                    {userRank <= 3 ? getRankIcon(userRank) : `#${userRank}`}
                  </div>
                  <div>
                    <p className="font-semibold">Your Ranking</p>
                    <p className="text-sm text-white/70">
                      {profile?.username || 'You'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{userStats.points.toLocaleString()}</p>
                  <p className="text-sm text-white/70">{formatAccuracy(userStats.accuracy)}% accuracy</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
          <TabsList>
            <TabsTrigger value="daily" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="season">Season</TabsTrigger>
            <TabsTrigger value="all_time" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span className="hidden sm:inline">All-Time</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant={friendsOnly ? 'mariners' : 'outline'}
          size="sm"
          onClick={() => setFriendsOnly(!friendsOnly)}
        >
          <Users className="h-4 w-4 mr-2" />
          Friends Only
        </Button>
      </div>

      {/* Top 3 Podium */}
      {!loading && displayLeaderboard.length >= 3 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {/* Second Place */}
          <Card className="order-2 sm:order-1 sm:mt-8 border-gray-400/50">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <div className="h-16 w-16 rounded-full bg-gray-400/20 flex items-center justify-center mx-auto mb-3">
                  <Medal className="h-8 w-8 text-gray-400" />
                </div>
                <Badge className="absolute -bottom-1 -right-1 bg-gray-400 text-white">2nd</Badge>
              </div>
              <h3 className="font-bold mt-2 truncate">
                {displayLeaderboard[1]?.display_name || displayLeaderboard[1]?.username}
              </h3>
              <p className="text-2xl font-bold text-mariners-teal mt-1">
                {displayLeaderboard[1]?.total_points.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatAccuracy(displayLeaderboard[1]?.accuracy)}% accuracy
              </p>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className="order-1 sm:order-2 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                  <Crown className="h-10 w-10 text-yellow-500" />
                </div>
                <Badge className="absolute -bottom-1 -right-1 bg-yellow-500 text-white">1st</Badge>
              </div>
              <h3 className="font-bold text-lg mt-2 truncate">
                {displayLeaderboard[0]?.display_name || displayLeaderboard[0]?.username}
              </h3>
              <p className="text-3xl font-bold text-mariners-teal mt-1">
                {displayLeaderboard[0]?.total_points.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatAccuracy(displayLeaderboard[0]?.accuracy)}% accuracy
              </p>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className="order-3 sm:mt-12 border-amber-700/50">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <div className="h-14 w-14 rounded-full bg-amber-700/20 flex items-center justify-center mx-auto mb-3">
                  <Medal className="h-7 w-7 text-amber-700" />
                </div>
                <Badge className="absolute -bottom-1 -right-1 bg-amber-700 text-white">3rd</Badge>
              </div>
              <h3 className="font-bold mt-2 truncate">
                {displayLeaderboard[2]?.display_name || displayLeaderboard[2]?.username}
              </h3>
              <p className="text-xl font-bold text-mariners-teal mt-1">
                {displayLeaderboard[2]?.total_points.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatAccuracy(displayLeaderboard[2]?.accuracy)}% accuracy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-mariners-teal" />
            {timeFrameLabels[timeFrame]} Rankings
          </CardTitle>
          <CardDescription>
            {displayLeaderboard.length} predictor{displayLeaderboard.length !== 1 ? 's' : ''} ranked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
            </div>
          ) : displayLeaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rankings available yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayLeaderboard.map(entry => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={getRankStyle(entry.rank, isCurrentUser)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getRankBadgeStyle(entry.rank)}`}
                      >
                        {entry.rank <= 3 ? getRankIcon(entry.rank) || entry.rank : entry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {entry.display_name || entry.username}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="mariners" className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{entry.username}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-mariners-teal">
                        {entry.total_points.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatAccuracy(entry.accuracy)}% accuracy
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
