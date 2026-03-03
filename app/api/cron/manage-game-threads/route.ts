import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMarinersSchedule, formatGameForDisplay } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Manage game thread lifecycle - create before games, close after games
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧵 Managing game thread lifecycle...');

    const results = {
      threads_created: 0,
      threads_closed: 0,
      errors: []
    };

    // 1. Close expired game threads (game ended 3+ hours ago)
    const closedCount = await closeExpiredGameThreads();
    results.threads_closed = closedCount;

    // 2. Create new game threads for upcoming games (2 hours before start)
    const createdCount = await createUpcomingGameThreads();
    results.threads_created = createdCount;

    console.log(`✅ Game thread management complete: ${createdCount} created, ${closedCount} closed`);

    return NextResponse.json({
      success: true,
      message: 'Game thread management complete',
      results
    });

  } catch (error) {
    console.error('Game thread management error:', error);
    return NextResponse.json({ 
      error: 'Game thread management failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function closeExpiredGameThreads(): Promise<number> {
  try {
    // Find game threads that should be closed (game ended 3+ hours ago)
    const cutoffTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredThreads } = await supabase
      .from('forum_posts')
      .select('id, title, game_start_time')
      .eq('is_game_thread', true)
      .eq('is_locked', false)
      .lt('game_start_time', cutoffTime);
    
    if (!expiredThreads?.length) return 0;
    
    // Close the threads with final message
    for (const thread of expiredThreads) {
      // Add final comment
      await supabase
        .from('forum_comments')
        .insert({
          post_id: thread.id,
          content: `**Game Over!** 

Thanks for following along in the game thread. 

**Final Stats:**
- See you next game for another thread!
- Check out post-game reactions in the main forum

**Go M's!** ⚓

*Thread automatically closed by Mark*`,
          author_display_name: 'Mark',
          author_emoji: '⚓',
          user_id: 'system-mark-id'
        });

      // Lock the thread
      await supabase
        .from('forum_posts')
        .update({ 
          is_locked: true, 
          locked_reason: 'Game completed - thread archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', thread.id);
    }
    
    return expiredThreads.length;
  } catch (error) {
    console.error('Error closing expired game threads:', error);
    return 0;
  }
}

async function createUpcomingGameThreads(): Promise<number> {
  try {
    // Get games in the next 4 hours
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    
    const games = await getMarinersSchedule(
      undefined,
      now.toISOString().split('T')[0],
      fourHoursFromNow.toISOString().split('T')[0]
    );
    
    const upcomingGames = games.filter(game => {
      const gameTime = new Date(game.gameDate);
      const twoHoursBefore = new Date(gameTime.getTime() - 2 * 60 * 60 * 1000);
      return now >= twoHoursBefore && now < gameTime;
    });
    
    if (!upcomingGames.length) return 0;
    
    let threadsCreated = 0;
    
    for (const game of upcomingGames) {
      const formatted = formatGameForDisplay(game);
      
      // Check if thread already exists
      const { data: existingThread } = await supabase
        .from('forum_posts')
        .select('id')
        .eq('is_game_thread', true)
        .eq('game_id', game.gamePk.toString())
        .single();
      
      if (existingThread) continue; // Thread already exists
      
      // Create game thread
      const gameDate = new Date(formatted.date);
      const title = `Game Thread: Mariners ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent} - ${gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
      
      const content = generateGameThreadContent(formatted, gameDate);
      
      const { data: newThread, error } = await supabase
        .from('forum_posts')
        .insert({
          title,
          content,
          author_display_name: 'Mark',
          author_emoji: '⚓',
          user_id: 'system-mark-id',
          category: 'Game Threads',
          is_game_thread: true,
          game_id: game.gamePk.toString(),
          game_start_time: gameDate.toISOString(),
          is_pinned: true,
          tags: ['game thread', formatted.opponent.toLowerCase(), 'live']
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating game thread:', error);
        continue;
      }
      
      threadsCreated++;
      console.log(`✅ Created game thread: ${title}`);
    }
    
    return threadsCreated;
    
  } catch (error) {
    console.error('Error creating upcoming game threads:', error);
    return 0;
  }
}

function generateGameThreadContent(formatted: any, gameDate: Date): string {
  const timeStr = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles'
  });

  return `# ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent}
**${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}** | **${timeStr} PT**
${formatted.isHome ? '🏠 T-Mobile Park' : `🛣️ Away Game`}

---

## Pre-Game Setup

**It's Game Day!** 🔥

Time to get this W. Whether you're at the ballpark or following along from home, this is your thread for live reactions, predictions, and celebration.

## Keys to Victory

🎯 **Offense:** Work counts, get good swings on strikes  
⚡ **Defense:** Clean innings, turn two when we can  
🔥 **Pitching:** Attack the zone, trust your stuff  

## Live Discussion

Drop your:
- **Lineup reactions** when it's announced
- **At-bat observations** throughout the game  
- **Hot takes** and predictions as it unfolds
- **Celebrations** when we do good things

---

**Let's get this dub!** 

**Go M's!** ⚓

*This thread will stay live until ~3 hours after the game ends*`;
}

export { closeExpiredGameThreads, createUpcomingGameThreads };