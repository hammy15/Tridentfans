import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - Get user's challenges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'pending' | 'accepted' | 'declined' | 'completed'
    const type = searchParams.get('type'); // 'sent' | 'received' | 'all'
    const challengeId = searchParams.get('id'); // Get specific challenge
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific challenge
    if (challengeId) {
      const { data: challenge, error } = await getSupabase()
        .from('challenges')
        .select(`
          *,
          challenger:profiles!challenges_challenger_id_fkey(id, username, display_name, avatar_url),
          opponent:profiles!challenges_opponent_id_fkey(id, username, display_name, avatar_url),
          game:prediction_games(id, game_date, opponent, opponent_abbr, is_home, status)
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;

      return NextResponse.json({ challenge });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Build query based on type
    let query = getSupabase()
      .from('challenges')
      .select(`
        *,
        challenger:profiles!challenges_challenger_id_fkey(id, username, display_name, avatar_url),
        opponent:profiles!challenges_opponent_id_fkey(id, username, display_name, avatar_url),
        game:prediction_games(id, game_date, opponent, opponent_abbr, is_home, status)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type (sent/received)
    if (type === 'sent') {
      query = query.eq('challenger_id', userId);
    } else if (type === 'received') {
      query = query.eq('opponent_id', userId);
    } else {
      // All challenges involving user
      query = query.or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);
    }

    // Filter by status
    if (status && ['pending', 'accepted', 'declined', 'completed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: challenges, error } = await query;

    if (error) throw error;

    // Get counts by status
    const { data: statusCounts } = await getSupabase()
      .from('challenges')
      .select('status')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);

    const counts = {
      pending: 0,
      accepted: 0,
      declined: 0,
      completed: 0,
    };

    statusCounts?.forEach(c => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });

    return NextResponse.json({
      challenges: challenges || [],
      counts,
    });
  } catch (error) {
    console.error('Challenges GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

// POST - Create challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, opponentId, gameId } = body;

    if (!userId || !opponentId || !gameId) {
      return NextResponse.json({ error: 'userId, opponentId, and gameId required' }, { status: 400 });
    }

    if (userId === opponentId) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
    }

    // Check if game exists and predictions are still open
    const { data: game, error: gameError } = await getSupabase()
      .from('prediction_games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status !== 'scheduled') {
      return NextResponse.json({ error: 'Game has already started or ended' }, { status: 400 });
    }

    const now = new Date();
    if (game.predictions_close_at && new Date(game.predictions_close_at) < now) {
      return NextResponse.json({ error: 'Predictions are closed for this game' }, { status: 400 });
    }

    // Check for existing challenge between these users for this game
    const { data: existingChallenge } = await getSupabase()
      .from('challenges')
      .select('id')
      .eq('game_id', gameId)
      .or(`and(challenger_id.eq.${userId},opponent_id.eq.${opponentId}),and(challenger_id.eq.${opponentId},opponent_id.eq.${userId})`)
      .neq('status', 'declined')
      .single();

    if (existingChallenge) {
      return NextResponse.json({ error: 'A challenge already exists for this game' }, { status: 409 });
    }

    // Create challenge
    const { data: challenge, error } = await getSupabase()
      .from('challenges')
      .insert({
        challenger_id: userId,
        opponent_id: opponentId,
        game_id: gameId,
        status: 'pending',
      })
      .select(`
        *,
        challenger:profiles!challenges_challenger_id_fkey(id, username, display_name, avatar_url),
        opponent:profiles!challenges_opponent_id_fkey(id, username, display_name, avatar_url),
        game:prediction_games(id, game_date, opponent, opponent_abbr, is_home)
      `)
      .single();

    if (error) throw error;

    // Get challenger info for notification
    const { data: challenger } = await getSupabase()
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single();

    // Create notification for opponent
    await getSupabase()
      .from('notifications')
      .insert({
        user_id: opponentId,
        type: 'challenge_received',
        title: 'New Challenge',
        message: `${challenger?.display_name || challenger?.username || 'Someone'} has challenged you to a prediction duel!`,
        data: {
          challengeId: challenge.id,
          challengerId: userId,
          gameId,
        },
      });

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('Challenges POST error:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

// PATCH - Accept/decline challenge or update scores
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, challengeId, action, systemKey, scores } = body;

    // System update for scores (after game ends)
    if (systemKey === process.env.CRON_SECRET && challengeId && scores) {
      const { challengerScore, opponentScore, winnerId } = scores;

      const { error } = await getSupabase()
        .from('challenges')
        .update({
          status: 'completed',
          challenger_score: challengerScore,
          opponent_score: opponentScore,
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (error) throw error;

      // Get challenge details for notifications
      const { data: challenge } = await getSupabase()
        .from('challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

      if (challenge) {
        // Notify both users
        const notifyUsers = [challenge.challenger_id, challenge.opponent_id];
        for (const notifyUserId of notifyUsers) {
          const isWinner = winnerId === notifyUserId;
          await getSupabase()
            .from('notifications')
            .insert({
              user_id: notifyUserId,
              type: 'challenge_result',
              title: isWinner ? 'Challenge Won!' : 'Challenge Lost',
              message: isWinner
                ? 'You won the prediction challenge!'
                : 'You lost the prediction challenge.',
              data: { challengeId, isWinner },
            });
        }
      }

      return NextResponse.json({ success: true });
    }

    // User action (accept/decline)
    if (!userId || !challengeId || !action) {
      return NextResponse.json({ error: 'userId, challengeId, and action required' }, { status: 400 });
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accept" or "decline"' }, { status: 400 });
    }

    // Verify user is the opponent
    const { data: challenge, error: challengeError } = await getSupabase()
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.opponent_id !== userId) {
      return NextResponse.json({ error: 'Only the challenged user can accept/decline' }, { status: 403 });
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json({ error: 'Challenge is no longer pending' }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    const { error: updateError } = await getSupabase()
      .from('challenges')
      .update({
        status: newStatus,
        accepted_at: action === 'accept' ? new Date().toISOString() : null,
      })
      .eq('id', challengeId);

    if (updateError) throw updateError;

    // Get opponent info for notification
    const { data: opponent } = await getSupabase()
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single();

    // Notify challenger
    await getSupabase()
      .from('notifications')
      .insert({
        user_id: challenge.challenger_id,
        type: action === 'accept' ? 'challenge_accepted' : 'system',
        title: action === 'accept' ? 'Challenge Accepted!' : 'Challenge Declined',
        message: `${opponent?.display_name || opponent?.username || 'Your opponent'} has ${action}ed your challenge.`,
        data: { challengeId, action },
      });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Challenges PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}

// DELETE - Cancel challenge (only challenger before it's accepted)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, challengeId } = body;

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'userId and challengeId required' }, { status: 400 });
    }

    // Verify user is the challenger and challenge is still pending
    const { data: challenge } = await getSupabase()
      .from('challenges')
      .select('challenger_id, status')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.challenger_id !== userId) {
      return NextResponse.json({ error: 'Only the challenger can cancel' }, { status: 403 });
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending challenges' }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Challenges DELETE error:', error);
    return NextResponse.json({ error: 'Failed to cancel challenge' }, { status: 500 });
  }
}
