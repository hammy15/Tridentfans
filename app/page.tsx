'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  MessageSquare,
  TrendingUp,
  Calendar,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { LiveGameBanner } from '@/components/live/LiveGameBanner';
import { FirstPredictionPrompt } from '@/components/onboarding/FirstPredictionPrompt';

interface UpcomingGame {
  gamePk: number;
  opponent: string;
  opponentAbbr: string;
  date: Date;
  isHome: boolean;
  venue: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  total_points: number;
  accuracy: number;
  user?: { username: string; display_name: string | null };
}

interface ForumPost {
  id: string;
  title: string;
  upvotes: number;
  comment_count: number;
  category?: { name: string };
}

interface Standings {
  team: { name: string };
  wins: number;
  losses: number;
  gamesBack: string;
}

// Marty Moose is our site manager (AI)
const siteManager = {
  id: 'moose',
  name: 'Marty Moose',
  emoji: '🫎',
  role: 'Site Manager',
  description: 'Your go-to Mariners expert',
  color: 'bg-mariners-teal',
};

// Captain Hammy and Spartan are real people (site founders)
const founders = [
  {
    id: 'captain_hammy',
    name: 'Captain Hammy',
    emoji: '🧢',
    role: 'Founder',
    description: "Lifelong M's fan & trade analyst",
    color: 'bg-mariners-navy',
  },
  {
    id: 'spartan',
    name: 'Spartan',
    emoji: '⚔️',
    role: 'Co-Founder',
    description: 'Stats guru & hot take artist',
    color: 'bg-mariners-silver',
  },
];

export default function HomePage() {
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hotTopics, setHotTopics] = useState<ForumPost[]>([]);
  const [standings, setStandings] = useState<Standings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [gamesRes, leaderboardRes, forumRes, standingsRes] = await Promise.all([
          fetch('/api/mlb?type=upcoming&days=7'),
          fetch('/api/predictions?type=leaderboard'),
          fetch('/api/forum?limit=3&sort=hot'),
          fetch('/api/mlb?type=standings'),
        ]);

        const gamesData = await gamesRes.json();
        const leaderboardData = await leaderboardRes.json();
        const forumData = await forumRes.json();
        const standingsData = await standingsRes.json();

        if (gamesData.games) {
          setUpcomingGames(gamesData.games.slice(0, 3));
        }
        if (leaderboardData.leaderboard) {
          setLeaderboard(leaderboardData.leaderboard.slice(0, 5));
        }
        if (forumData.posts) {
          setHotTopics(forumData.posts.slice(0, 3));
        }
        if (standingsData.standings) {
          // Find Mariners in standings
          const mariners = standingsData.standings.find((t: Standings) =>
            t.team.name.includes('Mariners')
          );
          setStandings(mariners || null);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      }
      setLoading(false);
    }

    fetchData();
  }, []);
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Live Game Banner */}
      <section className="mb-6">
        <LiveGameBanner />
      </section>

      {/* First Prediction Prompt for new users */}
      <section className="mb-6">
        <FirstPredictionPrompt />
      </section>

      {/* Hero Section */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-mariners-navy to-mariners-teal p-8 text-white md:p-12">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold md:text-5xl">Welcome to TridentFans</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
              The ultimate Seattle Mariners fan community. Make predictions, join discussions, and
              connect with fellow fans who share our passion.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/predictions">
                <Button size="lg" className="bg-white text-mariners-navy hover:bg-white/90">
                  <Trophy className="mr-2 h-5 w-5" />
                  Make Predictions
                </Button>
              </Link>
              <Link href="/forum">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join Forum
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <div className="flex h-full items-center justify-center text-[200px]">🔱</div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Games & Predictions */}
        <div className="space-y-8 lg:col-span-2">
          {/* Upcoming Games */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-mariners-teal" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>Make predictions before games start</CardDescription>
              </div>
              <Link href="/predictions">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
                </div>
              ) : upcomingGames.length > 0 ? (
                <div className="space-y-4">
                  {upcomingGames.map(game => (
                    <div
                      key={game.gamePk}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold text-sm">
                          {game.opponentAbbr}
                        </div>
                        <div>
                          <p className="font-medium">
                            {game.isHome ? 'vs' : '@'} {game.opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(game.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Link href="/predictions">
                        <Button variant="mariners" size="sm">
                          Predict
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No upcoming games scheduled
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hot Forum Topics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-mariners-teal" />
                  Hot Topics
                </CardTitle>
                <CardDescription>Join the conversation</CardDescription>
              </div>
              <Link href="/forum">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
                </div>
              ) : hotTopics.length > 0 ? (
                <div className="space-y-4">
                  {hotTopics.map(topic => (
                    <Link key={topic.id} href={`/forum/post/${topic.id}`} className="block">
                      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{topic.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary">{topic.category?.name || 'General'}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {topic.comment_count || 0} replies
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No forum posts yet</p>
                  <Link href="/forum" className="mt-2 inline-block">
                    <Button variant="outline" size="sm">
                      Start a discussion
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard & Bots */}
        <div className="space-y-8">
          {/* Prediction Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-mariners-gold" />
                Top Predictors
              </CardTitle>
              <CardDescription>Season leaderboard</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                                ? 'bg-gray-400 text-white'
                                : index === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-muted'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.user?.display_name || entry.user?.username || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.accuracy}% accuracy
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-mariners-teal">{entry.total_points}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No predictions yet. Be the first!
                </p>
              )}
              <Link href="/predictions?tab=leaderboard" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Meet the Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">👋 Meet the Team</CardTitle>
              <CardDescription>The people behind TridentFans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {founders.map(founder => (
                  <Link key={founder.id} href={`/chat/${founder.id}`} className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${founder.color} text-xl`}
                      >
                        {founder.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{founder.name}</p>
                        <p className="text-xs text-mariners-teal font-medium">{founder.role}</p>
                        <p className="text-sm text-muted-foreground">{founder.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Site Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-mariners-teal" />
                Need Help?
              </CardTitle>
              <CardDescription>Chat with Marty anytime</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/chat/${siteManager.id}`} className="block">
                <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${siteManager.color} text-xl`}
                  >
                    {siteManager.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{siteManager.name}</p>
                    <p className="text-xs text-mariners-teal font-medium">{siteManager.role}</p>
                    <p className="text-sm text-muted-foreground">{siteManager.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-mariners-navy to-mariners-teal text-white">
            <CardHeader>
              <CardTitle>2026 Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{standings?.wins ?? '--'}</p>
                  <p className="text-sm text-white/70">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{standings?.losses ?? '--'}</p>
                  <p className="text-sm text-white/70">Losses</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {standings
                      ? standings.gamesBack === '-'
                        ? '1st'
                        : `${standings.gamesBack} GB`
                      : '--'}
                  </p>
                  <p className="text-sm text-white/70">AL West</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {standings
                      ? `${((standings.wins / (standings.wins + standings.losses)) * 100).toFixed(0)}%`
                      : '--'}
                  </p>
                  <p className="text-sm text-white/70">Win %</p>
                </div>
              </div>
              {!standings && (
                <p className="mt-4 text-center text-sm text-white/70">
                  Season starts in Spring 2026
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
