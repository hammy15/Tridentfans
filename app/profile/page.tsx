'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-auth';
import {
  Loader2,
  Trophy,
  MessageSquare,
  Calendar,
  Save,
  Target,
  Award,
  TrendingUp,
  Bell,
  Users,
  UserPlus,
  UserMinus,
  Edit2,
  Flame,
  Medal,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import { BadgeDisplay } from '@/components/gamification/BadgeDisplay';
import { BadgeShowcase } from '@/components/badges/UserBadges';
import { Checkbox } from '@/components/ui/checkbox';
import type { Profile } from '@/types';

interface ProfileStats {
  posts: number;
  comments: number;
  predictions: number;
  accuracy: number;
  leaderboardRank: number | null;
  leaderboardPoints: number;
  badges: number;
  totalDonated: number;
  conversations: number;
  currentStreak: number;
  longestStreak: number;
  wins: number;
  losses: number;
}

interface RecentActivity {
  posts: Array<{ id: string; title: string; created_at: string }>;
  predictions: Array<{
    id: string;
    game: { opponent: string; game_date: string } | null;
    score: number | null;
    submitted_at: string;
    predictions?: { winner: string };
  }>;
}

interface UserBadge {
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: string | Date;
}

// Generate avatar color from username
function getAvatarColor(username: string): string {
  const colors = [
    'bg-mariners-navy',
    'bg-mariners-teal',
    'bg-blue-600',
    'bg-purple-600',
    'bg-green-600',
    'bg-orange-600',
    'bg-pink-600',
    'bg-indigo-600',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Season Pass Tiers
const SEASON_TIERS = [
  { tier: 1, points: 100, name: 'Rookie', icon: '🌱' },
  { tier: 2, points: 250, name: 'Fan', icon: '⚾' },
  { tier: 3, points: 500, name: 'Contender', icon: '💪' },
  { tier: 4, points: 1000, name: 'Veteran', icon: '🎖️' },
  { tier: 5, points: 2000, name: 'All-Star', icon: '⭐' },
  { tier: 6, points: 3500, name: 'Elite', icon: '🏅' },
  { tier: 7, points: 5000, name: 'MVP Candidate', icon: '🏆' },
  { tier: 8, points: 7500, name: 'Legend', icon: '👑' },
  { tier: 9, points: 10000, name: 'Hall of Famer', icon: '🔱' },
  { tier: 10, points: 15000, name: 'Champion', icon: '💎' },
];

function SeasonPassProgress({ totalPoints }: { totalPoints: number }) {
  // Find current tier
  let currentTierIndex = 0;
  for (let i = SEASON_TIERS.length - 1; i >= 0; i--) {
    if (totalPoints >= SEASON_TIERS[i].points) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = SEASON_TIERS[currentTierIndex];
  const nextTier = SEASON_TIERS[currentTierIndex + 1];

  const progress = nextTier
    ? ((totalPoints - currentTier.points) / (nextTier.points - currentTier.points)) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Current tier display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentTier.icon}</span>
          <div>
            <p className="font-semibold text-lg">{currentTier.name}</p>
            <p className="text-sm text-muted-foreground">Tier {currentTier.tier}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-mariners-teal">{totalPoints.toLocaleString()} pts</p>
          {nextTier && (
            <p className="text-sm text-muted-foreground">
              {(nextTier.points - totalPoints).toLocaleString()} to next tier
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {nextTier && (
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentTier.name}</span>
            <span>{nextTier.name}</span>
          </div>
        </div>
      )}

      {/* Tier preview */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 pt-2">
        {SEASON_TIERS.map((tier, idx) => (
          <div
            key={tier.tier}
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              idx <= currentTierIndex
                ? 'bg-mariners-teal/20 border border-mariners-teal'
                : 'bg-muted/50 opacity-50'
            }`}
            title={`${tier.name}: ${tier.points.toLocaleString()} pts`}
          >
            <span className="text-lg">{tier.icon}</span>
            <span className="text-xs mt-1">{tier.tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile: authProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine if viewing own profile or another user's
  const viewingUserId = searchParams.get('user');
  const isOwnProfile = !viewingUserId || viewingUserId === user?.id;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_game_reminders: true,
    email_prediction_results: true,
    email_weekly_digest: true,
    email_mentions: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  const targetUserId = viewingUserId || user?.id;
  const profile = isOwnProfile ? authProfile : viewedProfile;

  // Redirect to login if not authenticated and viewing own profile
  useEffect(() => {
    if (!loading && !user && !viewingUserId) {
      router.push('/auth/login');
    }
  }, [user, loading, router, viewingUserId]);

  // Fetch viewed profile if not own
  useEffect(() => {
    async function fetchViewedProfile() {
      if (!viewingUserId || viewingUserId === user?.id) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', viewingUserId)
        .single();

      if (data) {
        setViewedProfile(data as Profile);
      }
    }

    fetchViewedProfile();
  }, [viewingUserId, user?.id]);

  // Set form values from profile
  useEffect(() => {
    if (profile && isOwnProfile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setTitle(profile.title || '');
      if (profile.notification_preferences) {
        setNotificationPrefs({
          email_game_reminders: profile.notification_preferences.email_game_reminders ?? true,
          email_prediction_results: profile.notification_preferences.email_prediction_results ?? true,
          email_weekly_digest: profile.notification_preferences.email_weekly_digest ?? true,
          email_mentions: profile.notification_preferences.email_mentions ?? true,
        });
      }
    }
  }, [profile, isOwnProfile]);

  // Check follow status
  useEffect(() => {
    async function checkFollowStatus() {
      if (!user || !viewingUserId || viewingUserId === user.id) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', viewingUserId)
        .single();

      setIsFollowing(!!data);
    }

    checkFollowStatus();
  }, [user, viewingUserId]);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      if (!targetUserId) return;
      try {
        const res = await fetch(`/api/profile/stats?userId=${targetUserId}`);
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          setRecentActivity(data.recentActivity);
        }

        // Fetch badges
        const badgesRes = await fetch(`/api/badges?userId=${targetUserId}`);
        const badgesData = await badgesRes.json();
        if (badgesData.badges) {
          setBadges(badgesData.badges.map((b: { badge_icon: string; badge_name: string; badge_description: string; earned_at: string; badge_type?: string }) => ({
            icon: b.badge_icon,
            name: b.badge_name,
            description: b.badge_description,
            rarity: getRarityFromType(b.badge_type),
            earnedAt: b.earned_at,
          })));
        }

        // Check for new badges if own profile
        if (isOwnProfile && user) {
          await fetch('/api/badges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoadingStats(false);
    }

    if (targetUserId) fetchStats();
  }, [targetUserId, isOwnProfile, user]);

  function getRarityFromType(type?: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (!type) return 'common';
    if (type.includes('legendary') || type.includes('100')) return 'legendary';
    if (type.includes('epic') || type.includes('500')) return 'epic';
    if (type.includes('rare') || type.includes('50')) return 'rare';
    if (type.includes('uncommon') || type.includes('10')) return 'uncommon';
    return 'common';
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        title: title || null,
      })
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const handleFollow = async () => {
    if (!user || !viewingUserId) return;
    setFollowLoading(true);

    const supabase = createClient();

    if (isFollowing) {
      // Unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', viewingUserId);
      setIsFollowing(false);
      if (viewedProfile) {
        setViewedProfile({
          ...viewedProfile,
          follower_count: (viewedProfile.follower_count || 1) - 1,
        });
      }
    } else {
      // Follow
      await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: viewingUserId,
        });
      setIsFollowing(true);
      if (viewedProfile) {
        setViewedProfile({
          ...viewedProfile,
          follower_count: (viewedProfile.follower_count || 0) + 1,
        });
      }
    }

    setFollowLoading(false);
  };

  const handleNotificationToggle = async (key: keyof typeof notificationPrefs) => {
    if (!user) return;

    const newPrefs = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(newPrefs);
    setSavingNotifications(true);

    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ notification_preferences: newPrefs })
      .eq('id', user.id);

    setSavingNotifications(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  if (!profile) {
    if (viewingUserId) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">User not found</p>
              <p className="text-muted-foreground">This user profile does not exist.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  }

  const avatarColor = getAvatarColor(profile.username);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Public Profile Header */}
        <Card className="overflow-hidden">
          {/* Header banner */}
          <div className="h-24 bg-gradient-to-r from-mariners-navy to-mariners-teal" />

          <CardContent className="relative pt-0">
            {/* Avatar - positioned to overlap banner */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 md:-mt-10">
              <div className="flex items-end gap-4">
                <div
                  className={`flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full ${avatarColor} text-white text-4xl md:text-5xl font-bold border-4 border-background shadow-lg`}
                >
                  {profile.username[0].toUpperCase()}
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  {profile.title && (
                    <Badge variant="secondary" className="mt-1">
                      {profile.title}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 md:mt-0 md:pb-2">
                {isOwnProfile ? (
                  !editing && (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )
                ) : user && (
                  <Button
                    variant={isFollowing ? 'outline' : 'mariners'}
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Follower/Following counts */}
            <div className="flex gap-6 mt-4 pt-4 border-t">
              <Link
                href={`/community/followers?user=${profile.id}`}
                className="hover:text-mariners-teal transition-colors"
              >
                <span className="font-bold">{profile.follower_count || 0}</span>{' '}
                <span className="text-muted-foreground">Followers</span>
              </Link>
              <Link
                href={`/community/following?user=${profile.id}`}
                className="hover:text-mariners-teal transition-colors"
              >
                <span className="font-bold">{profile.following_count || 0}</span>{' '}
                <span className="text-muted-foreground">Following</span>
              </Link>
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Role badge */}
            {profile.role !== 'user' && (
              <Badge
                variant={profile.role === 'admin' ? 'default' : 'secondary'}
                className="mt-3"
              >
                {profile.role}
              </Badge>
            )}

            {/* Bio section */}
            <div className="mt-4">
              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Die-hard Fan, Stats Guru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="mariners" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {profile.bio || (isOwnProfile ? 'No bio yet. Click "Edit Profile" to add one.' : 'No bio available.')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '-' : stats?.predictions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-mariners-teal">
                {loadingStats ? '-' : `${stats?.accuracy || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">Win rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {loadingStats ? '-' : stats?.currentStreak || 0}
                {(stats?.currentStreak || 0) > 0 && <span className="text-lg">🔥</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Best: {stats?.longestStreak || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '-' : stats?.leaderboardRank ? `#${stats.leaderboardRank}` : '--'}
              </div>
              <p className="text-xs text-muted-foreground">Season rank</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '-' : (stats?.leaderboardPoints || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '-' : (stats?.posts || 0) + (stats?.comments || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.posts || 0} posts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Season Pass Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-mariners-gold" />
              2026 Season Pass
            </CardTitle>
            <CardDescription>
              Earn points through predictions and participation to unlock rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeasonPassProgress totalPoints={stats?.leaderboardPoints || 0} />
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-mariners-teal" />
                Badges & Achievements
              </CardTitle>
              <CardDescription>
                {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
              </CardDescription>
            </div>
            <Link href={`/badges?user=${profile.id}`}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
              </div>
            ) : badges.length > 0 ? (
              <BadgeDisplay badges={badges.slice(0, 8)} columns={4} showEarnedDate={false} />
            ) : (
              <BadgeShowcase userId={profile.id} />
            )}
          </CardContent>
        </Card>

        {/* Prediction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-mariners-teal" />
                Prediction History
              </CardTitle>
              <CardDescription>
                Recent predictions and results
              </CardDescription>
            </div>
            <Link href={`/predictions/history?user=${profile.id}`}>
              <Button variant="ghost" size="sm">
                Full History
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
              </div>
            ) : (recentActivity?.predictions?.length || 0) > 0 ? (
              <div className="space-y-3">
                {/* Win/Loss record */}
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{stats?.wins || 0} Wins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">{stats?.losses || 0} Losses</span>
                  </div>
                </div>

                {recentActivity?.predictions?.map(pred => (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        pred.score !== null && pred.score >= 10
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : pred.score !== null
                            ? 'bg-red-100 dark:bg-red-900/20'
                            : 'bg-muted'
                      }`}>
                        {pred.score !== null && pred.score >= 10 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : pred.score !== null ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          vs {pred.game?.opponent || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pred.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {pred.score !== null && (
                      <Badge variant={pred.score >= 10 ? 'default' : 'secondary'}>
                        {pred.score} pts
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No predictions yet</p>
                {isOwnProfile && (
                  <Link href="/predictions">
                    <Button variant="outline" className="mt-4">
                      Make a Prediction
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Forum posts and community engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
              </div>
            ) : (recentActivity?.posts?.length || 0) > 0 ? (
              <div className="space-y-3">
                {recentActivity?.posts?.map(post => (
                  <Link
                    key={post.id}
                    href={`/forum/post/${post.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No forum activity yet</p>
                {isOwnProfile && (
                  <Link href="/forum">
                    <Button variant="outline" className="mt-4">
                      Join the Discussion
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings - Only show for own profile */}
        {isOwnProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-mariners-teal" />
                Notification Settings
              </CardTitle>
              <CardDescription>Manage your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="game-reminders" className="font-medium">
                      Game Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified before Mariners games start
                    </p>
                  </div>
                  <Checkbox
                    id="game-reminders"
                    checked={notificationPrefs.email_game_reminders}
                    onCheckedChange={() => handleNotificationToggle('email_game_reminders')}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="prediction-results" className="font-medium">
                      Prediction Results
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when prediction results are available
                    </p>
                  </div>
                  <Checkbox
                    id="prediction-results"
                    checked={notificationPrefs.email_prediction_results}
                    onCheckedChange={() => handleNotificationToggle('email_prediction_results')}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-digest" className="font-medium">
                      Weekly Digest
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your activity and stats
                    </p>
                  </div>
                  <Checkbox
                    id="weekly-digest"
                    checked={notificationPrefs.email_weekly_digest}
                    onCheckedChange={() => handleNotificationToggle('email_weekly_digest')}
                    disabled={savingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mentions" className="font-medium">
                      Forum Mentions
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you in a post
                    </p>
                  </div>
                  <Checkbox
                    id="mentions"
                    checked={notificationPrefs.email_mentions}
                    onCheckedChange={() => handleNotificationToggle('email_mentions')}
                    disabled={savingNotifications}
                  />
                </div>

                {savingNotifications && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
