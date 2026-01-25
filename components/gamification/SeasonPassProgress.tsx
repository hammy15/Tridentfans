'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Gift, Loader2, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';

interface SeasonProgress {
  id: string;
  user_id: string;
  season: number;
  current_tier: number;
  current_points: number;
  total_points_earned: number;
  rewards_claimed: string[];
  created_at: string;
  updated_at: string;
}

interface SeasonReward {
  id: string;
  tier: number;
  reward_type: 'badge' | 'title' | 'cosmetic' | 'points_multiplier';
  reward_name: string;
  reward_description: string;
  reward_icon: string;
  points_required: number;
}

interface SeasonPassProgressProps {
  userId?: string;
}

// Tier thresholds and colors
const TIER_CONFIG: Record<number, { name: string; color: string; pointsRequired: number }> = {
  1: { name: 'Rookie', color: 'bg-gray-400', pointsRequired: 0 },
  2: { name: 'Fan', color: 'bg-green-500', pointsRequired: 100 },
  3: { name: 'Supporter', color: 'bg-blue-500', pointsRequired: 300 },
  4: { name: 'Loyal', color: 'bg-purple-500', pointsRequired: 600 },
  5: { name: 'Veteran', color: 'bg-amber-500', pointsRequired: 1000 },
  6: { name: 'All-Star', color: 'bg-pink-500', pointsRequired: 1500 },
  7: { name: 'MVP', color: 'bg-red-500', pointsRequired: 2200 },
  8: { name: 'Legend', color: 'bg-orange-500', pointsRequired: 3000 },
  9: { name: 'Hall of Fame', color: 'bg-mariners-teal', pointsRequired: 4000 },
  10: { name: 'True to the Blue', color: 'bg-mariners-navy', pointsRequired: 5500 },
};

export function SeasonPassProgress({ userId }: SeasonPassProgressProps) {
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [nextRewards, setNextRewards] = useState<SeasonReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);

  useEffect(() => {
    async function init() {
      if (!userId) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        } else {
          setLoading(false);
          return;
        }
      }
      fetchProgress();
    }
    init();
  }, [userId]);

  useEffect(() => {
    if (currentUserId) {
      fetchProgress();
    }
  }, [currentUserId]);

  async function fetchProgress() {
    if (!currentUserId) return;

    const supabase = createClient();

    try {
      // Fetch user's season progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_season_progress')
        .select('*')
        .eq('user_id', currentUserId)
        .order('season', { ascending: false })
        .limit(1)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching progress:', progressError);
      }

      if (progressData) {
        setProgress(progressData);

        // Fetch next tier rewards
        const nextTier = Math.min(progressData.current_tier + 1, 10);
        const { data: rewardsData } = await supabase
          .from('season_rewards')
          .select('*')
          .eq('tier', nextTier)
          .order('points_required', { ascending: true });

        setNextRewards(rewardsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
        </CardContent>
      </Card>
    );
  }

  if (!currentUserId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Sign in to track your Season Pass progress</p>
          <Link href="/auth/login" className="text-mariners-teal hover:underline text-sm mt-2 inline-block">
            Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Default progress if none exists
  const currentProgress = progress || {
    current_tier: 1,
    current_points: 0,
    total_points_earned: 0,
    rewards_claimed: [],
  };

  const currentTier = TIER_CONFIG[currentProgress.current_tier] || TIER_CONFIG[1];
  const nextTier = TIER_CONFIG[Math.min(currentProgress.current_tier + 1, 10)];
  const isMaxTier = currentProgress.current_tier >= 10;

  // Calculate progress to next tier
  const pointsInCurrentTier = currentProgress.total_points_earned - currentTier.pointsRequired;
  const pointsNeededForNext = nextTier.pointsRequired - currentTier.pointsRequired;
  const progressPercent = isMaxTier
    ? 100
    : Math.min(100, (pointsInCurrentTier / pointsNeededForNext) * 100);
  const pointsToNext = isMaxTier ? 0 : nextTier.pointsRequired - currentProgress.total_points_earned;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-mariners-teal" />
            Season Pass
          </CardTitle>
          <Badge className={`${currentTier.color} text-white`}>
            Tier {currentProgress.current_tier}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current tier display */}
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full ${currentTier.color} flex items-center justify-center`}>
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-lg">{currentTier.name}</p>
            <p className="text-sm text-muted-foreground">
              {currentProgress.total_points_earned.toLocaleString()} total points
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to next tier</span>
            <span className="font-medium">
              {isMaxTier ? 'Max Tier!' : `${pointsToNext} pts to go`}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${nextTier.color}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {!isMaxTier && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tier {currentProgress.current_tier}: {currentTier.name}</span>
              <span>Tier {currentProgress.current_tier + 1}: {nextTier.name}</span>
            </div>
          )}
        </div>

        {/* Next tier rewards preview */}
        {!isMaxTier && nextRewards.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Gift className="h-4 w-4 text-mariners-teal" />
              Next Tier Rewards
            </p>
            <div className="flex flex-wrap gap-2">
              {nextRewards.slice(0, 3).map((reward) => (
                <Badge key={reward.id} variant="outline" className="text-xs">
                  <span className="mr-1">{reward.reward_icon}</span>
                  {reward.reward_name}
                </Badge>
              ))}
              {nextRewards.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{nextRewards.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* View all rewards link */}
        <Link
          href="/season-pass"
          className="flex items-center justify-center gap-1 text-sm text-mariners-teal hover:underline pt-2"
        >
          View All Rewards
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
