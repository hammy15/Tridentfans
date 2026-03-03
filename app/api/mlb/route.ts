// app/api/mlb/route.ts
import { NextRequest, NextResponse } from 'next/server';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MARINERS_TEAM_ID = 136;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const days = searchParams.get('days') || '7';

  try {
    switch (type) {
      case 'schedule':
        return await getSchedule(parseInt(days));
      case 'today':
        return await getTodayGames();
      case 'standings':
        return await getStandings();
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('MLB API error:', error);
    return NextResponse.json({ error: 'Failed to fetch MLB data' }, { status: 500 });
  }
}

async function getSchedule(days: number) {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  const response = await fetch(
    `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&startDate=${startDate}&endDate=${endDate}&hydrate=team,linescore,venue`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );
  
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status}`);
  }
  
  const data = await response.json();
  const games: any[] = [];
  
  data.dates?.forEach((date: any) => {
    date.games?.forEach((game: any) => {
      games.push({
        gamePk: game.gamePk,
        gameDate: game.gameDate,
        status: game.status,
        teams: game.teams,
        venue: game.venue,
        gameType: game.gameType,
        linescore: game.linescore
      });
    });
  });
  
  return NextResponse.json({ games });
}

async function getTodayGames() {
  const today = new Date().toISOString().split('T')[0];
  
  const response = await fetch(
    `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&date=${today}&hydrate=team,linescore,venue`,
    { next: { revalidate: 60 } } // Cache for 1 minute during games
  );
  
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status}`);
  }
  
  const data = await response.json();
  const games = data.dates?.[0]?.games || [];
  
  return NextResponse.json({ games });
}

async function getStandings() {
  const response = await fetch(
    `${MLB_API_BASE}/standings?leagueId=103&season=2026&standingsTypes=divisionLeaders,wildCard`,
    { next: { revalidate: 1800 } } // Cache for 30 minutes
  );
  
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Find AL West standings
  const alWest = data.records?.find((division: any) => 
    division.division?.id === 200 // AL West division ID
  );
  
  const standings = alWest?.teamRecords?.map((team: any) => ({
    team: {
      id: team.team.id,
      name: team.team.name,
      abbreviation: team.team.abbreviation
    },
    wins: team.wins,
    losses: team.losses,
    winPercentage: team.winningPercentage,
    gamesBack: team.gamesBack,
    divisionRank: team.divisionRank,
    wildCardRank: team.wildCardRank
  })) || [];
  
  return NextResponse.json({ standings });
}