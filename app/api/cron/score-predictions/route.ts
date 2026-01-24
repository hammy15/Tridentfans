import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// This endpoint is called by Vercel Cron daily at 6 AM PT
// Scores predictions for completed games
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get completed games with unscored predictions
    const { data: completedGames } = await supabase
      .from('prediction_games')
      .select('id, actual_result')
      .eq('status', 'completed')
      .not('actual_result', 'is', null);

    if (!completedGames || completedGames.length === 0) {
      return NextResponse.json({ message: 'No completed games to score', scored: 0 });
    }

    let totalScored = 0;
    const results = [];

    for (const game of completedGames) {
      const actualResult = game.actual_result as ActualResult;
      if (!actualResult) continue;

      // Get unscored user predictions for this game
      const { data: predictions } = await supabase
        .from('user_predictions')
        .select('id, predictions, user_id')
        .eq('game_id', game.id)
        .is('score', null);

      if (!predictions || predictions.length === 0) continue;

      // Score each prediction
      for (const pred of predictions) {
        const score = calculateScore(pred.predictions as Prediction, actualResult);

        await supabase
          .from('user_predictions')
          .update({ score })
          .eq('id', pred.id);

        totalScored++;
      }

      // Also score bot predictions
      const { data: botPredictions } = await supabase
        .from('bot_predictions')
        .select('id, predictions')
        .eq('game_id', game.id)
        .is('score', null);

      for (const botPred of botPredictions || []) {
        const score = calculateScore(botPred.predictions as Prediction, actualResult);

        await supabase
          .from('bot_predictions')
          .update({ score })
          .eq('id', botPred.id);
      }

      results.push({
        gameId: game.id,
        predictionsScored: predictions.length,
        botPredictionsScored: botPredictions?.length || 0,
      });
    }

    // Update leaderboard
    await updateLeaderboard();
    await updateBotLeaderboard();

    return NextResponse.json({
      success: true,
      message: `Scored ${totalScored} predictions`,
      scored: totalScored,
      games: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron score-predictions error:', error);
    return NextResponse.json({ error: 'Failed to score predictions' }, { status: 500 });
  }
}

// Update user leaderboard
async function updateLeaderboard() {
  const season = new Date().getFullYear();

  const { data: userScores } = await supabase
    .from('user_predictions')
    .select('user_id, score')
    .not('score', 'is', null)
    .not('user_id', 'is', null);

  if (!userScores || userScores.length === 0) return;

  // Aggregate by user
  const userAggregates = new Map<string, { totalPoints: number; totalPredictions: number; correctWinners: number }>();

  for (const score of userScores) {
    if (!score.user_id) continue;

    const current = userAggregates.get(score.user_id) || {
      totalPoints: 0,
      totalPredictions: 0,
      correctWinners: 0,
    };

    current.totalPoints += score.score || 0;
    current.totalPredictions += 1;
    if ((score.score || 0) >= 10) current.correctWinners += 1;

    userAggregates.set(score.user_id, current);
  }

  // Sort and assign ranks
  const sorted = Array.from(userAggregates.entries()).sort(
    (a, b) => b[1].totalPoints - a[1].totalPoints
  );

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

// Update bot leaderboard
async function updateBotLeaderboard() {
  const { data: botScores } = await supabase
    .from('bot_predictions')
    .select('bot_id, score')
    .not('score', 'is', null);

  if (!botScores || botScores.length === 0) return;

  // Aggregate by bot
  const botAggregates = new Map<string, { totalPoints: number; totalPredictions: number; correctWinners: number }>();

  for (const score of botScores) {
    const current = botAggregates.get(score.bot_id) || {
      totalPoints: 0,
      totalPredictions: 0,
      correctWinners: 0,
    };

    current.totalPoints += score.score || 0;
    current.totalPredictions += 1;
    if ((score.score || 0) >= 10) current.correctWinners += 1;

    botAggregates.set(score.bot_id, current);
  }

  // Update bot leaderboard table
  for (const [botId, stats] of botAggregates) {
    const accuracy =
      stats.totalPredictions > 0
        ? Math.round((stats.correctWinners / stats.totalPredictions) * 100)
        : 0;

    await supabase.from('bot_leaderboard').upsert(
      {
        bot_id: botId,
        total_points: stats.totalPoints,
        total_predictions: stats.totalPredictions,
        accuracy,
      },
      { onConflict: 'bot_id' }
    );
  }
}
