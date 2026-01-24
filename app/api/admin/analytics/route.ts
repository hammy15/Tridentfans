import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      usersResult,
      newUsersResult,
      postsResult,
      commentsResult,
      recentPostsResult,
      predictionsResult,
      gamesResult,
      conversationsResult,
      recentConversationsResult,
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      // New users this week
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      // Total posts
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
      // Total comments
      supabase.from('forum_comments').select('id', { count: 'exact', head: true }),
      // Posts this week
      supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
      // Total predictions
      supabase.from('user_predictions').select('id', { count: 'exact', head: true }),
      // Games with predictions
      supabase.from('prediction_games').select('id', { count: 'exact', head: true }),
      // Total bot conversations
      supabase.from('bot_conversations').select('id', { count: 'exact', head: true }),
      // Conversations this week
      supabase
        .from('bot_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),
    ]);

    // Get most popular bot
    const { data: botStats } = await supabase.from('bot_conversations').select('bot_id').limit(100);

    let mostPopularBot = 'Moose';
    if (botStats && botStats.length > 0) {
      const botCounts: Record<string, number> = {};
      botStats.forEach(c => {
        botCounts[c.bot_id] = (botCounts[c.bot_id] || 0) + 1;
      });
      const sorted = Object.entries(botCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const botId = sorted[0][0];
        mostPopularBot =
          botId === 'moose' ? 'Moose' : botId === 'captain_hammy' ? 'Captain Hammy' : 'Spartan';
      }
    }

    const totalUsers = usersResult.count || 0;
    const totalPredictions = predictionsResult.count || 0;
    const totalGames = gamesResult.count || 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersResult.count || 0,
        activeToday: 0, // Would need session tracking
      },
      forum: {
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        postsThisWeek: recentPostsResult.count || 0,
      },
      predictions: {
        totalPredictions,
        gamesWithPredictions: totalGames,
        avgPredictionsPerGame: totalGames > 0 ? totalPredictions / totalGames : 0,
      },
      bots: {
        totalConversations: conversationsResult.count || 0,
        conversationsThisWeek: recentConversationsResult.count || 0,
        mostPopularBot,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        users: { total: 0, newThisWeek: 0, activeToday: 0 },
        forum: { totalPosts: 0, totalComments: 0, postsThisWeek: 0 },
        predictions: { totalPredictions: 0, gamesWithPredictions: 0, avgPredictionsPerGame: 0 },
        bots: { totalConversations: 0, conversationsThisWeek: 0, mostPopularBot: 'Moose' },
      },
      { status: 200 }
    );
  }
}
