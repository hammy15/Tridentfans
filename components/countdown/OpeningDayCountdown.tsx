'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function OpeningDayCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Opening Day 2026 - March 26, 2026 at 1:05 PM PT (typical first pitch time)
  const openingDay = new Date('2026-03-26T13:05:00-07:00');

  useEffect(() => {
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = openingDay.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-mariners-navy to-mariners-teal text-white overflow-hidden relative">
      <div className="absolute right-4 top-4 text-8xl opacity-10">🔱</div>
      <CardHeader className="text-center relative z-10">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl">
          <Calendar className="h-8 w-8" />
          2026 OPENING DAY COUNTDOWN
        </CardTitle>
        <p className="text-white/90 mt-2 text-lg">Until we break the drought</p>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              Days
            </div>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              Hours
            </div>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              Minutes
            </div>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              Seconds
            </div>
          </div>
        </div>
        <div className="text-center mt-6">
          <p className="text-white/90 text-lg font-semibold">
            This is our year. Again. But maybe this time...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}