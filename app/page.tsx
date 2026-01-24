import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, MessageSquare, TrendingUp, Calendar, ChevronRight, Sparkles } from 'lucide-react';

// Mock data - in production this would come from APIs/database
const mockUpcomingGames = [
  {
    id: 1,
    opponent: 'Los Angeles Angels',
    opponentAbbr: 'LAA',
    date: '2026-01-25',
    time: '7:10 PM PT',
    isHome: true,
  },
  {
    id: 2,
    opponent: 'Texas Rangers',
    opponentAbbr: 'TEX',
    date: '2026-01-27',
    time: '6:40 PM PT',
    isHome: false,
  },
  {
    id: 3,
    opponent: 'Houston Astros',
    opponentAbbr: 'HOU',
    date: '2026-01-30',
    time: '7:10 PM PT',
    isHome: true,
  },
];

const mockLeaderboard = [
  { rank: 1, username: 'SeattleSogKing', points: 1245, accuracy: 68 },
  { rank: 2, username: 'JulioFan2024', points: 1189, accuracy: 65 },
  { rank: 3, username: 'TrueToTheBlue', points: 1156, accuracy: 64 },
  { rank: 4, username: 'RefuseToLose', points: 1098, accuracy: 62 },
  { rank: 5, username: 'MarinersFor Life', points: 1045, accuracy: 60 },
];

const mockHotTopics = [
  {
    id: 1,
    title: 'Julio Rodriguez extension discussion',
    replies: 89,
    category: 'Trade Talk',
  },
  {
    id: 2,
    title: 'Game Day Thread: Mariners @ Angels',
    replies: 234,
    category: 'Game Day',
  },
  {
    id: 3,
    title: 'Spring Training predictions 2026',
    replies: 45,
    category: 'General',
  },
];

const bots = [
  {
    id: 'moose',
    name: 'Moose',
    emoji: '🫎',
    description: 'Expert fan & historian',
    color: 'bg-mariners-teal',
  },
  {
    id: 'captain_hammy',
    name: 'Captain Hammy',
    emoji: '🧢',
    description: 'Founder & strategist',
    color: 'bg-mariners-navy',
  },
  {
    id: 'spartan',
    name: 'Spartan',
    emoji: '⚔️',
    description: 'Debater & analyst',
    color: 'bg-mariners-silver',
  },
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-mariners-navy to-mariners-teal p-8 text-white md:p-12">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold md:text-5xl">Welcome to TridentFans</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
              The ultimate Seattle Mariners fan community. Connect with AI bots, make predictions,
              join discussions, and celebrate the team we love.
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
              <div className="space-y-4">
                {mockUpcomingGames.map(game => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
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
                    <Link href={`/predictions?game=${game.id}`}>
                      <Button variant="mariners" size="sm">
                        Predict
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {mockHotTopics.map(topic => (
                  <Link key={topic.id} href={`/forum/post/${topic.id}`} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{topic.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary">{topic.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {topic.replies} replies
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
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
              <div className="space-y-3">
                {mockLeaderboard.map(entry => (
                  <div key={entry.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
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
                        <p className="text-xs text-muted-foreground">{entry.accuracy}% accuracy</p>
                      </div>
                    </div>
                    <span className="font-semibold text-mariners-teal">{entry.points}</span>
                  </div>
                ))}
              </div>
              <Link href="/predictions?tab=leaderboard" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Chat with Bots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-mariners-teal" />
                Chat with Our Bots
              </CardTitle>
              <CardDescription>AI-powered Mariners experts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bots.map(bot => (
                  <Link key={bot.id} href={`/chat/${bot.id}`} className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${bot.color} text-xl`}
                      >
                        {bot.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-sm text-muted-foreground">{bot.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
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
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-sm text-white/70">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-sm text-white/70">Losses</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-sm text-white/70">AL West</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">--</p>
                  <p className="text-sm text-white/70">GB</p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-white/70">Season starts in Spring 2026</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
