import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - Admin create games for predictions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, games } = body;

    // Verify admin
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: 'Games array required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('prediction_games').insert(games).select();

    if (error) throw error;
    return NextResponse.json({ games: data });
  } catch (error) {
    console.error('Games POST error:', error);
    return NextResponse.json({ error: 'Failed to create games' }, { status: 500 });
  }
}

// PUT - Update game results and score predictions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, gameId, result } = body;

    // Verify admin
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!gameId || !result) {
      return NextResponse.json({ error: 'Missing gameId or result' }, { status: 400 });
    }

    // Update game with result
    const { error: gameError } = await supabase
      .from('prediction_games')
      .update({
        status: 'final',
        actual_result: result,
      })
      .eq('id', gameId);

    if (gameError) throw gameError;

    // Get all predictions for this game
    const { data: predictions, error: predError } = await supabase
      .from('user_predictions')
      .select('*')
      .eq('game_id', gameId);

    if (predError) throw predError;

    // Score each prediction
    const updates =
      predictions?.map(pred => {
        let score = 0;
        const userPred = pred.predictions;

        // Winner correct: 10 points
        const actualWinner = result.mariners_runs > result.opponent_runs ? 'mariners' : 'opponent';
        if (userPred.winner === actualWinner) {
          score += 10;
        }

        // Exact Mariners score: 5 points
        if (userPred.mariners_runs === result.mariners_runs) {
          score += 5;
        }

        // Exact opponent score: 5 points
        if (userPred.opponent_runs === result.opponent_runs) {
          score += 5;
        }

        // Within 1 run for each team: 2 points each
        if (Math.abs(userPred.mariners_runs - result.mariners_runs) === 1) {
          score += 2;
        }
        if (Math.abs(userPred.opponent_runs - result.opponent_runs) === 1) {
          score += 2;
        }

        return {
          id: pred.id,
          score,
        };
      }) || [];

    // Update all prediction scores
    for (const update of updates) {
      await supabase.from('user_predictions').update({ score: update.score }).eq('id', update.id);
    }

    // Update leaderboard
    const season = new Date().getFullYear();
    for (const pred of predictions || []) {
      const score = updates.find(u => u.id === pred.id)?.score || 0;

      // Get current leaderboard entry
      const { data: existing } = await supabase
        .from('prediction_leaderboard')
        .select('*')
        .eq('user_id', pred.user_id)
        .eq('season', season)
        .single();

      if (existing) {
        // Update existing
        const newTotal = existing.total_points + score;
        const predCount =
          (predictions?.filter(p => p.user_id === pred.user_id).length || 0) +
          (existing.predictions_count || 0);
        const correctCount = (score >= 10 ? 1 : 0) + (existing.correct_count || 0);
        await supabase
          .from('prediction_leaderboard')
          .update({
            total_points: newTotal,
            accuracy: Math.round((correctCount / predCount) * 100),
          })
          .eq('user_id', pred.user_id)
          .eq('season', season);
      } else {
        // Create new
        await supabase.from('prediction_leaderboard').insert({
          user_id: pred.user_id,
          season,
          total_points: score,
          accuracy: score >= 10 ? 100 : 0,
          rank: 9999, // Will be recalculated
        });
      }
    }

    // Recalculate ranks
    const { data: allEntries } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .eq('season', season)
      .order('total_points', { ascending: false });

    for (let i = 0; i < (allEntries?.length || 0); i++) {
      await supabase
        .from('prediction_leaderboard')
        .update({ rank: i + 1 })
        .eq('user_id', allEntries![i].user_id)
        .eq('season', season);
    }

    return NextResponse.json({ success: true, scored: updates.length });
  } catch (error) {
    console.error('Games PUT error:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}
