'use client';

import { useState, useEffect } from 'react';
import { Trophy, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const PROMPT_DISMISSED_KEY = 'tridentfans_first_prediction_dismissed';

export function FirstPredictionPrompt() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasPredictions, setHasPredictions] = useState(true);

  useEffect(() => {
    async function checkPredictions() {
      if (!user) return;

      // Check if already dismissed
      const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (dismissed) return;

      // Check if user has made predictions
      try {
        const res = await fetch(`/api/predictions?type=history&userId=${user.id}`);
        const data = await res.json();
        if (!data.history || data.history.length === 0) {
          setHasPredictions(false);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to check predictions:', error);
      }
    }

    checkPredictions();
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible || hasPredictions) return null;

  return (
    <Card className="border-mariners-teal/50 bg-gradient-to-r from-mariners-navy/5 to-mariners-teal/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mariners-teal/10">
            <Trophy className="h-6 w-6 text-mariners-teal" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Make Your First Prediction!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Join the competition and predict the next Mariners game. Earn points and climb the
                  leaderboard!
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/predictions" onClick={handleDismiss}>
                <Button variant="mariners" size="sm">
                  Make a Prediction
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
