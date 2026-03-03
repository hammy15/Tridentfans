import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUpcomingGames, formatGameForDisplay } from '@/lib/mlb-api';
import { sendBroadcastNotification } from '@/lib/push-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This endpoint is called by Vercel Cron daily at 8 AM PT
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow if no secret configured (development)
      if (process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get upcoming games (next 2 days)
    const upcomingGames = await getUpcomingGames(2);

    if (upcomingGames.length === 0) {
      return NextResponse.json({ message: 'No upcoming games', created: 0 });
    }

    // Check which games already have threads
    const gameIds = upcomingGames.map(g => g.gamePk);
    const { data: existingThreads } = await supabase
      .from('forum_posts')
      .select('mlb_game_id')
      .in('mlb_game_id', gameIds)
      .eq('is_game_thread', true);

    const existingGameIds = new Set(existingThreads?.map(t => t.mlb_game_id) || []);

    // Get Game Day category
    const { data: category } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', 'game-day')
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Game Day category not found' }, { status: 500 });
    }

    let created = 0;

    // Create threads for games that don't have one
    for (const game of upcomingGames) {
      if (existingGameIds.has(game.gamePk)) continue;

      const formatted = formatGameForDisplay(game);
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

      const { error } = await supabase.from('forum_posts').insert({
        category_id: category.id,
        user_id: null,
        title,
        content,
        is_pinned: true,
        is_game_thread: true,
        mlb_game_id: game.gamePk,
      });

      if (!error) {
        created++;
        // Notify subscribers about game day
        try {
          await sendBroadcastNotification({
            title: `Game Day: ${title}`,
            body: 'Game thread is live. Make your predictions!',
            icon: '/icons/icon-192x192.png',
            data: { url: '/predictions' },
          });
        } catch {
          // Best effort
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} game threads`,
      created,
    });
  } catch (error) {
    console.error('Cron game-threads error:', error);
    return NextResponse.json({ error: 'Failed to create game threads' }, { status: 500 });
  }
}
