import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Get email subscribers list for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Note: In production, add admin authentication check here

    // Get all email preferences with user profile info
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select(`
        user_id,
        weekly_digest,
        digest_day,
        email_verified,
        include_predictions,
        include_leaderboard,
        include_forum,
        include_news,
        include_upcoming_games,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Email Subscribers] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // Get profile info for each user
    const userIds = preferences?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    // Merge preferences with profile info
    const subscribers = preferences?.map(pref => {
      const profile = profiles?.find(p => p.id === pref.user_id);
      return {
        ...pref,
        username: profile?.username || 'Unknown',
        display_name: profile?.display_name,
      };
    });

    return NextResponse.json({
      subscribers,
      total: subscribers?.length || 0,
      subscribed: subscribers?.filter(s => s.weekly_digest).length || 0,
      verified: subscribers?.filter(s => s.email_verified).length || 0,
    });
  } catch (error) {
    console.error('[Admin Email Subscribers] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}
