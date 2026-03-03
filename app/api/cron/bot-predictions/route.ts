import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Bot prediction styles
const BOT_STYLES = {
  mark: { confidence: 0.7 },
  captain_hammy: { confidence: 0.6 },
  spartan: { confidence: 0.5 },
};

// This endpoint is called by Vercel Cron daily at 9 AM PT
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get today's and tomorrow's games that don't have bot predictions
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const { data: games } = await supabase
      .from('prediction_games')
      .select('id, opponent')
      .gte('game_date', today.toISOString().split('T')[0])
      .lte('game_date', tomorrow.toISOString().split('T')[0])
      .eq('status', 'scheduled');

    if (!games || games.length === 0) {
      return NextResponse.json({ message: 'No games needing predictions', created: 0 });
    }

    let created = 0;

    for (const game of games) {
      for (const botId of ['mark', 'captain_hammy', 'spartan'] as const) {
        // Check if prediction exists
        const { data: existing } = await supabase
          .from('bot_predictions')
          .select('id')
          .eq('bot_id', botId)
          .eq('game_id', game.id)
          .single();

        if (existing) continue;

        const style = BOT_STYLES[botId];
        const baseWinChance = 0.5 + (Math.random() - 0.5) * 0.3;
        const winChance =
          botId === 'spartan'
            ? baseWinChance < 0.5
              ? baseWinChance + 0.2
              : baseWinChance - 0.2
            : baseWinChance;

        const marinersWin = Math.random() < winChance;
        const marinersRuns = Math.floor(Math.random() * 6) + 2;
        const opponentRuns = marinersWin
          ? Math.floor(Math.random() * marinersRuns)
          : marinersRuns + Math.floor(Math.random() * 3) + 1;

        const predictions = {
          winner: marinersWin ? 'mariners' : 'opponent',
          mariners_runs: marinersWin ? marinersRuns : Math.min(marinersRuns, opponentRuns - 1),
          opponent_runs: marinersWin ? Math.min(opponentRuns, marinersRuns - 1) : opponentRuns,
          confidence: style.confidence,
        };

        const reasoning = generateReasoning(botId, predictions, game.opponent);

        const { error } = await supabase.from('bot_predictions').insert({
          bot_id: botId,
          game_id: game.id,
          predictions,
          reasoning,
        });

        if (!error) created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} bot predictions`,
      created,
    });
  } catch (error) {
    console.error('Cron bot-predictions error:', error);
    return NextResponse.json({ error: 'Failed to create predictions' }, { status: 500 });
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
        ? `Like our chances today. ${score} M's. Feeling it.`
        : `Gonna be honest... ${opponent} probably takes this one. ${predictions.opponent_runs}-${predictions.mariners_runs}. Prove me wrong though.`;
    case 'captain_hammy':
      return marinersWin
        ? `Good feeling about this one. Mariners ${score}. Trust the process.`
        : `Not loving our matchup here. Think we drop it ${predictions.opponent_runs}-${predictions.mariners_runs}. Hope I'm wrong.`;
    case 'spartan':
      return marinersWin
        ? `Everyone sleeping on us. M's take it ${score}. Book it.`
        : `Look. ${opponent} has the edge. ${predictions.opponent_runs}-${predictions.mariners_runs}. Just being real.`;
    default:
      return `Prediction: ${score}`;
  }
}
