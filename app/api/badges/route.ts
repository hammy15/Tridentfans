import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Badge definitions
const BADGE_DEFINITIONS = {
  // Prediction badges
  prediction_first: {
    name: 'First Prediction',
    description: 'Made your first game prediction',
    icon: '🎯',
  },
  prediction_streak_3: {
    name: 'Hot Streak',
    description: 'Won 3 predictions in a row',
    icon: '🔥',
  },
  prediction_streak_5: {
    name: 'On Fire',
    description: 'Won 5 predictions in a row',
    icon: '💥',
  },
  prediction_perfect: {
    name: 'Perfect Game',
    description: 'Got 100% on a game prediction',
    icon: '💯',
  },
  prediction_top_10: {
    name: 'Top 10',
    description: 'Reached top 10 on the leaderboard',
    icon: '🏆',
  },

  // Forum badges
  forum_first_post: {
    name: 'First Post',
    description: 'Created your first forum post',
    icon: '📝',
  },
  forum_10_posts: {
    name: 'Regular',
    description: 'Created 10 forum posts',
    icon: '💬',
  },
  forum_50_posts: {
    name: 'Prolific',
    description: 'Created 50 forum posts',
    icon: '📚',
  },
  forum_popular: {
    name: 'Popular',
    description: 'Got 10 upvotes on a single post',
    icon: '⭐',
  },
  forum_viral: {
    name: 'Viral',
    description: 'Got 50 upvotes on a single post',
    icon: '🚀',
  },

  // Engagement badges
  early_adopter: {
    name: 'Early Adopter',
    description: 'Joined TridentFans early',
    icon: '🌟',
  },
  super_fan: {
    name: 'Super Fan',
    description: 'Active for 30 consecutive days',
    icon: '🔱',
  },
  conversation_starter: {
    name: 'Conversation Starter',
    description: 'Started 5 bot conversations',
    icon: '🤖',
  },

  // Special badges
  mariners_expert: {
    name: 'Mariners Expert',
    description: 'Demonstrated deep Mariners knowledge',
    icon: '🧠',
  },
  game_day_regular: {
    name: 'Game Day Regular',
    description: 'Participated in 10 game day threads',
    icon: '🏟️',
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

    const { data: badges, error } = await supabase
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

// POST - Award badge (admin only or system)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, badgeType, password } = body;

    // Auth check
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badgeDef = BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS];
    if (!badgeDef) {
      return NextResponse.json({ error: 'Invalid badge type' }, { status: 400 });
    }

    // Check if user already has this badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User already has this badge' }, { status: 409 });
    }

    const { data: badge, error } = await supabase
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

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    console.error('Badges POST error:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}
