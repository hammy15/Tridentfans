import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch upcoming games and user's predictions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'games';

    if (type === 'games') {
      // Get upcoming games
      const today = new Date().toISOString().split('T')[0];
      const { data: games, error } = await supabase
        .from('prediction_games')
        .select('*')
        .gte('game_date', today)
        .order('game_date')
        .limit(10);

      if (error) throw error;
      return NextResponse.json({ games: games || [] });
    }

    if (type === 'leaderboard') {
      const season = searchParams.get('season') || new Date().getFullYear();
      const { data: leaderboard, error } = await supabase
        .from('prediction_leaderboard')
        .select('*, user:profiles(*)')
        .eq('season', season)
        .order('rank')
        .limit(20);

      if (error) throw error;
      return NextResponse.json({ leaderboard: leaderboard || [] });
    }

    if (type === 'history' && userId) {
      const { data: history, error } = await supabase
        .from('user_predictions')
        .select('*, game:prediction_games(*)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return NextResponse.json({ history: history || [] });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Predictions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

// POST - Submit a prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gameId, predictions } = body;

    if (!userId || !gameId || !predictions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if game exists and is still open
    const { data: game, error: gameError } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Check if predictions are still open (30 min before game)
    const gameDateTime = new Date(`${game.game_date}T${game.game_time}`);
    const closeTime = new Date(gameDateTime.getTime() - 30 * 60 * 1000);
    if (new Date() > closeTime) {
      return NextResponse.json({ error: 'Predictions are closed for this game' }, { status: 400 });
    }

    // Check if user already has a prediction for this game
    const { data: existing } = await supabase
      .from('user_predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();

    if (existing) {
      // Update existing prediction
      const { data, error } = await supabase
        .from('user_predictions')
        .update({ predictions })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ prediction: data, updated: true });
    }

    // Create new prediction
    const { data, error } = await supabase
      .from('user_predictions')
      .insert({
        user_id: userId,
        game_id: gameId,
        predictions,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ prediction: data, created: true });
  } catch (error) {
    console.error('Predictions POST error:', error);
    return NextResponse.json({ error: 'Failed to submit prediction' }, { status: 500 });
  }
}
