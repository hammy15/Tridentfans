import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - List tournaments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active' | 'upcoming' | 'completed'
    const userId = searchParams.get('userId'); // Get user's tournaments
    const tournamentId = searchParams.get('id'); // Get specific tournament
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific tournament with details
    if (tournamentId) {
      const { data: tournament, error } = await getSupabase()
        .from('tournaments')
        .select(
          `
          *,
          participants:tournament_participants(
            user_id,
            joined_at,
            total_points,
            games_played,
            rank,
            user:profiles(id, username, display_name, avatar_url)
          )
        `
        )
        .eq('id', tournamentId)
        .single();

      if (error) throw error;

      // Get participant count
      const { count: participantCount } = await getSupabase()
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);

      return NextResponse.json({
        tournament: {
          ...tournament,
          participant_count: participantCount || 0,
        },
      });
    }

    // Build query for tournament list
    let query = getSupabase()
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status && ['active', 'upcoming', 'completed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: tournaments, error } = await query;

    if (error) throw error;

    // If userId provided, check participation status
    let userParticipation: Record<string, boolean> = {};
    if (userId && tournaments && tournaments.length > 0) {
      const tournamentIds = tournaments.map(t => t.id);
      const { data: participations } = await getSupabase()
        .from('tournament_participants')
        .select('tournament_id')
        .eq('user_id', userId)
        .in('tournament_id', tournamentIds);

      userParticipation = Object.fromEntries(
        participations?.map(p => [p.tournament_id, true]) || []
      );
    }

    // Get participant counts for each tournament
    const tournamentsWithCounts = await Promise.all(
      (tournaments || []).map(async tournament => {
        const { count } = await getSupabase()
          .from('tournament_participants')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        return {
          ...tournament,
          participant_count: count || 0,
          user_joined: userParticipation[tournament.id] || false,
        };
      })
    );

    return NextResponse.json({ tournaments: tournamentsWithCounts });
  } catch (error) {
    console.error('Tournaments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

// POST - Join tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tournamentId } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json({ error: 'userId and tournamentId required' }, { status: 400 });
    }

    // Check if tournament exists and is open for registration
    const { data: tournament, error: tournamentError } = await getSupabase()
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Check if tournament has already ended
    if (tournament.status === 'completed') {
      return NextResponse.json({ error: 'Tournament has already ended' }, { status: 400 });
    }

    // Check if already joined
    const { data: existing } = await getSupabase()
      .from('tournament_participants')
      .select('user_id')
      .eq('user_id', userId)
      .eq('tournament_id', tournamentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already joined this tournament' }, { status: 409 });
    }

    // Join tournament
    const { data: participation, error } = await getSupabase()
      .from('tournament_participants')
      .insert({
        user_id: userId,
        tournament_id: tournamentId,
        total_points: 0,
        games_played: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await getSupabase()
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'tournament_update',
        title: 'Tournament Joined',
        message: `You've joined "${tournament.name}"`,
        data: { tournamentId },
      });

    return NextResponse.json({ success: true, participation });
  } catch (error) {
    console.error('Tournaments POST error:', error);
    return NextResponse.json({ error: 'Failed to join tournament' }, { status: 500 });
  }
}

// DELETE - Leave tournament (before it starts)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tournamentId } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json({ error: 'userId and tournamentId required' }, { status: 400 });
    }

    // Check if tournament has started
    const { data: tournament } = await getSupabase()
      .from('tournaments')
      .select('status')
      .eq('id', tournamentId)
      .single();

    if (tournament && tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Cannot leave a tournament that has started' },
        { status: 400 }
      );
    }

    const { error } = await getSupabase()
      .from('tournament_participants')
      .delete()
      .eq('user_id', userId)
      .eq('tournament_id', tournamentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tournaments DELETE error:', error);
    return NextResponse.json({ error: 'Failed to leave tournament' }, { status: 500 });
  }
}

// PATCH - Update tournament (admin) or update user's tournament score (system)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, userId, points, gamesPlayed, adminPassword, updates, systemKey } = body;

    // System update for scores
    if (systemKey === process.env.CRON_SECRET && userId && tournamentId) {
      const updateData: Record<string, unknown> = {};
      if (points !== undefined) updateData.total_points = points;
      if (gamesPlayed !== undefined) updateData.games_played = gamesPlayed;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
      }

      const { error } = await getSupabase()
        .from('tournament_participants')
        .update(updateData)
        .eq('user_id', userId)
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      // Recalculate ranks
      await recalculateTournamentRanks(tournamentId);

      return NextResponse.json({ success: true });
    }

    // Admin update for tournament details
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD && tournamentId && updates) {
      const { error } = await getSupabase()
        .from('tournaments')
        .update(updates)
        .eq('id', tournamentId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Tournaments PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

// Helper function to recalculate tournament ranks
async function recalculateTournamentRanks(tournamentId: string) {
  const { data: participants } = await getSupabase()
    .from('tournament_participants')
    .select('user_id, total_points')
    .eq('tournament_id', tournamentId)
    .order('total_points', { ascending: false });

  if (!participants) return;

  // Update ranks
  for (let i = 0; i < participants.length; i++) {
    await getSupabase()
      .from('tournament_participants')
      .update({ rank: i + 1 })
      .eq('tournament_id', tournamentId)
      .eq('user_id', participants[i].user_id);
  }
}
