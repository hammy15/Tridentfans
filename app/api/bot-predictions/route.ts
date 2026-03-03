import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Bot prediction styles
const BOT_PREDICTION_STYLES = {
  mark: {
    style: 'analytical',
    description: 'Mark calls it like he sees it — eyes on every game',
    confidence: 0.7,
  },
  captain_hammy: {
    style: 'intuitive',
    description: 'Based on team dynamics and gut feeling',
    confidence: 0.6,
  },
  spartan: {
    style: 'contrarian',
    description: 'Often takes the bold, unexpected pick',
    confidence: 0.5,
  },
};

// GET - Get bot predictions for a game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const type = searchParams.get('type') || 'game';

    if (type === 'leaderboard') {
      // Get bot vs human comparison
      const season = parseInt(searchParams.get('season') || String(new Date().getFullYear()));

      // Get bot total scores
      const { data: botScores } = await getSupabase()
        .from('bot_predictions')
        .select('bot_id, score')
        .not('score', 'is', null);

      const botTotals: Record<string, { points: number; predictions: number }> = {
        mark: { points: 0, predictions: 0 },
        captain_hammy: { points: 0, predictions: 0 },
        spartan: { points: 0, predictions: 0 },
      };

      botScores?.forEach(bp => {
        if (botTotals[bp.bot_id]) {
          botTotals[bp.bot_id].points += bp.score || 0;
          botTotals[bp.bot_id].predictions += 1;
        }
      });

      // Get human leaderboard
      const { data: humanLeaderboard } = await getSupabase()
        .from('prediction_leaderboard')
        .select('user_id, total_points, predictions_made, profiles(username, display_name)')
        .eq('season', season)
        .order('total_points', { ascending: false })
        .limit(10);

      return NextResponse.json({
        bots: Object.entries(botTotals).map(([id, data]) => ({
          botId: id,
          displayName:
            id === 'mark' ? 'Mark' : id === 'captain_hammy' ? 'Captain Hammy' : 'Spartan',
          ...data,
          accuracy: data.predictions > 0 ? (data.points / (data.predictions * 10)) * 100 : 0,
        })),
        humans: humanLeaderboard || [],
      });
    }

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const { data: predictions, error } = await getSupabase()
      .from('bot_predictions')
      .select('*')
      .eq('game_id', gameId);

    if (error) throw error;

    return NextResponse.json({ predictions: predictions || [] });
  } catch (error) {
    console.error('Bot predictions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bot predictions' }, { status: 500 });
  }
}

// POST - Generate bot predictions for a game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, password } = body;

    // Auth check
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get game details
    const { data: game } = await getSupabase()
      .from('prediction_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Generate predictions for each bot
    const botPredictions = [];

    for (const botId of ['mark', 'captain_hammy', 'spartan'] as const) {
      // Check if prediction already exists
      const { data: existing } = await getSupabase()
        .from('bot_predictions')
        .select('id')
        .eq('bot_id', botId)
        .eq('game_id', gameId)
        .single();

      if (existing) continue;

      const style = BOT_PREDICTION_STYLES[botId];

      // Generate semi-random but personality-consistent predictions
      const baseWinChance = 0.5 + (Math.random() - 0.5) * 0.3;
      const winChance =
        botId === 'spartan'
          ? baseWinChance < 0.5
            ? baseWinChance + 0.2
            : baseWinChance - 0.2
          : baseWinChance;

      const marinersWin = Math.random() < winChance;

      // Score prediction based on confidence
      const marinersRuns = Math.floor(Math.random() * 6) + 2;
      const opponentRuns = marinersWin
        ? Math.floor(Math.random() * marinersRuns)
        : marinersRuns + Math.floor(Math.random() * 3) + 1;

      const predictions = {
        winner: marinersWin ? 'mariners' : 'opponent',
        mariners_runs: marinersWin ? marinersRuns : Math.min(marinersRuns, opponentRuns - 1),
        opponent_runs: marinersWin ? Math.min(opponentRuns, marinersRuns - 1) : opponentRuns,
        total_runs: marinersRuns + opponentRuns,
        confidence: style.confidence,
      };

      const reasoning = generateReasoning(botId, predictions, game.opponent);

      const { data: prediction, error } = await getSupabase()
        .from('bot_predictions')
        .insert({
          bot_id: botId,
          game_id: gameId,
          predictions,
          reasoning,
        })
        .select()
        .single();

      if (error) throw error;
      botPredictions.push(prediction);
    }

    return NextResponse.json({ success: true, predictions: botPredictions });
  } catch (error) {
    console.error('Bot predictions POST error:', error);
    return NextResponse.json({ error: 'Failed to generate bot predictions' }, { status: 500 });
  }
}

function generateReasoning(
  botId: string,
  predictions: { winner: string; mariners_runs: number; opponent_runs: number },
  opponent: string
): string {
  const marinersWin = predictions.winner === 'mariners';
  const score = `${predictions.mariners_runs}-${predictions.opponent_runs}`;

  switch (botId) {
    case 'mark':
      return marinersWin
        ? `I've watched every game this season and I like what I see in this matchup. Calling it ${score} Mariners. Our pitching has been locked in.`
        : `Hate to say it, but ${opponent} has our number right now. I'm calling it ${predictions.opponent_runs}-${predictions.mariners_runs}. Prove me wrong, boys.`;

    case 'captain_hammy':
      return marinersWin
        ? `I've got a good feeling about this one. The boys are due for a breakout game. Mariners win ${score}. Trust the process!`
        : `As much as it pains me to say, I think we might drop this one ${predictions.opponent_runs}-${predictions.mariners_runs}. But hey, that's baseball.`;

    case 'spartan':
      return marinersWin
        ? `Everyone's sleeping on us for this game, but I'm calling the upset. Mariners take it ${score}. Book it.`
        : `I know it's not popular, but I'm going with ${opponent} here, ${predictions.opponent_runs}-${predictions.mariners_runs}. Sometimes you gotta be real.`;

    default:
      return `Prediction: ${score}`;
  }
}
