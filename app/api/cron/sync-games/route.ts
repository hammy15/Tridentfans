import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUpcomingGames, getRecentGames, formatGameForDisplay, MLBGame } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// This endpoint is called by Vercel Cron daily at 8 AM PT
// Syncs upcoming games and updates completed game results
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get upcoming games (next 14 days)
    const upcomingGames = await getUpcomingGames(14);

    // Get recent games (past 3 days) to update final scores
    const recentGames = await getRecentGames(3);

    const allGames = [...upcomingGames, ...recentGames];

    if (allGames.length === 0) {
      return NextResponse.json({ message: 'No games to sync', synced: 0 });
    }

    const upsertData = allGames.map((game: MLBGame) => {
      const formatted = formatGameForDisplay(game);
      const gameDate = new Date(game.gameDate);

      return {
        id: game.gamePk.toString(),
        game_date: gameDate.toISOString().split('T')[0],
        opponent: formatted.opponent,
        game_time: gameDate.toTimeString().slice(0, 5),
        is_home: formatted.isHome,
        venue: formatted.venue,
        status: game.status.abstractGameState === 'Final' ? 'completed' : 'scheduled',
        actual_result:
          game.status.abstractGameState === 'Final'
            ? {
                mariners_score: formatted.marinersScore,
                opponent_score: formatted.opponentScore,
                winner: formatted.isWin ? 'mariners' : 'opponent',
              }
            : null,
      };
    });

    // Upsert games (insert or update if exists)
    const { data, error } = await supabase
      .from('prediction_games')
      .upsert(upsertData, { onConflict: 'id' })
      .select();

    if (error) throw error;

    // Count new vs updated
    const synced = data?.length || 0;

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} games`,
      synced,
      upcoming: upcomingGames.length,
      recent: recentGames.length,
    });
  } catch (error) {
    console.error('Cron sync-games error:', error);
    return NextResponse.json({ error: 'Failed to sync games' }, { status: 500 });
  }
}
