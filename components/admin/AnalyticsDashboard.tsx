'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Users,
  MessageSquare,
  Trophy,
  Bot,
  TrendingUp,
  DollarSign,
  Award,
  Target,
} from 'lucide-react';

interface BotLeaderboardEntry {
  id: string;
  name: string;
  emoji: string;
  points: number;
  predictions: number;
  accuracy: number;
}

interface AnalyticsData {
  users: {
    total: number;
    newThisWeek: number;
    activeToday: number;
  };
  forum: {
    totalPosts: number;
    totalComments: number;
    postsThisWeek: number;
  };
  predictions: {
    totalPredictions: number;
    gamesWithPredictions: number;
    avgPredictionsPerGame: number;
  };
  bots: {
    totalConversations: number;
    conversationsThisWeek: number;
    mostPopularBot: string;
    leaderboard?: BotLeaderboardEntry[];
  };
  donations?: {
    total: number;
    thisMonth: number;
    donorCount: number;
  };
  badges?: {
    totalAwarded: number;
  };
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      } else {
        setData({
          users: { total: 0, newThisWeek: 0, activeToday: 0 },
          forum: { totalPosts: 0, totalComments: 0, postsThisWeek: 0 },
          predictions: { totalPredictions: 0, gamesWithPredictions: 0, avgPredictionsPerGame: 0 },
          bots: { totalConversations: 0, conversationsThisWeek: 0, mostPopularBot: 'Moose' },
          donations: { total: 0, thisMonth: 0, donorCount: 0 },
          badges: { totalAwarded: 0 },
        });
      }
    } catch {
      setData({
        users: { total: 0, newThisWeek: 0, activeToday: 0 },
        forum: { totalPosts: 0, totalComments: 0, postsThisWeek: 0 },
        predictions: { totalPredictions: 0, gamesWithPredictions: 0, avgPredictionsPerGame: 0 },
        bots: { totalConversations: 0, conversationsThisWeek: 0, mostPopularBot: 'Moose' },
        donations: { total: 0, thisMonth: 0, donorCount: 0 },
        badges: { totalAwarded: 0 },
      });
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

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.users.total}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
            {data.users.newThisWeek > 0 && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />+{data.users.newThisWeek} this week
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.forum.totalPosts}</p>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
              </div>
            </div>
            {data.forum.postsThisWeek > 0 && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />+{data.forum.postsThisWeek} this week
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.predictions.totalPredictions}</p>
                <p className="text-sm text-muted-foreground">Predictions</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.predictions.avgPredictionsPerGame.toFixed(1)} avg/game
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.bots.totalConversations}</p>
                <p className="text-sm text-muted-foreground">Bot Chats</p>
              </div>
            </div>
            {data.bots.conversationsThisWeek > 0 && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />+{data.bots.conversationsThisWeek} this week
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">${data.donations?.total.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-muted-foreground">Donations</p>
              </div>
            </div>
            {(data.donations?.thisMonth || 0) > 0 && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />${data.donations?.thisMonth.toFixed(2)} this month
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Bot Prediction Performance */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Bot Predictions
            </CardTitle>
            <CardDescription>How our bots are performing</CardDescription>
          </CardHeader>
          <CardContent>
            {data.bots.leaderboard && data.bots.leaderboard.length > 0 ? (
              <div className="space-y-3">
                {data.bots.leaderboard.map((bot, index) => (
                  <div
                    key={bot.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{bot.emoji}</span>
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bot.predictions} predictions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{bot.points} pts</p>
                      <p className="text-xs text-muted-foreground">{bot.accuracy}% acc</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No predictions yet</p>
            )}
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Registered</span>
              <span className="font-semibold">{data.users.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New This Week</span>
              <span className="font-semibold text-green-600">+{data.users.newThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Forum Posts</span>
              <span className="font-semibold">{data.forum.totalPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Forum Comments</span>
              <span className="font-semibold">{data.forum.totalComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Badges Awarded</span>
              <span className="font-semibold">{data.badges?.totalAwarded || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Predictions</span>
              <span className="font-semibold">{data.predictions.totalPredictions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Games Tracked</span>
              <span className="font-semibold">{data.predictions.gamesWithPredictions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bot Conversations</span>
              <span className="font-semibold">{data.bots.totalConversations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Most Popular Bot</span>
              <Badge variant="outline">{data.bots.mostPopularBot}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Donors</span>
              <span className="font-semibold">{data.donations?.donorCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      {(data.donations?.total || 0) > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-3xl font-bold text-emerald-600">
                  ${data.donations?.total.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-3xl font-bold text-emerald-600">
                  ${data.donations?.thisMonth.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-3xl font-bold text-emerald-600">{data.donations?.donorCount}</p>
                <p className="text-sm text-muted-foreground">Supporters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium text-foreground">Predictions:</span> Games sync automatically daily. Bot predictions are made at 4 PM PT.
          </p>
          <p>
            <span className="font-medium text-foreground">Game Threads:</span> Auto-created at 3 PM PT on game days. Pin them for visibility.
          </p>
          <p>
            <span className="font-medium text-foreground">Scoring:</span> Predictions are scored at 6 AM PT the day after games.
          </p>
          <p>
            <span className="font-medium text-foreground">Knowledge Base:</span> Load Mariners history to improve bot responses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
