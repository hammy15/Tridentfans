import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUpcomingGames, formatGameForDisplay, MLBGame } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sync upcoming Mariners games to prediction_games table
export async function POST() {
  try {
    const games = await getUpcomingGames(14); // Get next 2 weeks

    const upsertData = games.map((game: MLBGame) => {
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

    return NextResponse.json({
      success: true,
      synced: data?.length || 0,
      games: data,
    });
  } catch (error) {
    console.error('Predictions sync error:', error);
    return NextResponse.json({ error: 'Failed to sync games' }, { status: 500 });
  }
}

// GET - Check sync status
export async function GET() {
  try {
    const { data: games, error } = await supabase
      .from('prediction_games')
      .select('*')
      .order('game_date')
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      totalGames: games?.length || 0,
      games,
    });
  } catch (error) {
    console.error('Predictions sync GET error:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}
