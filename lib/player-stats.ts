/**
 * Player Stats and Comparison System
 * Uses MLB Stats API for player data
 * Docs: https://statsapi.mlb.com/docs/
 */

import { supabase } from './supabase';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MARINERS_TEAM_ID = 136;

// Cache implementation for player data
const playerCache = new Map<string, { data: unknown; expires: number }>();

const CACHE_TTL = {
  SEARCH: 10 * 60 * 1000, // 10 minutes
  PLAYER: 60 * 60 * 1000, // 1 hour
  STATS: 30 * 60 * 1000, // 30 minutes
};

function getCached<T>(key: string): T | null {
  const entry = playerCache.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data as T;
  }
  playerCache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number): T {
  playerCache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

// Types
export interface PlayerSearchResult {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryPosition: {
    code: string;
    name: string;
    abbreviation: string;
    type: string;
  };
  currentTeam?: {
    id: number;
    name: string;
    abbreviation?: string;
  };
  primaryNumber?: string;
  birthDate?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  batSide?: { code: string; description: string };
  pitchHand?: { code: string; description: string };
  mlbDebutDate?: string;
  active: boolean;
}

export interface HittingStats {
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  caughtStealing: number;
  baseOnBalls: number;
  strikeOuts: number;
  avg: string;
  obp: string;
  slg: string;
  ops: string;
  war?: number;
}

export interface PitchingStats {
  gamesPlayed: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  era: string;
  whip: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  homeRuns: number;
  baseOnBalls: number;
  strikeOuts: number;
  strikeoutWalkRatio: string;
  war?: number;
}

export interface PlayerFullStats {
  player: PlayerSearchResult;
  currentSeasonHitting?: HittingStats;
  currentSeasonPitching?: PitchingStats;
  careerHitting?: HittingStats;
  careerPitching?: PitchingStats;
  playerType: 'hitter' | 'pitcher' | 'two-way';
  photoUrl?: string;
}

export interface PlayerComparison {
  player1: PlayerFullStats;
  player2: PlayerFullStats;
  comparisonType: 'hitter' | 'pitcher';
  statMode: 'career' | 'season';
}

async function fetchMLB<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${MLB_API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Search for MLB players by name
 */
export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  if (!query || query.length < 2) return [];

  const cacheKey = `search-${query.toLowerCase()}`;
  const cached = getCached<PlayerSearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // Search all active players
    const response = await fetchMLB<{
      people: Array<{
        id: number;
        fullName: string;
        firstName: string;
        lastName: string;
        primaryPosition?: {
          code: string;
          name: string;
          abbreviation: string;
          type: string;
        };
        currentTeam?: { id: number; name: string };
        primaryNumber?: string;
        birthDate?: string;
        birthCountry?: string;
        height?: string;
        weight?: number;
        batSide?: { code: string; description: string };
        pitchHand?: { code: string; description: string };
        mlbDebutDate?: string;
        active: boolean;
      }>;
    }>(`/sports/1/players?search=${encodeURIComponent(query)}&activeStatus=active`);

    const players: PlayerSearchResult[] = (response.people || []).map((p) => ({
      id: p.id,
      fullName: p.fullName,
      firstName: p.firstName,
      lastName: p.lastName,
      primaryPosition: p.primaryPosition || {
        code: 'U',
        name: 'Unknown',
        abbreviation: 'U',
        type: 'Unknown',
      },
      currentTeam: p.currentTeam,
      primaryNumber: p.primaryNumber,
      birthDate: p.birthDate,
      birthCountry: p.birthCountry,
      height: p.height,
      weight: p.weight,
      batSide: p.batSide,
      pitchHand: p.pitchHand,
      mlbDebutDate: p.mlbDebutDate,
      active: p.active,
    }));

    // Sort Mariners players first
    const sorted = players.sort((a, b) => {
      const aIsMariners = a.currentTeam?.id === MARINERS_TEAM_ID ? 0 : 1;
      const bIsMariners = b.currentTeam?.id === MARINERS_TEAM_ID ? 0 : 1;
      if (aIsMariners !== bIsMariners) return aIsMariners - bIsMariners;
      return a.fullName.localeCompare(b.fullName);
    });

    return setCache(cacheKey, sorted.slice(0, 20), CACHE_TTL.SEARCH);
  } catch (error) {
    console.error('Error searching players:', error);
    return [];
  }
}

/**
 * Get team abbreviation
 */
async function getTeamAbbreviation(teamId: number): Promise<string | undefined> {
  try {
    const response = await fetchMLB<{
      teams: Array<{ abbreviation: string }>;
    }>(`/teams/${teamId}`);
    return response.teams?.[0]?.abbreviation;
  } catch {
    return undefined;
  }
}

/**
 * Get detailed player stats
 */
export async function getPlayerStats(playerId: number): Promise<PlayerFullStats | null> {
  const cacheKey = `player-stats-${playerId}`;
  const cached = getCached<PlayerFullStats>(cacheKey);
  if (cached) return cached;

  try {
    const currentYear = new Date().getFullYear();

    // Get player info
    const playerResponse = await fetchMLB<{
      people: Array<{
        id: number;
        fullName: string;
        firstName: string;
        lastName: string;
        primaryPosition: {
          code: string;
          name: string;
          abbreviation: string;
          type: string;
        };
        currentTeam?: { id: number; name: string };
        primaryNumber?: string;
        birthDate?: string;
        birthCountry?: string;
        height?: string;
        weight?: number;
        batSide?: { code: string; description: string };
        pitchHand?: { code: string; description: string };
        mlbDebutDate?: string;
        active: boolean;
      }>;
    }>(`/people/${playerId}`);

    const playerData = playerResponse.people?.[0];
    if (!playerData) return null;

    // Get team abbreviation
    let teamAbbreviation: string | undefined;
    if (playerData.currentTeam?.id) {
      teamAbbreviation = await getTeamAbbreviation(playerData.currentTeam.id);
    }

    const player: PlayerSearchResult = {
      id: playerData.id,
      fullName: playerData.fullName,
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      primaryPosition: playerData.primaryPosition,
      currentTeam: playerData.currentTeam
        ? { ...playerData.currentTeam, abbreviation: teamAbbreviation }
        : undefined,
      primaryNumber: playerData.primaryNumber,
      birthDate: playerData.birthDate,
      birthCountry: playerData.birthCountry,
      height: playerData.height,
      weight: playerData.weight,
      batSide: playerData.batSide,
      pitchHand: playerData.pitchHand,
      mlbDebutDate: playerData.mlbDebutDate,
      active: playerData.active,
    };

    // Determine player type
    const positionType = playerData.primaryPosition?.type || '';
    const isPitcher = positionType === 'Pitcher' || playerData.primaryPosition?.abbreviation === 'P';

    // Get current season stats
    const seasonHittingResponse = await fetchMLB<{
      stats: Array<{
        splits: Array<{
          stat: {
            gamesPlayed: number;
            atBats: number;
            runs: number;
            hits: number;
            doubles: number;
            triples: number;
            homeRuns: number;
            rbi: number;
            stolenBases: number;
            caughtStealing: number;
            baseOnBalls: number;
            strikeOuts: number;
            avg: string;
            obp: string;
            slg: string;
            ops: string;
          };
        }>;
      }>;
    }>(`/people/${playerId}/stats?stats=season&season=${currentYear}&group=hitting`);

    const seasonPitchingResponse = await fetchMLB<{
      stats: Array<{
        splits: Array<{
          stat: {
            gamesPlayed: number;
            gamesStarted: number;
            wins: number;
            losses: number;
            saves: number;
            holds: number;
            era: string;
            whip: string;
            inningsPitched: string;
            hits: number;
            runs: number;
            earnedRuns: number;
            homeRuns: number;
            baseOnBalls: number;
            strikeOuts: number;
            strikeoutWalkRatio: string;
          };
        }>;
      }>;
    }>(`/people/${playerId}/stats?stats=season&season=${currentYear}&group=pitching`);

    // Get career stats
    const careerHittingResponse = await fetchMLB<{
      stats: Array<{
        splits: Array<{
          stat: {
            gamesPlayed: number;
            atBats: number;
            runs: number;
            hits: number;
            doubles: number;
            triples: number;
            homeRuns: number;
            rbi: number;
            stolenBases: number;
            caughtStealing: number;
            baseOnBalls: number;
            strikeOuts: number;
            avg: string;
            obp: string;
            slg: string;
            ops: string;
          };
        }>;
      }>;
    }>(`/people/${playerId}/stats?stats=career&group=hitting`);

    const careerPitchingResponse = await fetchMLB<{
      stats: Array<{
        splits: Array<{
          stat: {
            gamesPlayed: number;
            gamesStarted: number;
            wins: number;
            losses: number;
            saves: number;
            holds: number;
            era: string;
            whip: string;
            inningsPitched: string;
            hits: number;
            runs: number;
            earnedRuns: number;
            homeRuns: number;
            baseOnBalls: number;
            strikeOuts: number;
            strikeoutWalkRatio: string;
          };
        }>;
      }>;
    }>(`/people/${playerId}/stats?stats=career&group=pitching`);

    const seasonHittingSplit = seasonHittingResponse.stats?.[0]?.splits?.[0]?.stat;
    const seasonPitchingSplit = seasonPitchingResponse.stats?.[0]?.splits?.[0]?.stat;
    const careerHittingSplit = careerHittingResponse.stats?.[0]?.splits?.[0]?.stat;
    const careerPitchingSplit = careerPitchingResponse.stats?.[0]?.splits?.[0]?.stat;

    // Build current season hitting stats
    let currentSeasonHitting: HittingStats | undefined;
    if (seasonHittingSplit && seasonHittingSplit.gamesPlayed > 0) {
      currentSeasonHitting = {
        gamesPlayed: seasonHittingSplit.gamesPlayed,
        atBats: seasonHittingSplit.atBats,
        runs: seasonHittingSplit.runs,
        hits: seasonHittingSplit.hits,
        doubles: seasonHittingSplit.doubles,
        triples: seasonHittingSplit.triples,
        homeRuns: seasonHittingSplit.homeRuns,
        rbi: seasonHittingSplit.rbi,
        stolenBases: seasonHittingSplit.stolenBases,
        caughtStealing: seasonHittingSplit.caughtStealing,
        baseOnBalls: seasonHittingSplit.baseOnBalls,
        strikeOuts: seasonHittingSplit.strikeOuts,
        avg: seasonHittingSplit.avg,
        obp: seasonHittingSplit.obp,
        slg: seasonHittingSplit.slg,
        ops: seasonHittingSplit.ops,
      };
    }

    // Build current season pitching stats
    let currentSeasonPitching: PitchingStats | undefined;
    if (seasonPitchingSplit && seasonPitchingSplit.gamesPlayed > 0) {
      currentSeasonPitching = {
        gamesPlayed: seasonPitchingSplit.gamesPlayed,
        gamesStarted: seasonPitchingSplit.gamesStarted,
        wins: seasonPitchingSplit.wins,
        losses: seasonPitchingSplit.losses,
        saves: seasonPitchingSplit.saves,
        holds: seasonPitchingSplit.holds,
        era: seasonPitchingSplit.era,
        whip: seasonPitchingSplit.whip,
        inningsPitched: seasonPitchingSplit.inningsPitched,
        hits: seasonPitchingSplit.hits,
        runs: seasonPitchingSplit.runs,
        earnedRuns: seasonPitchingSplit.earnedRuns,
        homeRuns: seasonPitchingSplit.homeRuns,
        baseOnBalls: seasonPitchingSplit.baseOnBalls,
        strikeOuts: seasonPitchingSplit.strikeOuts,
        strikeoutWalkRatio: seasonPitchingSplit.strikeoutWalkRatio,
      };
    }

    // Build career hitting stats
    let careerHitting: HittingStats | undefined;
    if (careerHittingSplit && careerHittingSplit.gamesPlayed > 0) {
      careerHitting = {
        gamesPlayed: careerHittingSplit.gamesPlayed,
        atBats: careerHittingSplit.atBats,
        runs: careerHittingSplit.runs,
        hits: careerHittingSplit.hits,
        doubles: careerHittingSplit.doubles,
        triples: careerHittingSplit.triples,
        homeRuns: careerHittingSplit.homeRuns,
        rbi: careerHittingSplit.rbi,
        stolenBases: careerHittingSplit.stolenBases,
        caughtStealing: careerHittingSplit.caughtStealing,
        baseOnBalls: careerHittingSplit.baseOnBalls,
        strikeOuts: careerHittingSplit.strikeOuts,
        avg: careerHittingSplit.avg,
        obp: careerHittingSplit.obp,
        slg: careerHittingSplit.slg,
        ops: careerHittingSplit.ops,
      };
    }

    // Build career pitching stats
    let careerPitching: PitchingStats | undefined;
    if (careerPitchingSplit && careerPitchingSplit.gamesPlayed > 0) {
      careerPitching = {
        gamesPlayed: careerPitchingSplit.gamesPlayed,
        gamesStarted: careerPitchingSplit.gamesStarted,
        wins: careerPitchingSplit.wins,
        losses: careerPitchingSplit.losses,
        saves: careerPitchingSplit.saves,
        holds: careerPitchingSplit.holds,
        era: careerPitchingSplit.era,
        whip: careerPitchingSplit.whip,
        inningsPitched: careerPitchingSplit.inningsPitched,
        hits: careerPitchingSplit.hits,
        runs: careerPitchingSplit.runs,
        earnedRuns: careerPitchingSplit.earnedRuns,
        homeRuns: careerPitchingSplit.homeRuns,
        baseOnBalls: careerPitchingSplit.baseOnBalls,
        strikeOuts: careerPitchingSplit.strikeOuts,
        strikeoutWalkRatio: careerPitchingSplit.strikeoutWalkRatio,
      };
    }

    // Determine player type
    let playerType: 'hitter' | 'pitcher' | 'two-way' = 'hitter';
    if (isPitcher) {
      playerType = 'pitcher';
    }
    if (
      (currentSeasonHitting && currentSeasonPitching) ||
      (careerHitting && careerPitching && careerHitting.atBats > 50 && parseFloat(careerPitching.inningsPitched) > 50)
    ) {
      playerType = 'two-way';
    }

    // Photo URL (MLB headshot)
    const photoUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;

    const result: PlayerFullStats = {
      player,
      currentSeasonHitting,
      currentSeasonPitching,
      careerHitting,
      careerPitching,
      playerType,
      photoUrl,
    };

    return setCache(cacheKey, result, CACHE_TTL.STATS);
  } catch (error) {
    console.error('Error getting player stats:', error);
    return null;
  }
}

/**
 * Compare two players' stats
 */
export async function comparePlayersStats(
  player1Id: number,
  player2Id: number,
  statMode: 'career' | 'season' = 'season'
): Promise<PlayerComparison | null> {
  const [player1Stats, player2Stats] = await Promise.all([
    getPlayerStats(player1Id),
    getPlayerStats(player2Id),
  ]);

  if (!player1Stats || !player2Stats) {
    return null;
  }

  // Determine comparison type
  // If both are pitchers, compare pitching stats
  // Otherwise compare hitting stats
  const comparisonType =
    player1Stats.playerType === 'pitcher' && player2Stats.playerType === 'pitcher'
      ? 'pitcher'
      : 'hitter';

  return {
    player1: player1Stats,
    player2: player2Stats,
    comparisonType,
    statMode,
  };
}

/**
 * Get Mariners roster for quick search
 */
export async function getMarinersRosterForSearch(): Promise<PlayerSearchResult[]> {
  const cacheKey = 'mariners-roster-search';
  const cached = getCached<PlayerSearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchMLB<{
      roster: Array<{
        person: {
          id: number;
          fullName: string;
          firstName?: string;
          lastName?: string;
        };
        jerseyNumber?: string;
        position: {
          code: string;
          name: string;
          abbreviation: string;
          type: string;
        };
      }>;
    }>(`/teams/${MARINERS_TEAM_ID}/roster?rosterType=active`);

    const players: PlayerSearchResult[] = (response.roster || []).map((r) => ({
      id: r.person.id,
      fullName: r.person.fullName,
      firstName: r.person.firstName || r.person.fullName.split(' ')[0],
      lastName: r.person.lastName || r.person.fullName.split(' ').slice(1).join(' '),
      primaryPosition: r.position,
      currentTeam: { id: MARINERS_TEAM_ID, name: 'Seattle Mariners', abbreviation: 'SEA' },
      primaryNumber: r.jerseyNumber,
      active: true,
    }));

    return setCache(cacheKey, players, CACHE_TTL.SEARCH);
  } catch (error) {
    console.error('Error getting Mariners roster:', error);
    return [];
  }
}

// Supabase caching for API route
export async function getCachedPlayerStats(playerId: number): Promise<PlayerFullStats | null> {
  // Try Supabase cache first
  const { data: cached } = await supabase
    .from('player_stats_cache')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.data as PlayerFullStats;
  }

  // Fetch fresh data
  const stats = await getPlayerStats(playerId);
  if (!stats) return null;

  // Cache in Supabase
  const expiresAt = new Date(Date.now() + CACHE_TTL.STATS).toISOString();
  await supabase.from('player_stats_cache').upsert({
    player_id: playerId,
    data: stats,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return stats;
}

export async function getCachedPlayerSearch(query: string): Promise<PlayerSearchResult[]> {
  // Try Supabase cache first
  const cacheKey = query.toLowerCase().trim();
  const { data: cached } = await supabase
    .from('player_search_cache')
    .select('*')
    .eq('query', cacheKey)
    .single();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return cached.results as PlayerSearchResult[];
  }

  // Fetch fresh data
  const results = await searchPlayers(query);

  // Cache in Supabase
  const expiresAt = new Date(Date.now() + CACHE_TTL.SEARCH).toISOString();
  await supabase.from('player_search_cache').upsert({
    query: cacheKey,
    results,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return results;
}

// Featured comparisons type
export interface FeaturedComparison {
  id: string;
  player1_id: number;
  player1_name: string;
  player2_id: number;
  player2_name: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function getFeaturedComparisons(): Promise<FeaturedComparison[]> {
  const { data, error } = await supabase
    .from('featured_comparisons')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data) return [];
  return data;
}

// Popular comparisons tracking
export async function trackComparison(player1Id: number, player2Id: number): Promise<void> {
  // Ensure consistent ordering
  const [id1, id2] = player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id];

  await supabase.rpc('increment_comparison_count', {
    p_player1_id: id1,
    p_player2_id: id2,
  });
}

export interface PopularComparison {
  player1_id: number;
  player2_id: number;
  count: number;
}

export async function getPopularComparisons(limit = 10): Promise<PopularComparison[]> {
  const { data, error } = await supabase
    .from('comparison_analytics')
    .select('*')
    .order('count', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
