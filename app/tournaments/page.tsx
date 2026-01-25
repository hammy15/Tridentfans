'use client';

import { Trophy, Calendar, Award, Zap, Target, Crown } from 'lucide-react';
import { TournamentList } from '@/components/tournaments/TournamentList';
import { Card, CardContent } from '@/components/ui/card';

export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-mariners-navy to-mariners-teal p-8 text-white">
        <div className="absolute right-0 top-0 opacity-10">
          <Trophy className="h-64 w-64 -translate-y-8 translate-x-8" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tournaments</h1>
              <p className="text-white/80">Compete for glory and prizes</p>
            </div>
          </div>
          <p className="text-lg text-white/90 leading-relaxed">
            Join prediction tournaments against fellow Mariners fans. Weekly challenges,
            monthly showdowns, and special events throughout the season. Climb the ranks,
            earn badges, and prove you&apos;re the ultimate Mariners prophet!
          </p>
        </div>
      </div>

      {/* Tournament Features */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-mariners-teal/20 bg-gradient-to-br from-mariners-teal/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold">Weekly</p>
              <p className="text-sm text-muted-foreground">New every Monday</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-mariners-teal/20 bg-gradient-to-br from-mariners-teal/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold">Monthly</p>
              <p className="text-sm text-muted-foreground">Big prizes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-mariners-teal/20 bg-gradient-to-br from-mariners-teal/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mariners-teal/10">
              <Zap className="h-6 w-6 text-mariners-teal" />
            </div>
            <div>
              <p className="font-semibold">Special Events</p>
              <p className="text-sm text-muted-foreground">Limited time</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-mariners-teal/20 bg-gradient-to-br from-mariners-teal/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <Award className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold">Earn Badges</p>
              <p className="text-sm text-muted-foreground">Show them off</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-mariners-teal" />
            How Tournaments Work
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium">Join a Tournament</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Join&quot; on any active or upcoming tournament
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium">Make Predictions</p>
                <p className="text-sm text-muted-foreground">
                  Submit your picks for each game during the tournament
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mariners-teal text-white font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium">Win Prizes</p>
                <p className="text-sm text-muted-foreground">
                  Top performers earn badges, recognition, and special prizes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament List Component */}
      <TournamentList />
    </div>
  );
}
