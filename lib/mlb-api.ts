// lib/mlb-api.ts
const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MARINERS_TEAM_ID = 136;

export interface Game {
  gamePk: number;
  gameDate: string;
  status: {
    statusCode: string;
    detailedState: string;
  };
  teams: {
    away: {
      team: {
        id: number;
        name: string;
        abbreviation: string;
      };
      score?: number;
    };
    home: {
      team: {
        id: number;
        name: string;
        abbreviation: string;
      };
      score?: number;
    };
  };
  venue: {
    name: string;
  };
  gameType: string; // 'S' for Spring Training, 'R' for Regular Season
}

export interface Standing {
  team: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: string;
  divisionRank: string;
}

// Get Mariners schedule with spring training support
export async function getMarinersSchedule(days = 7): Promise<Game[]> {
  try {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const response = await fetch(
      `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&startDate=${startDate}&endDate=${endDate}&hydrate=team,linescore,venue`
    );
    
    const data = await response.json();
    const games: Game[] = [];
    
    data.dates?.forEach((date: any) => {
      date.games?.forEach((game: any) => {
        games.push({
          gamePk: game.gamePk,
          gameDate: game.gameDate,
          status: game.status,
          teams: game.teams,
          venue: game.venue,
          gameType: game.gameType
        });
      });
    });
    
    return games;
  } catch (error) {
    console.error('Failed to fetch Mariners schedule:', error);
    return [];
  }
}

// Get live scores for today's games
export async function getTodaysGames(): Promise<Game[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&date=${today}&hydrate=team,linescore,venue`
    );
    
    const data = await response.json();
    return data.dates?.[0]?.games || [];
  } catch (error) {
    console.error('Failed to fetch today\'s games:', error);
    return [];
  }
}

// Get AL West standings
export async function getALWestStandings(): Promise<Standing[]> {
  try {
    const response = await fetch(
      `${MLB_API_BASE}/standings?leagueId=103&season=2026&standingsTypes=divisionLeaders,wildCard`
    );
    
    const data = await response.json();
    const alWestDivision = data.records?.find((division: any) => 
      division.division?.id === 200 // AL West division ID
    );
    
    return alWestDivision?.teamRecords || [];
  } catch (error) {
    console.error('Failed to fetch AL West standings:', error);
    return [];
  }
}

// Team logos mapping
export const TEAM_LOGOS = {
  136: '/team-logos/mariners.svg', // Mariners
  108: '/team-logos/angels.svg',   // Angels
  117: '/team-logos/astros.svg',   // Astros
  140: '/team-logos/rangers.svg',  // Rangers
  133: '/team-logos/athletics.svg', // Athletics
  // Add more teams as needed
};

// Get team logo URL
export function getTeamLogo(teamId: number): string {
  return TEAM_LOGOS[teamId as keyof typeof TEAM_LOGOS] || 
         `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`;
}