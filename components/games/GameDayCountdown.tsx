'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCountdown } from '@/hooks/useCountdown';
import {
  formatGameTime,
  formatGameDate,
  getCountdownMessage,
} from '@/lib/countdown';
import {
  Calendar,
  MapPin,
  Trophy,
  Radio,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';

interface CountdownDigitProps {
  value: number;
  label: string;
}

function CountdownDigit({ value, label }: CountdownDigitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[70px] text-center border border-white/20">
          <span className="text-4xl md:text-5xl font-bold text-white tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        </div>
        {/* Animated pulse effect */}
        <div className="absolute inset-0 rounded-lg bg-mariners-teal/20 animate-pulse pointer-events-none" />
      </div>
      <span className="mt-2 text-xs md:text-sm text-white/70 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

interface GameDayCountdownProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function GameDayCountdown({ variant: _variant = 'full', className = '' }: GameDayCountdownProps) {
  const { countdown, isGameDay, isLive, nextGame, loading, error } = useCountdown();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <Card className={`bg-mariners-navy text-white ${className}`}>
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </CardContent>
      </Card>
    );
  }

  if (error || !nextGame) {
    return (
      <Card className={`bg-mariners-navy text-white ${className}`}>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-mariners-teal opacity-50" />
          <p className="text-white/70">
            {error || 'No upcoming games scheduled'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Live game state
  if (isLive) {
    return (
      <Card className={`bg-gradient-to-br from-red-600 to-mariners-navy text-white overflow-hidden ${className}`}>
        <CardContent className="p-6 md:p-8">
          {/* Live Badge */}
          <div className="flex items-center justify-between mb-6">
            <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-2 px-4 py-1">
              <Radio className="h-4 w-4" />
              LIVE NOW
            </Badge>
            <Link href="/forum?category=game-day">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Game Thread
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-xl bg-mariners-teal flex items-center justify-center text-2xl font-bold mb-2">
                SEA
              </div>
              <span className="text-5xl font-bold">{nextGame.marinersScore ?? 0}</span>
            </div>

            <div className="text-3xl font-light text-white/50">vs</div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-xl bg-gray-600 flex items-center justify-center text-2xl font-bold mb-2">
                {nextGame.opponentAbbr}
              </div>
              <span className="text-5xl font-bold">{nextGame.opponentScore ?? 0}</span>
            </div>
          </div>

          {/* Game Info */}
          <div className="text-center">
            <p className="text-white/80">{nextGame.statusDetail}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-white/60">
              <MapPin className="h-4 w-4" />
              <span>{nextGame.venue}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/predictions">
              <Button className="bg-mariners-teal hover:bg-mariners-teal/80">
                <Trophy className="mr-2 h-4 w-4" />
                Make Predictions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Game Day (today but not started)
  if (isGameDay && countdown.totalSeconds > 0) {
    return (
      <Card className={`bg-gradient-to-br from-mariners-teal to-mariners-navy text-white overflow-hidden ${className}`}>
        <CardContent className="p-6 md:p-8">
          {/* Game Day Badge */}
          <div className="flex items-center justify-between mb-6">
            <Badge className="bg-yellow-500 text-black font-bold px-4 py-1">
              GAME DAY!
            </Badge>
            <span className="text-white/70 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatGameTime(nextGame.date)}
            </span>
          </div>

          {/* Matchup */}
          <div className="text-center mb-6">
            <p className="text-white/70 mb-2">Seattle Mariners</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl font-bold">{nextGame.isHome ? 'vs' : '@'}</span>
              <div className="w-16 h-16 rounded-xl bg-gray-600 flex items-center justify-center text-xl font-bold">
                {nextGame.opponentAbbr}
              </div>
              <span className="text-2xl font-bold">{nextGame.opponent}</span>
            </div>
          </div>

          {/* Countdown to First Pitch */}
          <div className="mb-6">
            <p className="text-center text-white/70 mb-4">Time Until First Pitch</p>
            <div className="flex justify-center gap-4">
              <CountdownDigit value={countdown.hours} label="Hours" />
              <div className="text-4xl text-white/30 self-start mt-3">:</div>
              <CountdownDigit value={countdown.minutes} label="Minutes" />
              <div className="text-4xl text-white/30 self-start mt-3">:</div>
              <CountdownDigit value={countdown.seconds} label="Seconds" />
            </div>
          </div>

          {/* Venue */}
          <div className="text-center text-white/60 flex items-center justify-center gap-2 mb-6">
            <MapPin className="h-4 w-4" />
            <span>{nextGame.venue}</span>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Link href="/predictions">
              <Button className="bg-white text-mariners-navy hover:bg-white/90">
                <Trophy className="mr-2 h-4 w-4" />
                Make Your Prediction
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Countdown to next game
  return (
    <Card className={`bg-gradient-to-br from-mariners-navy via-mariners-navy to-mariners-teal/30 text-white overflow-hidden ${className}`}>
      <CardContent className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm uppercase tracking-wider">Next Game</p>
            <p className="text-lg font-semibold mt-1">{getCountdownMessage(nextGame.date)}</p>
          </div>
          <Badge variant="outline" className="border-mariners-teal text-mariners-teal">
            <Calendar className="mr-2 h-3 w-3" />
            {formatGameDate(nextGame.date)}
          </Badge>
        </div>

        {/* Matchup */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-xl bg-mariners-teal flex items-center justify-center text-2xl font-bold mb-2">
              SEA
            </div>
            <span className="text-sm text-white/70">Mariners</span>
          </div>

          <div className="text-center">
            <span className="text-3xl font-light text-white/50">
              {nextGame.isHome ? 'vs' : '@'}
            </span>
            <p className="text-sm text-white/50 mt-1">{formatGameTime(nextGame.date)}</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-xl bg-gray-600 flex items-center justify-center text-2xl font-bold mb-2">
              {nextGame.opponentAbbr}
            </div>
            <span className="text-sm text-white/70">{nextGame.opponent.split(' ').pop()}</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-3 md:gap-4 mb-6">
          <CountdownDigit value={countdown.days} label="Days" />
          <div className="text-4xl text-white/30 self-start mt-3">:</div>
          <CountdownDigit value={countdown.hours} label="Hours" />
          <div className="text-4xl text-white/30 self-start mt-3">:</div>
          <CountdownDigit value={countdown.minutes} label="Mins" />
          <div className="text-4xl text-white/30 self-start mt-3 hidden md:block">:</div>
          <div className="hidden md:block">
            <CountdownDigit value={countdown.seconds} label="Secs" />
          </div>
        </div>

        {/* Venue */}
        <div className="text-center text-white/60 flex items-center justify-center gap-2 mb-6">
          <MapPin className="h-4 w-4" />
          <span>{nextGame.venue}</span>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link href="/predictions">
            <Button className="bg-mariners-teal hover:bg-mariners-teal/80 text-white">
              <Trophy className="mr-2 h-4 w-4" />
              Make Prediction
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
