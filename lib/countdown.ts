/**
 * Game Countdown Utilities
 * Functions for countdown timers and game day detection
 */

import { getUpcomingGames, getLiveGame, formatGameForDisplay, type MLBGame } from './mlb-api';

export interface NextGameInfo {
  gamePk: number;
  date: Date;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  venue: string;
  status: 'Preview' | 'Live' | 'Final';
  statusDetail: string;
  marinersScore?: number;
  opponentScore?: number;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * Get the next scheduled Mariners game
 */
export async function getNextGame(): Promise<NextGameInfo | null> {
  try {
    // First check if there's a live game
    const liveGame = await getLiveGame();
    if (liveGame) {
      const formatted = formatGameForDisplay(liveGame);
      return {
        gamePk: formatted.gamePk,
        date: formatted.date,
        opponent: formatted.opponent,
        opponentAbbr: formatted.opponentAbbr,
        isHome: formatted.isHome,
        venue: formatted.venue,
        status: 'Live',
        statusDetail: formatted.statusDetail,
        marinersScore: formatted.marinersScore,
        opponentScore: formatted.opponentScore,
      };
    }

    // Get upcoming games
    const games = await getUpcomingGames(14);

    // Filter to games that haven't started yet
    const now = new Date();
    const futureGames = games.filter(game => {
      const gameDate = new Date(game.gameDate);
      return gameDate > now && game.status.abstractGameState === 'Preview';
    });

    if (futureGames.length === 0) {
      return null;
    }

    // Get the next game (first one)
    const nextGame = futureGames[0];
    const formatted = formatGameForDisplay(nextGame);

    return {
      gamePk: formatted.gamePk,
      date: formatted.date,
      opponent: formatted.opponent,
      opponentAbbr: formatted.opponentAbbr,
      isHome: formatted.isHome,
      venue: formatted.venue,
      status: 'Preview',
      statusDetail: formatted.statusDetail,
    };
  } catch (error) {
    console.error('Failed to get next game:', error);
    return null;
  }
}

/**
 * Format a countdown from now to target date
 */
export function formatCountdown(targetDate: Date): CountdownTime {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

/**
 * Format countdown as compact string (e.g., "2d 5h" or "3h 45m")
 */
export function formatCountdownCompact(targetDate: Date): string {
  const { days, hours, minutes, totalSeconds } = formatCountdown(targetDate);

  if (totalSeconds <= 0) {
    return 'Now';
  }

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Check if the game is today
 */
export function isGameDay(gameDate: Date): boolean {
  const now = new Date();
  return (
    gameDate.getDate() === now.getDate() &&
    gameDate.getMonth() === now.getMonth() &&
    gameDate.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if it's game day but game hasn't started yet
 */
export function isGameDayPreGame(gameDate: Date): boolean {
  if (!isGameDay(gameDate)) {
    return false;
  }
  return new Date() < gameDate;
}

/**
 * Check if game is currently live
 */
export async function isGameLive(gamePk: number): Promise<boolean> {
  try {
    const liveGame = await getLiveGame();
    return liveGame?.gamePk === gamePk;
  } catch {
    return false;
  }
}

/**
 * Format game time in user's timezone
 */
export function formatGameTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Format game date
 */
export function formatGameDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get countdown message based on time remaining
 */
export function getCountdownMessage(targetDate: Date): string {
  const { days, hours, minutes, totalSeconds } = formatCountdown(targetDate);

  if (totalSeconds <= 0) {
    return 'Game Time!';
  }

  if (days > 1) {
    return `${days} days until game day`;
  }

  if (days === 1) {
    return 'Tomorrow!';
  }

  if (hours > 1) {
    return `${hours} hours until first pitch`;
  }

  if (hours === 1) {
    return '1 hour to go!';
  }

  if (minutes > 30) {
    return 'Less than an hour!';
  }

  if (minutes > 5) {
    return 'Almost game time!';
  }

  return 'Starting soon!';
}

/**
 * Get team logo/abbreviation for opponent
 * Returns the standard MLB team abbreviation
 */
export function getTeamAbbreviation(teamName: string): string {
  const teamMap: Record<string, string> = {
    'Los Angeles Angels': 'LAA',
    'Houston Astros': 'HOU',
    'Oakland Athletics': 'OAK',
    'Texas Rangers': 'TEX',
    'Arizona Diamondbacks': 'ARI',
    'Atlanta Braves': 'ATL',
    'Baltimore Orioles': 'BAL',
    'Boston Red Sox': 'BOS',
    'Chicago Cubs': 'CHC',
    'Chicago White Sox': 'CHW',
    'Cincinnati Reds': 'CIN',
    'Cleveland Guardians': 'CLE',
    'Colorado Rockies': 'COL',
    'Detroit Tigers': 'DET',
    'Miami Marlins': 'MIA',
    'Milwaukee Brewers': 'MIL',
    'Minnesota Twins': 'MIN',
    'New York Mets': 'NYM',
    'New York Yankees': 'NYY',
    'Philadelphia Phillies': 'PHI',
    'Pittsburgh Pirates': 'PIT',
    'San Diego Padres': 'SD',
    'San Francisco Giants': 'SF',
    'Seattle Mariners': 'SEA',
    'St. Louis Cardinals': 'STL',
    'Tampa Bay Rays': 'TB',
    'Toronto Blue Jays': 'TOR',
    'Washington Nationals': 'WSH',
    'Kansas City Royals': 'KC',
    'Los Angeles Dodgers': 'LAD',
  };

  return teamMap[teamName] || teamName.slice(0, 3).toUpperCase();
}
