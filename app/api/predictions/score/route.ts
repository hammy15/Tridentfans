import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRecentGames, formatGameForDisplay } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Prediction {
  winner: 'mariners' | 'opponent';
  mariners_runs?: number;
  opponent_runs?: number;
  total_runs?: number;
}

interface ActualResult {
  mariners_score: number;
  opponent_score: number;
  winner: 'mariners' | 'opponent';
}

// Calculate score for a prediction
function calculateScore(prediction: Prediction, actual: ActualResult): number {
  let score = 0;

  // Winner prediction: 10 points
  if (prediction.winner === actual.winner) {
    score += 10;
  }

  // Exact Mariners score: 5 points, within 1: 3 points, within 2: 1 point
  if (prediction.mariners_runs !== undefined) {
    const diff = Math.abs(prediction.mariners_runs - actual.mariners_score);
    if (diff === 0) score += 5;
    else if (diff === 1) score += 3;
    else if (diff === 2) score += 1;
  }

  // Exact opponent score: 5 points, within 1: 3 points, within 2: 1 point
  if (prediction.opponent_runs !== undefined) {
    const diff = Math.abs(prediction.opponent_runs - actual.opponent_score);
    if (diff === 0) score += 5;
    else if (diff === 1) score += 3;
    else if (diff === 2) score += 1;
  }

  // Total runs prediction: 3 points exact, 2 points within 1, 1 point within 2
  if (prediction.total_runs !== undefined) {
    const actualTotal = actual.mariners_score + actual.opponent_score;
    const diff = Math.abs(prediction.total_runs - actualTotal);
    if (diff === 0) score += 3;
    else if (diff === 1) score += 2;
    else if (diff <= 2) score += 1;
  }

  return score;
}

// POST - Score all predictions for completed games
export async function POST() {
  try {
    // Get recent completed games from MLB API
    const recentGames = await getRecentGames(3);
    const completedGames = recentGames.filter(g => g.status.abstractGameState === 'Final');

    let totalScored = 0;
    const results = [];

    for (const game of completedGames) {
      const formatted = formatGameForDisplay(game);
      const gameId = game.gamePk.toString();

      // Update game with final result
      const actualResult: ActualResult = {
        mariners_score: formatted.marinersScore || 0,
        opponent_score: formatted.opponentScore || 0,
        winner: formatted.isWin ? 'mariners' : 'opponent',
      };

      await supabase
        .from('prediction_games')
        .update({
          status: 'completed',
          actual_result: actualResult,
        })
        .eq('id', gameId);

      // Get all unscored predictions for this game
      const { data: predictions } = await supabase
        .from('user_predictions')
        .select('*')
        .eq('game_id', gameId)
        .is('score', null);

      if (!predictions || predictions.length === 0) continue;

      // Score each prediction
      for (const pred of predictions) {
        const score = calculateScore(pred.predictions as Prediction, actualResult);

        await supabase.from('user_predictions').update({ score }).eq('id', pred.id);

        totalScored++;
      }

      results.push({
        gameId,
        opponent: formatted.opponent,
        predictionsScored: predictions.length,
      });
    }

    // Update leaderboard
    await updateLeaderboard();

    return NextResponse.json({
      success: true,
      gamesProcessed: completedGames.length,
      predictionsScored: totalScored,
      results,
    });
  } catch (error) {
    console.error('Predictions score error:', error);
    return NextResponse.json({ error: 'Failed to score predictions' }, { status: 500 });
  }
}

// Update the leaderboard based on all scores
async function updateLeaderboard() {
  const season = new Date().getFullYear();

  // Get all users with predictions this season
  const { data: userScores } = await supabase
    .from('user_predictions')
    .select('user_id, score, game:prediction_games!inner(game_date)')
    .not('score', 'is', null)
    .gte('game.game_date', `${season}-01-01`);

  if (!userScores || userScores.length === 0) return;

  // Aggregate by user
  const userAggregates = new Map<
    string,
    { totalPoints: number; totalPredictions: number; correctWinners: number }
  >();

  for (const score of userScores) {
    if (!score.user_id) continue;

    const current = userAggregates.get(score.user_id) || {
      totalPoints: 0,
      totalPredictions: 0,
      correctWinners: 0,
    };

    current.totalPoints += score.score || 0;
    current.totalPredictions += 1;
    if ((score.score || 0) >= 10) current.correctWinners += 1; // At least got winner right

    userAggregates.set(score.user_id, current);
  }

  // Sort by total points and assign ranks
  const sorted = Array.from(userAggregates.entries()).sort(
    (a, b) => b[1].totalPoints - a[1].totalPoints
  );

  // Upsert leaderboard entries
  for (let i = 0; i < sorted.length; i++) {
    const [userId, stats] = sorted[i];
    const accuracy =
      stats.totalPredictions > 0
        ? Math.round((stats.correctWinners / stats.totalPredictions) * 100)
        : 0;

    await supabase.from('prediction_leaderboard').upsert(
      {
        user_id: userId,
        season,
        total_points: stats.totalPoints,
        accuracy,
        rank: i + 1,
      },
      { onConflict: 'user_id,season' }
    );
  }
}
