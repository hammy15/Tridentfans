'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, MessageSquare, Trophy, Bot, TrendingUp, Calendar } from 'lucide-react';

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
        // Use mock data if API not available
        setData({
          users: { total: 0, newThisWeek: 0, activeToday: 0 },
          forum: { totalPosts: 0, totalComments: 0, postsThisWeek: 0 },
          predictions: { totalPredictions: 0, gamesWithPredictions: 0, avgPredictionsPerGame: 0 },
          bots: { totalConversations: 0, conversationsThisWeek: 0, mostPopularBot: 'Moose' },
        });
      }
    } catch {
      // Use empty data on error
      setData({
        users: { total: 0, newThisWeek: 0, activeToday: 0 },
        forum: { totalPosts: 0, totalComments: 0, postsThisWeek: 0 },
        predictions: { totalPredictions: 0, gamesWithPredictions: 0, avgPredictionsPerGame: 0 },
        bots: { totalConversations: 0, conversationsThisWeek: 0, mostPopularBot: 'Moose' },
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
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.users.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
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
              {data.predictions.avgPredictionsPerGame.toFixed(1)} avg per game
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
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
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
              <span className="text-muted-foreground">Active Today</span>
              <span className="font-semibold">{data.users.activeToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">New This Week</span>
              <span className="font-semibold">{data.users.newThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Registered</span>
              <span className="font-semibold">{data.users.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* Forum Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Forum Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Posts</span>
              <span className="font-semibold">{data.forum.totalPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Comments</span>
              <span className="font-semibold">{data.forum.totalComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Posts This Week</span>
              <span className="font-semibold">{data.forum.postsThisWeek}</span>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Predictions</span>
              <span className="font-semibold">{data.predictions.totalPredictions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Games with Predictions</span>
              <span className="font-semibold">{data.predictions.gamesWithPredictions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Avg per Game</span>
              <span className="font-semibold">
                {data.predictions.avgPredictionsPerGame.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bot Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Conversations</span>
              <span className="font-semibold">{data.bots.totalConversations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">This Week</span>
              <span className="font-semibold">{data.bots.conversationsThisWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Most Popular</span>
              <Badge variant="outline">{data.bots.mostPopularBot}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Create prediction games before each Mariners game to drive engagement</p>
          <p>• Pin game day threads to the top of the forum during games</p>
          <p>• Check bot conversations to see what fans are asking about</p>
          <p>• Load the knowledge base to improve bot responses</p>
        </CardContent>
      </Card>
    </div>
  );
}
