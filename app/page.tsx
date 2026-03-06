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

// Import the new auto-updating MLB components
import { LiveGameTicker } from '@/components/mlb/LiveGameTicker';
import { ALWestStandings } from '@/components/mlb/ALWestStandings';
import { AutoNewsWidget } from '@/components/news/AutoNewsWidget';

// Existing imports
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

// Enhanced Mark profile as co-owner
const siteOwner = {
  id: 'mark',
  name: 'Mark',
  emoji: '⚓',
  role: 'Co-Owner & Content Director',
  description: 'Longtime M\'s fan with deep knowledge of franchise history. Brings authentic perspective to community discussions.',
  color: 'bg-mariners-teal',
  bio: 'I\'ve been a Mariners fan since 1995. I\'ve lived through The Double, the 116-win season, and 25 years of playoff drought. I understand this franchise\'s history, its heartbreaks, and its hope.',
  expertise: [
    '1995 "Refuse to Lose" season',
    '2001 116-win record season', 
    'Franchise legends: Griffey Jr., Edgar Martinez, Randy Johnson',
    'Current prospects and farm system development'
  ]
};

// Community leaders
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hotTopics, setHotTopics] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, forumRes] = await Promise.all([
          fetch('/api/predictions?type=leaderboard').catch(() => ({ json: () => ({ data: [] }) })),
          fetch('/api/forum?limit=3&sort=hot').catch(() => ({ json: () => ({ posts: [] }) })),
        ]);

        const leaderboardData = await leaderboardRes.json();
        const forumData = await forumRes.json();

        setLeaderboard(leaderboardData?.data?.slice(0, 5) || []);
        setHotTopics(forumData?.posts || []);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mariners-navy via-mariners-teal to-mariners-navy">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading TridentFans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section with Live Data */}
      <section className="bg-gradient-to-br from-mariners-navy via-mariners-teal to-mariners-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <Badge className="bg-mariners-gold text-mariners-navy font-bold mb-4 animate-pulse">
              🔱 PREMIUM MARINERS COMMUNITY
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              WHERE MARINERS FANS
              <br />
              <span className="bg-gradient-to-r from-mariners-gold to-mariners-silver bg-clip-text text-transparent">
                PREDICT THE FUTURE
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Real-time MLB data, spring training insights, and authentic fan community since 1995.
            </p>
          </div>

          {/* Live Game Integration */}
          <div className="mt-8">
            <LiveGameTicker />
          </div>
        </div>
      </section>

      {/* Main Content with Auto-Updating Data */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Live MLB Data */}
            <div className="lg:col-span-2 space-y-8">
              {/* Opening Day Countdown */}
              <OpeningDayCountdown />

              {/* Spring Training Hot Topics */}
              <HotTopics />

              {/* Prediction Markets */}
              <SpringPredictionMarkets />

              {/* Community Forum Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-mariners-teal" />
                    Community Discussions
                  </CardTitle>
                  <CardDescription>Latest conversations from the community</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hotTopics.length > 0 ? (
                      hotTopics.map((topic) => (
                        <div key={topic.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <h3 className="font-semibold text-sm mb-2">{topic.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{topic.upvotes} upvotes</span>
                            <span>{topic.comment_count} comments</span>
                            {topic.category && (
                              <Badge variant="outline">{topic.category.name}</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent discussions</p>
                        <p className="text-sm mt-2">Be the first to start a conversation!</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <Link href="/forum">
                      <Button className="w-full bg-mariners-teal hover:bg-mariners-navy">
                        Join the Discussion
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Live Data & Community */}
            <div className="space-y-6">
              {/* AL West Standings */}
              <ALWestStandings />

              {/* Auto-Updating News */}
              <AutoNewsWidget />

              {/* Prediction Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-mariners-gold" />
                    Prediction Leaders
                  </CardTitle>
                  <CardDescription>Top forecasters this season</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                        <div
                          key={entry.user_id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-mariners-teal text-white text-sm font-bold">
                              {entry.rank}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {entry.user?.display_name || entry.user?.username || `Fan ${entry.user_id.slice(-4)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {entry.total_points} points • {((entry.accuracy || 0) * 100).toFixed(1)}% accuracy
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No predictions yet</p>
                        <p className="text-xs mt-1">Be the first to make predictions!</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href="/predictions">
                      <Button variant="outline" className="w-full">
                        View All Predictions
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Community Leaders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-mariners-navy">Community Leaders</CardTitle>
                  <CardDescription>Meet the TridentFans team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Site Owner - Mark */}
                  <div className={`p-4 rounded-lg ${siteOwner.color} text-white`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{siteOwner.emoji}</span>
                      <div>
                        <h3 className="font-bold">{siteOwner.name}</h3>
                        <p className="text-sm opacity-90">{siteOwner.role}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3 opacity-90">{siteOwner.bio}</p>
                    <div className="text-xs opacity-80">
                      <p className="font-semibold mb-1">Expertise:</p>
                      <ul className="space-y-1">
                        {siteOwner.expertise.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Community Leaders */}
                  {communityLeaders.map((leader) => (
                    <div key={leader.id} className={`p-3 rounded-lg ${leader.color} text-white`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{leader.emoji}</span>
                        <div>
                          <h4 className="font-semibold">{leader.name}</h4>
                          <p className="text-xs opacity-90">{leader.role}</p>
                          <p className="text-xs opacity-80 mt-1">{leader.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="text-center pt-2">
                    <Link href="/community">
                      <Button variant="outline" size="sm" className="text-xs">
                        Meet the Community
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Email Signup */}
              <EmailSignup />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-mariners-navy text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Community?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Connect with fellow Mariners fans, make predictions, and stay updated with real-time MLB data.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-mariners-teal hover:bg-mariners-gold hover:text-mariners-navy">
                Join TridentFans
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/predictions">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-mariners-navy">
                Start Predicting
                <Target className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}