/**
 * MLB Stats API Integration
 * Free API, no authentication required
 * Docs: https://statsapi.mlb.com/docs/
 */

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MARINERS_TEAM_ID = 136; // Seattle Mariners

// Cache implementation
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number): T {
  cache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

// Cache TTLs
const CACHE_TTL = {
  LIVE: 30 * 1000, // 30 seconds
  SCHEDULE: 60 * 60 * 1000, // 1 hour
  ROSTER: 24 * 60 * 60 * 1000, // 24 hours
  STANDINGS: 15 * 60 * 1000, // 15 minutes
  HISTORICAL: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Types
export interface MLBPlayer {
  id: number;
  fullName: string;
  primaryNumber?: string;
  primaryPosition: {
    abbreviation: string;
    name: string;
  };
  batSide: { code: string };
  pitchHand: { code: string };
}

export interface MLBGameStatus {
  abstractGameState: 'Live' | 'Final' | 'Preview';
  detailedState: string;
  statusCode: string;
}

export interface MLBGame {
  gamePk: number;
  gameDate: string;
  status: MLBGameStatus;
  teams: {
    away: {
      team: { id: number; name: string; abbreviation: string };
      score?: number;
      isWinner?: boolean;
    };
    home: {
      team: { id: number; name: string; abbreviation: string };
      score?: number;
      isWinner?: boolean;
    };
  };
  venue: { name: string };
}

export interface MLBStanding {
  team: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  winningPercentage: string;
  gamesBack: string;
  streakCode: string;
  records?: {
    splitRecords: Array<{
      type: string;
      wins: number;
      losses: number;
    }>;
  };
}

async function fetchMLB<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${MLB_API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get Mariners schedule for a season or date range
 */
export async function getMarinersSchedule(
  season?: number,
  startDate?: string,
  endDate?: string
): Promise<MLBGame[]> {
  const year = season || new Date().getFullYear();
  const cacheKey = `schedule-${year}-${startDate}-${endDate}`;

  const cached = getCached<MLBGame[]>(cacheKey);
  if (cached) return cached;

  let endpoint = `/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&season=${year}`;
  if (startDate) endpoint += `&startDate=${startDate}`;
  if (endDate) endpoint += `&endDate=${endDate}`;

  const response = await fetchMLB<{ dates: Array<{ games: MLBGame[] }> }>(endpoint);

  const games = response.dates.flatMap(d => d.games);
  return setCache(cacheKey, games, CACHE_TTL.SCHEDULE);
}

/**
 * Get upcoming games (next N days)
 */
export async function getUpcomingGames(days = 7): Promise<MLBGame[]> {
  const today = new Date();
  const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const startStr = today.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  return getMarinersSchedule(undefined, startStr, endStr);
}

/**
 * Get recent games (past N days)
 */
export async function getRecentGames(days = 7): Promise<MLBGame[]> {
  const today = new Date();
  const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  return getMarinersSchedule(undefined, startStr, endStr);
}

/**
 * Get Mariners roster
 */
export async function getMarinersRoster(): Promise<MLBPlayer[]> {
  const cacheKey = 'roster';
  const cached = getCached<MLBPlayer[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{ roster: Array<{ person: MLBPlayer }> }>(
    `/teams/${MARINERS_TEAM_ID}/roster?rosterType=active`
  );

  const players = response.roster.map(r => r.person);
  return setCache(cacheKey, players, CACHE_TTL.ROSTER);
}

/**
 * Get 40-man roster
 */
export async function getFullRoster(): Promise<MLBPlayer[]> {
  const cacheKey = 'roster-40man';
  const cached = getCached<MLBPlayer[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{ roster: Array<{ person: MLBPlayer }> }>(
    `/teams/${MARINERS_TEAM_ID}/roster?rosterType=40Man`
  );

  const players = response.roster.map(r => r.person);
  return setCache(cacheKey, players, CACHE_TTL.ROSTER);
}

/**
 * Get live game data
 */
export async function getLiveGameData(gamePk: number) {
  const cacheKey = `live-${gamePk}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{
    gameData: unknown;
    liveData: unknown;
  }>(`/game/${gamePk}/feed/live`);

  return setCache(cacheKey, response, CACHE_TTL.LIVE);
}

/**
 * Get player stats
 */
export async function getPlayerStats(
  playerId: number,
  season?: number,
  group: 'hitting' | 'pitching' | 'fielding' = 'hitting'
) {
  const year = season || new Date().getFullYear();
  const cacheKey = `player-${playerId}-${year}-${group}`;

  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{ stats: unknown[] }>(
    `/people/${playerId}/stats?stats=season&season=${year}&group=${group}`
  );

  return setCache(cacheKey, response.stats, CACHE_TTL.ROSTER);
}

/**
 * Get AL West standings
 */
export async function getALWestStandings(): Promise<MLBStanding[]> {
  const cacheKey = 'standings-alwest';
  const cached = getCached<MLBStanding[]>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{
    records: Array<{
      division: { id: number };
      teamRecords: MLBStanding[];
    }>;
  }>(`/standings?leagueId=103`); // 103 = American League

  // AL West division ID is 200
  const alWest = response.records.find(r => r.division.id === 200);
  const standings = alWest?.teamRecords || [];

  return setCache(cacheKey, standings, CACHE_TTL.STANDINGS);
}

/**
 * Get team stats
 */
export async function getTeamStats(season?: number) {
  const year = season || new Date().getFullYear();
  const cacheKey = `team-stats-${year}`;

  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const response = await fetchMLB<{ stats: unknown[] }>(
    `/teams/${MARINERS_TEAM_ID}/stats?stats=season&season=${year}&group=hitting,pitching`
  );

  return setCache(cacheKey, response.stats, CACHE_TTL.SCHEDULE);
}

/**
 * Get today's game (if any)
 */
export async function getTodaysGame(): Promise<MLBGame | null> {
  const today = new Date().toISOString().split('T')[0];
  const games = await getMarinersSchedule(undefined, today, today);
  return games[0] || null;
}

/**
 * Check if there's a live Mariners game
 */
export async function getLiveGame(): Promise<MLBGame | null> {
  const todaysGame = await getTodaysGame();
  if (todaysGame && todaysGame.status.abstractGameState === 'Live') {
    return todaysGame;
  }
  return null;
}

/**
 * Format game for display
 */
export function formatGameForDisplay(game: MLBGame) {
  const isHome = game.teams.home.team.id === MARINERS_TEAM_ID;
  const opponent = isHome ? game.teams.away.team : game.teams.home.team;
  const marinersTeam = isHome ? game.teams.home : game.teams.away;
  const opponentTeam = isHome ? game.teams.away : game.teams.home;

  return {
    gamePk: game.gamePk,
    date: new Date(game.gameDate),
    opponent: opponent.name,
    opponentAbbr: opponent.abbreviation,
    isHome,
    venue: game.venue.name,
    status: game.status.abstractGameState,
    statusDetail: game.status.detailedState,
    marinersScore: marinersTeam.score,
    opponentScore: opponentTeam.score,
    isWin: marinersTeam.isWinner,
  };
}

/**
 * Live game details interface
 */
export interface LiveGameDetails {
  inning: number;
  inningHalf: 'Top' | 'Bottom';
  outs: number;
  balls: number;
  strikes: number;
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
  currentBatter?: {
    name: string;
    avg: string;
  };
  currentPitcher?: {
    name: string;
    era: string;
  };
  lastPlay?: string;
  marinersHits: number;
  opponentHits: number;
  marinersErrors: number;
  opponentErrors: number;
}

/**
 * Get detailed live game data
 */
export async function getDetailedLiveGame(gamePk: number): Promise<LiveGameDetails | null> {
  try {
    const response = await fetchMLB<{
      liveData: {
        linescore: {
          currentInning: number;
          currentInningOrdinal: string;
          inningHalf: string;
          outs: number;
          balls: number;
          strikes: number;
          offense: {
            first?: { fullName: string };
            second?: { fullName: string };
            third?: { fullName: string };
            batter?: { fullName: string };
          };
          defense: {
            pitcher?: { fullName: string };
          };
          teams: {
            home: { runs: number; hits: number; errors: number };
            away: { runs: number; hits: number; errors: number };
          };
        };
        plays: {
          currentPlay?: {
            result?: { description: string };
          };
          allPlays?: Array<{ result?: { description: string } }>;
        };
      };
      gameData: {
        teams: {
          home: { id: number };
        };
        players: Record<string, { stats?: { batting?: { avg: string }; pitching?: { era: string } } }>;
      };
    }>(`/game/${gamePk}/feed/live`);

    const linescore = response.liveData.linescore;
    const plays = response.liveData.plays;
    const isMarinersHome = response.gameData.teams.home.id === MARINERS_TEAM_ID;

    const marinersStats = isMarinersHome ? linescore.teams.home : linescore.teams.away;
    const opponentStats = isMarinersHome ? linescore.teams.away : linescore.teams.home;

    // Get last play description
    let lastPlay: string | undefined;
    if (plays.currentPlay?.result?.description) {
      lastPlay = plays.currentPlay.result.description;
    } else if (plays.allPlays && plays.allPlays.length > 0) {
      const last = plays.allPlays[plays.allPlays.length - 1];
      lastPlay = last?.result?.description;
    }

    return {
      inning: linescore.currentInning,
      inningHalf: linescore.inningHalf === 'Top' ? 'Top' : 'Bottom',
      outs: linescore.outs || 0,
      balls: linescore.balls || 0,
      strikes: linescore.strikes || 0,
      onFirst: !!linescore.offense?.first,
      onSecond: !!linescore.offense?.second,
      onThird: !!linescore.offense?.third,
      currentBatter: linescore.offense?.batter
        ? { name: linescore.offense.batter.fullName, avg: '.---' }
        : undefined,
      currentPitcher: linescore.defense?.pitcher
        ? { name: linescore.defense.pitcher.fullName, era: '-.--' }
        : undefined,
      lastPlay,
      marinersHits: marinersStats.hits,
      opponentHits: opponentStats.hits,
      marinersErrors: marinersStats.errors,
      opponentErrors: opponentStats.errors,
    };
  } catch (error) {
    console.error('Failed to get detailed live game:', error);
    return null;
  }
}
