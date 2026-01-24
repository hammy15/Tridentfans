import { NextRequest, NextResponse } from 'next/server';
import {
  getMarinersRoster,
  getUpcomingGames,
  getRecentGames,
  getALWestStandings,
  getTodaysGame,
  getLiveGame,
  formatGameForDisplay,
  getDetailedLiveGame,
} from '@/lib/mlb-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'roster';

    switch (type) {
      case 'roster': {
        const roster = await getMarinersRoster();
        return NextResponse.json({ roster });
      }

      case 'upcoming': {
        const days = parseInt(searchParams.get('days') || '7');
        const games = await getUpcomingGames(days);
        return NextResponse.json({
          games: games.map(formatGameForDisplay),
        });
      }

      case 'recent': {
        const days = parseInt(searchParams.get('days') || '7');
        const games = await getRecentGames(days);
        return NextResponse.json({
          games: games.map(formatGameForDisplay),
        });
      }

      case 'standings': {
        const standings = await getALWestStandings();
        return NextResponse.json({ standings });
      }

      case 'today': {
        const game = await getTodaysGame();
        return NextResponse.json({
          game: game ? formatGameForDisplay(game) : null,
        });
      }

      case 'live': {
        const liveGame = await getLiveGame();
        if (liveGame) {
          const details = await getDetailedLiveGame(liveGame.gamePk);
          return NextResponse.json({
            game: {
              ...formatGameForDisplay(liveGame),
              ...details,
            },
            isLive: true,
          });
        }
        // No live game, check for today's game
        const todayGame = await getTodaysGame();
        return NextResponse.json({
          game: null,
          today: todayGame ? formatGameForDisplay(todayGame) : null,
          isLive: false,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('MLB API error:', error);
    return NextResponse.json({ error: 'Failed to fetch MLB data' }, { status: 500 });
  }
}
