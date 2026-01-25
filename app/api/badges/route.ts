import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Badge definitions with categories
const BADGE_DEFINITIONS = {
  // Donation badges (awarded via webhook)
  bronze_slugger: {
    name: 'Bronze Slugger',
    description: 'Supported TridentFans with a donation',
    icon: '🥉',
    category: 'supporter',
  },
  silver_slugger: {
    name: 'Silver Slugger',
    description: 'Generous supporter of TridentFans',
    icon: '🥈',
    category: 'supporter',
  },
  gold_slugger: {
    name: 'Gold Slugger',
    description: 'Champion supporter of TridentFans',
    icon: '🥇',
    category: 'supporter',
  },
  superfan_supporter: {
    name: 'Superfan Supporter',
    description: 'Donated $50+ to TridentFans',
    icon: '⭐',
    category: 'supporter',
  },
  legend_supporter: {
    name: 'Legend Supporter',
    description: 'Donated $100+ to TridentFans',
    icon: '🏆',
    category: 'supporter',
  },

  // Prediction badges
  prediction_first: {
    name: 'Crystal Ball',
    description: 'Made your first game prediction',
    icon: '🔮',
    category: 'predictions',
  },
  prediction_streak_5: {
    name: 'On Fire',
    description: 'Won 5 predictions in a row',
    icon: '🔥',
    category: 'predictions',
  },
  prediction_master: {
    name: 'Prediction Master',
    description: '75% accuracy over 20+ predictions',
    icon: '🎯',
    category: 'predictions',
  },
  prediction_top_10: {
    name: 'Top 10',
    description: 'Reached top 10 on the leaderboard',
    icon: '🏅',
    category: 'predictions',
  },
  leaderboard_champion: {
    name: 'Leaderboard Champion',
    description: 'Finished #1 on the weekly leaderboard',
    icon: '👑',
    category: 'predictions',
  },

  // Forum badges
  forum_first_post: {
    name: 'First Post',
    description: 'Created your first forum post',
    icon: '✍️',
    category: 'activity',
  },
  forum_10_posts: {
    name: 'Conversation Starter',
    description: 'Created 10 forum posts',
    icon: '💬',
    category: 'activity',
  },
  forum_50_posts: {
    name: 'Community Voice',
    description: 'Created 50 forum posts',
    icon: '📣',
    category: 'activity',
  },
  first_comment: {
    name: 'First Comment',
    description: 'Left your first comment',
    icon: '💭',
    category: 'activity',
  },
  active_commenter: {
    name: 'Active Commenter',
    description: 'Left 25 comments',
    icon: '🗣️',
    category: 'activity',
  },

  // Special badges
  og_member: {
    name: 'OG Member',
    description: 'Joined TridentFans in the first month',
    icon: '🔱',
    category: 'special',
  },
  bot_buddy: {
    name: 'Bot Buddy',
    description: 'Had 10 conversations with the bots',
    icon: '🤖',
    category: 'special',
  },
  mariners_expert: {
    name: 'Mariners Expert',
    description: 'Demonstrated deep Mariners knowledge',
    icon: '🧠',
    category: 'special',
  },
  game_day_regular: {
    name: 'Game Day Regular',
    description: 'Participated in 10 game day threads',
    icon: '🏟️',
    category: 'special',
  },
};

// GET - Get user badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return badge definitions
      return NextResponse.json({ definitions: BADGE_DEFINITIONS });
    }

    const { data: badges, error } = await getSupabase()
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ badges: badges || [] });
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

// POST - Check and award badges automatically for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, badgeType, password } = body;

    // If specific badge award with password (admin action)
    if (badgeType && password) {
      if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
      if (!badgeDef) {
        return NextResponse.json({ error: 'Invalid badge type' }, { status: 400 });
      }

      const result = await awardBadge(userId, badgeType);
      return NextResponse.json(result);
    }

    // Auto-check badges for user
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const awardedBadges: string[] = [];

    // Get existing badges
    const { data: existingBadges } = await getSupabase()
      .from('user_badges')
      .select('badge_type')
      .eq('user_id', userId);

    const hasBadge = (type: string) => existingBadges?.some(b => b.badge_type === type);

    // Check forum posts
    const { count: postCount } = await getSupabase()
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (postCount && postCount >= 1 && !hasBadge('forum_first_post')) {
      await awardBadge(userId, 'forum_first_post');
      awardedBadges.push('forum_first_post');
    }
    if (postCount && postCount >= 10 && !hasBadge('forum_10_posts')) {
      await awardBadge(userId, 'forum_10_posts');
      awardedBadges.push('forum_10_posts');
    }
    if (postCount && postCount >= 50 && !hasBadge('forum_50_posts')) {
      await awardBadge(userId, 'forum_50_posts');
      awardedBadges.push('forum_50_posts');
    }

    // Check comments
    const { count: commentCount } = await getSupabase()
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (commentCount && commentCount >= 1 && !hasBadge('first_comment')) {
      await awardBadge(userId, 'first_comment');
      awardedBadges.push('first_comment');
    }
    if (commentCount && commentCount >= 25 && !hasBadge('active_commenter')) {
      await awardBadge(userId, 'active_commenter');
      awardedBadges.push('active_commenter');
    }

    // Check predictions
    const { count: predictionCount } = await getSupabase()
      .from('user_predictions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (predictionCount && predictionCount >= 1 && !hasBadge('prediction_first')) {
      await awardBadge(userId, 'prediction_first');
      awardedBadges.push('prediction_first');
    }

    // Check prediction accuracy
    const { data: predictions } = await getSupabase()
      .from('user_predictions')
      .select('score')
      .eq('user_id', userId)
      .not('score', 'is', null);

    if (predictions && predictions.length >= 20) {
      const correctPredictions = predictions.filter(p => (p.score || 0) >= 10).length;
      const accuracy = correctPredictions / predictions.length;
      if (accuracy >= 0.75 && !hasBadge('prediction_master')) {
        await awardBadge(userId, 'prediction_master');
        awardedBadges.push('prediction_master');
      }
    }

    // Check leaderboard
    const { data: leaderboardEntry } = await getSupabase()
      .from('prediction_leaderboard')
      .select('rank')
      .eq('user_id', userId)
      .single();

    if (leaderboardEntry?.rank && leaderboardEntry.rank <= 10 && !hasBadge('prediction_top_10')) {
      await awardBadge(userId, 'prediction_top_10');
      awardedBadges.push('prediction_top_10');
    }
    if (leaderboardEntry?.rank === 1 && !hasBadge('leaderboard_champion')) {
      await awardBadge(userId, 'leaderboard_champion');
      awardedBadges.push('leaderboard_champion');
    }

    // Check bot conversations
    const { count: conversationCount } = await getSupabase()
      .from('bot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (conversationCount && conversationCount >= 10 && !hasBadge('bot_buddy')) {
      await awardBadge(userId, 'bot_buddy');
      awardedBadges.push('bot_buddy');
    }

    // Check OG member (joined before Feb 2026)
    const { data: profile } = await getSupabase()
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (profile?.created_at) {
      const joinDate = new Date(profile.created_at);
      const cutoffDate = new Date('2026-02-01');
      if (joinDate < cutoffDate && !hasBadge('og_member')) {
        await awardBadge(userId, 'og_member');
        awardedBadges.push('og_member');
      }
    }

    return NextResponse.json({
      success: true,
      awarded: awardedBadges,
      message: awardedBadges.length > 0 ? `Awarded ${awardedBadges.length} badge(s)!` : 'No new badges',
    });
  } catch (error) {
    console.error('Badges POST error:', error);
    return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}

async function awardBadge(userId: string, badgeType: string) {
  const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
  if (!badgeDef) return { error: 'Invalid badge type' };

  // Check if already has badge
  const { data: existing } = await getSupabase()
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_type', badgeType)
    .single();

  if (existing) return { alreadyHas: true };

  const { data: badge, error } = await getSupabase()
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_type: badgeType,
      badge_name: badgeDef.name,
      badge_description: badgeDef.description,
      badge_icon: badgeDef.icon,
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, badge };
}
