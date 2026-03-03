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
  Target,
} from 'lucide-react';
import { LiveGameBanner } from '@/components/live/LiveGameBanner';
import { FirstPredictionPrompt } from '@/components/onboarding/FirstPredictionPrompt';
import { SpreadTheWord } from '@/components/marketing/SpreadTheWord';
import { EmailSignup } from '@/components/email/EmailSignup';
import { ReferralCard } from '@/components/referral/ReferralCard';
import { OpeningDayCountdown } from '@/components/countdown/OpeningDayCountdown';
import { HotTopics } from '@/components/spring-training/HotTopics';
import { SpringPredictionMarkets } from '@/components/predictions/SpringPredictionMarkets';

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

// Mark is the site co-owner and operator
const siteOwner = {
  id: 'mark',
  name: 'Mark',
  emoji: '⚓',
  role: 'Co-Owner & Content Director',
  description: 'Longtime M\'s fan with deep knowledge of franchise history. Brings authentic perspective to community discussions.',
  color: 'bg-mariners-teal',
  bio: 'I\'ve been a Mariners fan since 1995. I\'ve lived through The Double, the 116-win season, and 25 years of playoff drought. I understand this franchise\'s history, its heartbreaks, and its hope.'
};

// Captain Hammy and Spartan are the community leaders
const communityLeaders = [
  {
    id: 'captain_hammy',
    name: 'Captain Hammy',
    emoji: '🧢',
    role: 'Founding Member',
    description: "Trade analyst & lifelong M's fan",
    color: 'bg-mariners-navy',
  },
  {
    id: 'spartan',
    name: 'Spartan',
    emoji: '⚔️',
    role: 'Resident Debater',
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

      {/* Hero Section - PREMIUM UPDATE */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-mariners-navy via-mariners-teal to-mariners-navy p-8 text-white md:p-12">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold md:text-6xl leading-tight">
              WHERE MARINERS FANS
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                PREDICT THE FUTURE
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl leading-relaxed">
              Make predictions. Join discussions. Build the ultimate fan community.
              <br />
              <strong>TridentFans</strong> is the premium destination for Mariners fans who understand this beautiful, heartbreaking game we love.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/predictions">
                <Button size="lg" className="bg-white text-mariners-navy hover:bg-white/90 text-lg px-8">
                  <Target className="mr-2 h-5 w-5" />
                  Make Predictions
                </Button>
              </Link>
              <Link href="/forum">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/70 text-white bg-white/10 hover:bg-white/20 text-lg px-8"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join Discussions
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
            <div className="flex h-full items-center justify-center text-[300px] rotate-12">🔱</div>
          </div>
        </div>
      </section>

      {/* Opening Day Countdown - NEW */}
      <section className="mb-12">
        <OpeningDayCountdown />
      </section>

      {/* Spring Prediction Markets - NEW */}
      <section className="mb-12">
        <SpringPredictionMarkets />
      </section>

      {/* Hot Topics - PREMIUM UPDATE */}
      <section className="mb-12">
        <HotTopics />
      </section>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Games & Additional Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Upcoming Games */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-mariners-teal" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>Spring training and regular season games</CardDescription>
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Spring training games coming soon!</p>
                  <div className="bg-gradient-to-r from-mariners-navy/10 to-mariners-teal/10 p-4 rounded-lg">
                    <p className="text-sm text-mariners-navy font-medium">
                      🌵 Cactus League action starts soon. Get ready for Ryan Sloan's 99 MPH heat and Lazaro Montes' big league audition.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard & Community */}
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Season predictions starting soon!</p>
                  <div className="bg-gradient-to-r from-mariners-navy/10 to-mariners-teal/10 p-4 rounded-lg">
                    <p className="text-sm text-mariners-navy font-medium">
                      🏆 Be among the first to make predictions and climb the leaderboard when the season starts.
                    </p>
                  </div>
                </div>
              )}
              <Link href="/predictions?tab=leaderboard" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Talk to Mark - PREMIUM UPDATE */}
          <Card className="border-mariners-teal/20 bg-gradient-to-br from-white to-mariners-teal/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-mariners-teal" />
                Talk to Mark
              </CardTitle>
              <CardDescription>Co-owner with deep Mariners knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/chat/${siteOwner.id}`} className="block">
                <div className="flex items-start gap-4 rounded-lg border-2 border-mariners-teal/20 p-4 transition-all hover:border-mariners-teal/50 hover:bg-mariners-teal/5">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${siteOwner.color} text-xl`}
                  >
                    {siteOwner.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg">{siteOwner.name}</p>
                      <Badge variant="secondary" className="bg-mariners-teal/10 text-mariners-teal text-xs">
                        {siteOwner.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{siteOwner.description}</p>
                    <p className="text-xs text-mariners-navy font-medium italic">
                      "{siteOwner.bio.substring(0, 80)}..."
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-mariners-teal flex-shrink-0 mt-1" />
                </div>
              </Link>
              
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-mariners-navy">Community Leaders:</p>
                {communityLeaders.map(member => (
                  <Link key={member.id} href={`/chat/${member.id}`} className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${member.color} text-sm`}
                      >
                        {member.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Signup */}
          <EmailSignup />

          {/* Referral */}
          <ReferralCard />

          {/* Season Stats */}
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
                <div className="mt-4 text-center">
                  <p className="text-white/90 font-semibold">Spring 2026 Season Countdown</p>
                  <p className="text-sm text-white/70 mt-1">
                    This is our year. Again. But maybe this time...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spread the Word */}
      <section className="mt-12">
        <SpreadTheWord />
      </section>
    </div>
  );
}