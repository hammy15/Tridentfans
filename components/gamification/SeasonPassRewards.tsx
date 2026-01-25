'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Lock, Gift, Check, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';

interface SeasonReward {
  id: string;
  tier: number;
  reward_type: 'badge' | 'title' | 'cosmetic' | 'points_multiplier';
  reward_name: string;
  reward_description: string;
  reward_icon: string;
  points_required: number;
}

interface SeasonProgress {
  id: string;
  user_id: string;
  season: number;
  current_tier: number;
  current_points: number;
  total_points_earned: number;
  rewards_claimed: string[];
}

// Tier configuration
const TIER_CONFIG: Record<number, { name: string; color: string; bgGradient: string; pointsRequired: number }> = {
  1: { name: 'Rookie', color: 'bg-gray-400', bgGradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900', pointsRequired: 0 },
  2: { name: 'Fan', color: 'bg-green-500', bgGradient: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20', pointsRequired: 100 },
  3: { name: 'Supporter', color: 'bg-blue-500', bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', pointsRequired: 300 },
  4: { name: 'Loyal', color: 'bg-purple-500', bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20', pointsRequired: 600 },
  5: { name: 'Veteran', color: 'bg-amber-500', bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20', pointsRequired: 1000 },
  6: { name: 'All-Star', color: 'bg-pink-500', bgGradient: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20', pointsRequired: 1500 },
  7: { name: 'MVP', color: 'bg-red-500', bgGradient: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20', pointsRequired: 2200 },
  8: { name: 'Legend', color: 'bg-orange-500', bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20', pointsRequired: 3000 },
  9: { name: 'Hall of Fame', color: 'bg-mariners-teal', bgGradient: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20', pointsRequired: 4000 },
  10: { name: 'True to the Blue', color: 'bg-mariners-navy', bgGradient: 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30', pointsRequired: 5500 },
};

const REWARD_TYPE_ICONS: Record<string, string> = {
  badge: '🏆',
  title: '👑',
  cosmetic: '✨',
  points_multiplier: '⚡',
};

export function SeasonPassRewards() {
  const [rewards, setRewards] = useState<SeasonReward[]>([]);
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
    }

    await fetchData(user?.id);
  }

  async function fetchData(currentUserId?: string) {
    const supabase = createClient();

    try {
      // Fetch all rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('season_rewards')
        .select('*')
        .order('tier', { ascending: true })
        .order('points_required', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
      } else {
        setRewards(rewardsData || []);
      }

      // Fetch user progress if logged in
      if (currentUserId) {
        const { data: progressData } = await supabase
          .from('user_season_progress')
          .select('*')
          .eq('user_id', currentUserId)
          .order('season', { ascending: false })
          .limit(1)
          .single();

        if (progressData) {
          setProgress(progressData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function claimReward(rewardId: string) {
    if (!userId || !progress) return;

    setClaiming(rewardId);
    const supabase = createClient();

    try {
      const updatedClaimed = [...(progress.rewards_claimed || []), rewardId];

      const { error } = await supabase
        .from('user_season_progress')
        .update({ rewards_claimed: updatedClaimed })
        .eq('id', progress.id);

      if (error) {
        console.error('Error claiming reward:', error);
        return;
      }

      setProgress({ ...progress, rewards_claimed: updatedClaimed });
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  // Group rewards by tier
  const rewardsByTier: Record<number, SeasonReward[]> = {};
  rewards.forEach((reward) => {
    if (!rewardsByTier[reward.tier]) {
      rewardsByTier[reward.tier] = [];
    }
    rewardsByTier[reward.tier].push(reward);
  });

  const currentTier = progress?.current_tier || 0;
  const claimedRewards = progress?.rewards_claimed || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-mariners-teal" />
            Season Pass Rewards
          </CardTitle>
          <CardDescription>
            Earn points through predictions, forum activity, and more. Unlock rewards as you progress through tiers!
          </CardDescription>
        </CardHeader>
        {progress && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className={`h-14 w-14 rounded-full ${TIER_CONFIG[currentTier]?.color || 'bg-gray-400'} flex items-center justify-center`}>
                <Star className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {TIER_CONFIG[currentTier]?.name || 'Unranked'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tier {currentTier} - {progress.total_points_earned.toLocaleString()} total points
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tier progression path */}
      <div className="space-y-4">
        {Object.entries(TIER_CONFIG).map(([tierNum, config]) => {
          const tier = parseInt(tierNum);
          const tierRewards = rewardsByTier[tier] || [];
          const isUnlocked = tier <= currentTier;
          const isCurrent = tier === currentTier;

          return (
            <Card
              key={tier}
              className={`relative overflow-hidden transition-all ${
                isUnlocked
                  ? `bg-gradient-to-r ${config.bgGradient}`
                  : 'opacity-75'
              } ${isCurrent ? 'ring-2 ring-mariners-teal ring-offset-2' : ''}`}
            >
              {/* Tier header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full ${config.color} flex items-center justify-center ${
                        !isUnlocked ? 'opacity-50' : ''
                      }`}
                    >
                      {isUnlocked ? (
                        <Star className="h-5 w-5 text-white" />
                      ) : (
                        <Lock className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        Tier {tier}: {config.name}
                        {isCurrent && (
                          <Badge className="bg-mariners-teal text-white text-xs">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {config.pointsRequired.toLocaleString()} points required
                      </CardDescription>
                    </div>
                  </div>
                  {isUnlocked && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* Rewards */}
              {tierRewards.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {tierRewards.map((reward) => {
                      const isClaimed = claimedRewards.includes(reward.id);
                      const canClaim = isUnlocked && !isClaimed && userId;

                      return (
                        <div
                          key={reward.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isUnlocked
                              ? 'bg-background/80'
                              : 'bg-muted/30'
                          } ${isClaimed ? 'border-green-500/50' : ''}`}
                        >
                          <span className="text-2xl">{reward.reward_icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-medium text-sm ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
                                  {reward.reward_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {reward.reward_description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {REWARD_TYPE_ICONS[reward.reward_type]} {reward.reward_type}
                              </Badge>
                              {isClaimed ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Claimed
                                </span>
                              ) : canClaim ? (
                                <Button
                                  size="sm"
                                  variant="mariners"
                                  className="h-7 text-xs"
                                  onClick={() => claimReward(reward.id)}
                                  disabled={claiming === reward.id}
                                >
                                  {claiming === reward.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Gift className="h-3 w-3 mr-1" />
                                      Claim
                                    </>
                                  )}
                                </Button>
                              ) : !isUnlocked ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Locked
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}

              {/* No rewards placeholder */}
              {tierRewards.length === 0 && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    Rewards coming soon!
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Not logged in prompt */}
      {!userId && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-3">
              Sign in to track your progress and claim rewards
            </p>
            <a href="/auth/login">
              <Button variant="mariners">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
