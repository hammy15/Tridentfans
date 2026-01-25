import { NextRequest, NextResponse } from 'next/server';
import {
  searchPlayers,
  getPlayerStats,
  getMarinersRosterForSearch,
  trackComparison,
} from '@/lib/player-stats';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const playerId = searchParams.get('playerId');
  const compare = searchParams.get('compare');
  const player1Id = searchParams.get('player1');
  const player2Id = searchParams.get('player2');
  const marinersOnly = searchParams.get('marinersOnly');

  try {
    // Search for players
    if (search) {
      const players = await searchPlayers(search);
      return NextResponse.json({ players });
    }

    // Get Mariners roster
    if (marinersOnly === 'true') {
      const roster = await getMarinersRosterForSearch();
      return NextResponse.json({ players: roster });
    }

    // Get single player stats
    if (playerId) {
      const id = parseInt(playerId, 10);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
      }
      const stats = await getPlayerStats(id);
      if (!stats) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
      return NextResponse.json(stats);
    }

    // Compare two players
    if (compare === 'true' && player1Id && player2Id) {
      const id1 = parseInt(player1Id, 10);
      const id2 = parseInt(player2Id, 10);

      if (isNaN(id1) || isNaN(id2)) {
        return NextResponse.json({ error: 'Invalid player IDs' }, { status: 400 });
      }

      const [stats1, stats2] = await Promise.all([
        getPlayerStats(id1),
        getPlayerStats(id2),
      ]);

      if (!stats1 || !stats2) {
        return NextResponse.json({ error: 'One or both players not found' }, { status: 404 });
      }

      // Track the comparison (fire and forget)
      trackComparison(id1, id2).catch(console.error);

      return NextResponse.json({
        player1: stats1,
        player2: stats2,
      });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Players API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
