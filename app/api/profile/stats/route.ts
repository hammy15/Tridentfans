import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get user profile stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get forum stats
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: commentCount } = await supabase
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get prediction stats
    const { data: predictions } = await supabase
      .from('user_predictions')
      .select('score')
      .eq('user_id', userId);

    const predictionCount = predictions?.length || 0;
    const scoredPredictions = predictions?.filter(p => p.score !== null) || [];
    const correctPredictions = scoredPredictions.filter(p => (p.score || 0) >= 10).length;
    const accuracy = scoredPredictions.length > 0
      ? Math.round((correctPredictions / scoredPredictions.length) * 100)
      : 0;

    // Get leaderboard position
    const { data: leaderboardEntry } = await supabase
      .from('prediction_leaderboard')
      .select('rank, total_points')
      .eq('user_id', userId)
      .single();

    // Get streak data
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single();

    // Calculate wins and losses
    const wins = scoredPredictions.filter(p => (p.score || 0) >= 10).length;
    const losses = scoredPredictions.filter(p => p.score !== null && (p.score || 0) < 10).length;

    // Get badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    // Get donation stats
    const { data: donations } = await supabase
      .from('donations')
      .select('amount_cents')
      .eq('user_id', userId)
      .eq('status', 'completed');

    const totalDonated = donations?.reduce((sum, d) => sum + d.amount_cents, 0) || 0;

    // Get bot conversation count
    const { count: conversationCount } = await supabase
      .from('bot_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent activity
    const { data: recentPosts } = await supabase
      .from('forum_posts')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentPredictions } = await supabase
      .from('user_predictions')
      .select('id, game:prediction_games(opponent, game_date), score, submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      profile,
      stats: {
        posts: postCount || 0,
        comments: commentCount || 0,
        predictions: predictionCount,
        accuracy,
        leaderboardRank: leaderboardEntry?.rank || null,
        leaderboardPoints: leaderboardEntry?.total_points || 0,
        badges: badges?.length || 0,
        totalDonated,
        conversations: conversationCount || 0,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        wins,
        losses,
      },
      badges: badges || [],
      recentActivity: {
        posts: recentPosts || [],
        predictions: recentPredictions || [],
      },
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile stats' }, { status: 500 });
  }
}
