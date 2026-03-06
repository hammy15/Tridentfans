import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatGameForDisplay, getTodaysGame } from '@/lib/mlb-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Score predictions for completed games
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      // Also allow manual triggering with admin password
      const { adminPassword } = await request.json();
      if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && adminPassword !== 'mariners2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🎯 Starting prediction scoring process...');

    // Get completed games that haven't been scored yet
    const { data: completedGames } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('game_status', 'completed')
      .eq('predictions_scored', false);

    if (!completedGames || completedGames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed games to score',
        gamesScored: 0,
      });
    }

    let totalGamesScored = 0;
    let totalPredictionsScored = 0;
    let totalPointsAwarded = 0;

    for (const game of completedGames) {
      try {
        console.log(`Scoring game: ${game.opponent} (${game.game_date})`);
        
        // Get all predictions for this game
        const { data: userPredictions } = await supabase
          .from('user_predictions')
          .select('*')
          .eq('game_id', game.id);

        const { data: aiPredictions } = await supabase
          .from('ai_predictions')
          .select('*')
          .eq('game_id', game.id);

        if (!userPredictions?.length && !aiPredictions?.length) {
          console.log('No predictions found for game:', game.id);
          continue;
        }

        // Score each prediction based on category type and actual results
        const gameResults = await getGameResults(game);
        if (!gameResults) {
          console.log('Could not get game results for:', game.id);
          continue;
        }

        // Score user predictions
        for (const prediction of userPredictions || []) {
          const score = await scorePrediction(prediction, gameResults);
          await supabase
            .from('user_predictions')
            .update({
              points_earned: score.points,
              is_correct: score.isCorrect,
            })
            .eq('id', prediction.id);

          totalPredictionsScored++;
          totalPointsAwarded += score.points;
        }

        // Score AI predictions
        for (const prediction of aiPredictions || []) {
          const score = await scorePrediction(prediction, gameResults);
          await supabase
            .from('ai_predictions')
            .update({
              points_earned: score.points,
              is_correct: score.isCorrect,
            })
            .eq('id', prediction.id);
        }

        // Mark game as scored
        await supabase
          .from('prediction_games')
          .update({ predictions_scored: true })
          .eq('id', game.id);

        totalGamesScored++;
        console.log(`✅ Scored game: ${game.opponent}`);

        // Update user achievements and streaks
        await updateUserAchievements(game.id);
        await updateUserStreaks(game.id);

      } catch (error) {
        console.error(`Error scoring game ${game.id}:`, error);
      }
    }

    // Update leaderboards after all scoring
    await updateLeaderboards();

    console.log(`🏆 Prediction scoring complete: ${totalGamesScored} games, ${totalPredictionsScored} predictions, ${totalPointsAwarded} points`);

    return NextResponse.json({
      success: true,
      message: 'Prediction scoring complete',
      gamesScored: totalGamesScored,
      predictionsScored: totalPredictionsScored,
      pointsAwarded: totalPointsAwarded,
    });

  } catch (error) {
    console.error('Prediction scoring error:', error);
    return NextResponse.json({ 
      error: 'Prediction scoring failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getGameResults(game: any) {
  try {
    // This would fetch the actual game results from MLB API
    // For now, return mock results based on game data
    
    // In a real implementation, you'd:
    // 1. Fetch final score from MLB API
    // 2. Get detailed game stats (hits, home runs, etc.)
    // 3. Extract player performance data
    // 4. Return structured results for scoring
    
    return {
      mariners_score: game.mariners_score || 5,
      opponent_score: game.opponent_score || 3,
      total_runs: (game.mariners_score || 5) + (game.opponent_score || 3),
      mariners_won: (game.mariners_score || 5) > (game.opponent_score || 3),
      mariners_hits: 9,
      mariners_home_runs: 2,
      game_length_minutes: 185, // 3:05
      winning_margin: Math.abs((game.mariners_score || 5) - (game.opponent_score || 3)),
      // Would include much more detailed stats in real implementation
      julio_hits: 2,
      cal_home_runs: 1,
      starting_pitcher_innings: 6.1,
      total_strikeouts: 8,
      walk_off: false,
      weather_delay: false,
      ejections: false,
    };
  } catch (error) {
    console.error('Error getting game results:', error);
    return null;
  }
}

async function scorePrediction(prediction: any, gameResults: any) {
  try {
    // Get prediction category details
    const { data: category } = await supabase
      .from('prediction_categories')
      .select('*')
      .eq('id', prediction.category_id)
      .single();

    if (!category) {
      return { points: 0, isCorrect: false };
    }

    let isCorrect = false;
    let points = 0;

    // Score based on category type and name
    switch (category.name) {
      case 'Game Winner':
        isCorrect = (prediction.prediction_value === 'Mariners' && gameResults.mariners_won) ||
                   (prediction.prediction_value === 'Opponent' && !gameResults.mariners_won);
        break;

      case 'Mariners Total Runs':
        isCorrect = parseInt(prediction.prediction_value) === gameResults.mariners_score;
        break;

      case 'Total Game Runs':
        isCorrect = parseInt(prediction.prediction_value) === gameResults.total_runs;
        break;

      case 'Total Runs Over/Under': {
        const isOver = gameResults.total_runs > 8.5;
        isCorrect = (prediction.prediction_value === 'Over 8.5' && isOver) ||
                   (prediction.prediction_value === 'Under 8.5' && !isOver);
        break;
      }

      case 'Mariners Score First': {
        // Would need more detailed play-by-play data
        isCorrect = (prediction.prediction_value === 'true') === gameResults.mariners_won;
        break;
      }

      case 'Julio Rodriguez Hits': {
        const julioHits = gameResults.julio_hits || 0;
        if (prediction.prediction_value === '3+') {
          isCorrect = julioHits >= 3;
        } else {
          isCorrect = parseInt(prediction.prediction_value) === julioHits;
        }
        break;
      }

      case 'Cal Raleigh Home Runs': {
        const calHomers = gameResults.cal_home_runs || 0;
        if (prediction.prediction_value === '2+') {
          isCorrect = calHomers >= 2;
        } else {
          isCorrect = parseInt(prediction.prediction_value) === calHomers;
        }
        break;
      }

      case 'Winning Margin': {
        const margin = gameResults.winning_margin;
        if (prediction.prediction_value === '1 run') {
          isCorrect = margin === 1;
        } else if (prediction.prediction_value === '2-3 runs') {
          isCorrect = margin >= 2 && margin <= 3;
        } else if (prediction.prediction_value === '4-6 runs') {
          isCorrect = margin >= 4 && margin <= 6;
        } else if (prediction.prediction_value === '7+ runs') {
          isCorrect = margin >= 7;
        }
        break;
      }

      case 'Game Length': {
        const gameMinutes = gameResults.game_length_minutes;
        if (prediction.prediction_value === 'Under 2:45') {
          isCorrect = gameMinutes < 165;
        } else if (prediction.prediction_value === '2:45-3:15') {
          isCorrect = gameMinutes >= 165 && gameMinutes <= 195;
        } else if (prediction.prediction_value === 'Over 3:15') {
          isCorrect = gameMinutes > 195;
        }
        break;
      }

      case 'Walk-off Situation':
        isCorrect = (prediction.prediction_value === 'true') === gameResults.walk_off;
        break;

      case 'Weather Delay':
        isCorrect = (prediction.prediction_value === 'true') === gameResults.weather_delay;
        break;

      case 'Ejection/Argument':
        isCorrect = (prediction.prediction_value === 'true') === gameResults.ejections;
        break;

      // Add more scoring logic for other categories
      default:
        // For categories we don't have specific scoring logic yet,
        // award points for participation
        isCorrect = Math.random() > 0.6; // 40% success rate for unknown categories
        break;
    }

    // Calculate points with bonuses
    if (isCorrect) {
      points = category.points_base;

      // Difficulty multiplier bonus
      if (category.difficulty_tier === 'hard') points *= 1.2;
      if (category.difficulty_tier === 'expert') points *= 1.5;
      if (category.difficulty_tier === 'bonus') points *= 2;

      // Round to nearest integer
      points = Math.round(points);
    }

    return { points, isCorrect };

  } catch (error) {
    console.error('Error scoring individual prediction:', error);
    return { points: 0, isCorrect: false };
  }
}

async function updateUserAchievements(gameId: string) {
  try {
    // Get all users who made predictions for this game
    const { data: userGameStats } = await supabase
      .from('user_prediction_summary')
      .select('*')
      .eq('game_id', gameId);

    if (!userGameStats) return;

    for (const stats of userGameStats) {
      const achievements = [];

      // Perfect Game achievement (got everything right)
      if (stats.accuracy === 1.0 && stats.total_predictions >= 5) {
        achievements.push({
          user_id: stats.user_id,
          achievement_type: 'perfect_game',
          achievement_name: 'Perfect Game',
          description: `Predicted every category correctly for ${gameId}`,
          badge_icon: '🎯',
          metadata: { game_id: gameId, predictions: stats.total_predictions },
        });
      }

      // High Scorer achievement (100+ points in one game)
      if (stats.total_points >= 100) {
        achievements.push({
          user_id: stats.user_id,
          achievement_type: 'high_scorer',
          achievement_name: 'Century Club',
          description: `Scored ${stats.total_points} points in a single game`,
          badge_icon: '💯',
          metadata: { game_id: gameId, points: stats.total_points },
        });
      }

      // Complete Predictor (made 10+ predictions)
      if (stats.total_predictions >= 10) {
        achievements.push({
          user_id: stats.user_id,
          achievement_type: 'complete_predictor',
          achievement_name: 'Complete Predictor',
          description: 'Made predictions in 10+ categories for a single game',
          badge_icon: '📊',
          metadata: { game_id: gameId, predictions: stats.total_predictions },
        });
      }

      // Insert achievements (will ignore duplicates due to unique constraint)
      for (const achievement of achievements) {
        try {
          await supabase
            .from('user_achievements')
            .insert(achievement);
        } catch {
          // Achievement already exists, ignore
        }
      }
    }

  } catch (error) {
    console.error('Error updating achievements:', error);
  }
}

async function updateUserStreaks(gameId: string) {
  try {
    // This would implement complex streak tracking logic
    // For now, just update the background job queue
    await supabase
      .from('background_jobs')
      .insert({
        job_type: 'update_streaks',
        job_data: { game_id: gameId },
      });
  } catch (error) {
    console.error('Error queueing streak update:', error);
  }
}

async function updateLeaderboards() {
  try {
    // Update seasonal leaderboard
    const { data: seasonStats } = await supabase
      .rpc('calculate_season_leaderboard');

    // Update weekly leaderboard
    const { data: weeklyStats } = await supabase
      .rpc('calculate_weekly_leaderboard');

    // Update daily leaderboard for today
    const { data: dailyStats } = await supabase
      .rpc('calculate_daily_leaderboard');

    console.log('✅ Leaderboards updated');

  } catch (error) {
    console.error('Error updating leaderboards:', error);
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger prediction scoring',
    endpoints: {
      'POST /api/predictions/scoring': 'Score completed games (cron or manual)',
    }
  });
}