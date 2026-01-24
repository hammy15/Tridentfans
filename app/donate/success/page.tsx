'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, Trophy, Home } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function DonateSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti on load
    if (!showConfetti) {
      setShowConfetti(true);

      // Fire confetti from both sides
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#0C2C56', '#005C5C', '#C4CED4', '#FFD700'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#0C2C56', '#005C5C', '#C4CED4', '#FFD700'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [showConfetti]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-xl mx-auto text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <CheckCircle className="h-24 w-24 text-green-500 relative" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your donation has been received. You&apos;re helping keep the Mariners community thriving!
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Badge Earned!
            </CardTitle>
            <CardDescription>Check your profile to see your new supporter badge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <span className="text-4xl">🥉</span>
                <p className="text-sm text-muted-foreground mt-1">Bronze</p>
              </div>
              <div className="text-center">
                <span className="text-4xl">🥈</span>
                <p className="text-sm text-muted-foreground mt-1">Silver</p>
              </div>
              <div className="text-center">
                <span className="text-4xl">🥇</span>
                <p className="text-sm text-muted-foreground mt-1">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="mariners" size="lg">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="lg">
              <Trophy className="mr-2 h-4 w-4" />
              View My Badges
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          A receipt has been sent to your email. If you have any questions, contact us at
          support@tridentfans.com
        </p>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <Heart className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Go Mariners! 🔱</p>
          <p className="text-muted-foreground">True to the Blue, thanks to fans like you.</p>
        </div>
      </div>
    </div>
  );
}
