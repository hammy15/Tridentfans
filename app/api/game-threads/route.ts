import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUpcomingGames, formatGameForDisplay } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// System user ID for auto-created posts (Moose bot)
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || null;

// GET - Check upcoming games that need threads
export async function GET() {
  try {
    const upcomingGames = await getUpcomingGames(2);

    // Check which games already have threads
    const gameIds = upcomingGames.map(g => g.gamePk);
    const { data: existingThreads } = await supabase
      .from('forum_posts')
      .select('mlb_game_id')
      .in('mlb_game_id', gameIds)
      .eq('is_game_thread', true);

    const existingGameIds = new Set(existingThreads?.map(t => t.mlb_game_id) || []);

    const gamesNeedingThreads = upcomingGames
      .filter(g => !existingGameIds.has(g.gamePk))
      .map(formatGameForDisplay);

    return NextResponse.json({
      upcoming: gamesNeedingThreads,
      existing: existingThreads?.length || 0,
    });
  } catch (error) {
    console.error('Game threads GET error:', error);
    return NextResponse.json({ error: 'Failed to check game threads' }, { status: 500 });
  }
}

// POST - Create game day thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gamePk, password } = body;

    // Admin auth or cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get game details
    const upcomingGames = await getUpcomingGames(2);
    const game = upcomingGames.find(g => g.gamePk === gamePk);

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const formatted = formatGameForDisplay(game);

    // Check if thread already exists
    const { data: existing } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('mlb_game_id', gamePk)
      .eq('is_game_thread', true)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Thread already exists', postId: existing.id }, { status: 409 });
    }

    // Get Game Day category
    const { data: category } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', 'game-day')
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Game Day category not found' }, { status: 500 });
    }

    // Format date and time
    const gameDate = new Date(formatted.date);
    const dateStr = gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const title = `Game Thread: Mariners ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent} - ${dateStr}`;

    const content = `# ${formatted.isHome ? '🏠' : '✈️'} Mariners ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent}

**Date:** ${dateStr}
**Time:** ${timeStr}
**Venue:** ${formatted.venue}

---

## Pre-Game Discussion

Share your predictions, lineup thoughts, and get hyped for the game!

### Quick Links
- [Make your predictions](/predictions)
- [View roster](/roster)

---

*This thread was automatically created. Go Mariners!* ⚾🔱`;

    // Create the post
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        category_id: category.id,
        user_id: SYSTEM_USER_ID,
        title,
        content,
        is_pinned: true,
        is_game_thread: true,
        mlb_game_id: gamePk,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Game threads POST error:', error);
    return NextResponse.json({ error: 'Failed to create game thread' }, { status: 500 });
  }
}
