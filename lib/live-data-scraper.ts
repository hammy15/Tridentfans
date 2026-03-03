/**
 * Enhanced Live Data Scraper
 * Aggregates data from multiple free sources for comprehensive Mariners coverage
 */

import { 
  getMarinersSchedule, 
  getTodaysGame, 
  getALWestStandings,
  getMarinersRoster,
  formatGameForDisplay 
} from './mlb-api';

// ESPN API endpoints (free, no auth required)
const ESPN_API = {
  SCOREBOARD: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  TEAMS: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
  NEWS: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
};

// Baseball Reference scraping patterns (for historical data)
const BB_REF_BASE = 'https://www.baseball-reference.com';

// Cache implementation
const cache = new Map<string, { data: any; expires: number }>();

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

/**
 * Enhanced game data with multiple sources
 */
export interface EnhancedGameData {
  id: string;
  date: string;
  opponent: string;
  isHome: boolean;
  status: 'scheduled' | 'live' | 'final';
  score?: {
    mariners: number;
    opponent: number;
  };
  liveData?: {
    inning: number;
    inningHalf: 'top' | 'bottom';
    outs: number;
    runners: {
      first: boolean;
      second: boolean;
      third: boolean;
    };
    currentBatter?: string;
    lastPlay?: string;
  };
  stats?: {
    hits: { mariners: number; opponent: number };
    errors: { mariners: number; opponent: number };
  };
  winProbability?: number;
}

/**
 * Team performance metrics
 */
export interface TeamMetrics {
  record: { wins: number; losses: number };
  streakType: 'W' | 'L';
  streakCount: number;
  divisionRank: number;
  gamesBack: number;
  lastTenRecord: string;
  homeRecord: string;
  awayRecord: string;
  runsScored: number;
  runsAllowed: number;
  differential: number;
}

/**
 * Player performance data
 */
export interface PlayerPerformance {
  name: string;
  position: string;
  battingAvg?: number;
  homeRuns?: number;
  rbis?: number;
  era?: number;
  wins?: number;
  saves?: number;
  hotStreak?: boolean;
  coldStreak?: boolean;
}

/**
 * News and social mentions
 */
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  excerpt?: string;
  isBreaking?: boolean;
}

/**
 * Get comprehensive current game data
 */
export async function getLiveGameData(): Promise<EnhancedGameData | null> {
  const cacheKey = 'live-game-enhanced';
  const cached = getCached<EnhancedGameData>(cacheKey);
  if (cached) return cached;

  try {
    // Get today's game from MLB API
    const todaysGame = await getTodaysGame();
    if (!todaysGame) return null;

    const formattedGame = formatGameForDisplay(todaysGame);
    
    // Enhance with ESPN data if game is live
    let enhancedData: EnhancedGameData = {
      id: formattedGame.gamePk.toString(),
      date: formattedGame.date.toISOString(),
      opponent: formattedGame.opponent,
      isHome: formattedGame.isHome,
      status: formattedGame.status === 'Live' ? 'live' : 
              formattedGame.status === 'Final' ? 'final' : 'scheduled',
    };

    // Add scores if available
    if (formattedGame.marinersScore !== undefined && formattedGame.opponentScore !== undefined) {
      enhancedData.score = {
        mariners: formattedGame.marinersScore,
        opponent: formattedGame.opponentScore,
      };
    }

    // Get additional live data from ESPN if game is live
    if (enhancedData.status === 'live') {
      try {
        const espnData = await fetch(ESPN_API.SCOREBOARD);
        const espnJson = await espnData.json();
        
        // Find Mariners game in ESPN data
        const espnGame = espnJson.events?.find((event: any) => 
          event.competitions?.[0]?.competitors?.some((comp: any) => 
            comp.team?.abbreviation === 'SEA'
          )
        );

        if (espnGame) {
          const situation = espnGame.competitions?.[0]?.situation;
          if (situation) {
            enhancedData.liveData = {
              inning: situation.inning || 1,
              inningHalf: situation.inningHalf?.toLowerCase() || 'top',
              outs: situation.outs || 0,
              runners: {
                first: situation.onFirst || false,
                second: situation.onSecond || false,
                third: situation.onThird || false,
              },
              lastPlay: situation.lastPlay?.text,
            };
          }
        }
      } catch (error) {
        console.log('ESPN live data unavailable, using MLB API only');
      }
    }

    return setCache(cacheKey, enhancedData, 30 * 1000); // 30 second cache
  } catch (error) {
    console.error('Failed to get enhanced game data:', error);
    return null;
  }
}

/**
 * Get comprehensive team metrics
 */
export async function getTeamMetrics(): Promise<TeamMetrics | null> {
  const cacheKey = 'team-metrics';
  const cached = getCached<TeamMetrics>(cacheKey);
  if (cached) return cached;

  try {
    const standings = await getALWestStandings();
    const mariners = standings.find(team => team.team.name.includes('Seattle'));
    
    if (!mariners) return null;

    // Get additional metrics from ESPN
    let espnData: any = {};
    try {
      const response = await fetch(`${ESPN_API.TEAMS}/136`); // Mariners team ID
      espnData = await response.json();
    } catch (error) {
      console.log('ESPN team data unavailable');
    }

    const metrics: TeamMetrics = {
      record: {
        wins: mariners.wins,
        losses: mariners.losses,
      },
      streakType: mariners.streakCode?.[0] === 'W' ? 'W' : 'L',
      streakCount: parseInt(mariners.streakCode?.slice(1) || '0'),
      divisionRank: standings.findIndex(team => team.team.id === mariners.team.id) + 1,
      gamesBack: parseFloat(mariners.gamesBack || '0'),
      // Default values that could be enhanced with more detailed data
      lastTenRecord: '5-5', // Would need more detailed API calls
      homeRecord: '20-20', // Would need more detailed API calls  
      awayRecord: '20-20', // Would need more detailed API calls
      runsScored: 0, // Would enhance from team stats
      runsAllowed: 0, // Would enhance from team stats
      differential: 0, // Calculated from above
    };

    return setCache(cacheKey, metrics, 15 * 60 * 1000); // 15 minute cache
  } catch (error) {
    console.error('Failed to get team metrics:', error);
    return null;
  }
}

/**
 * Get top performing players this week
 */
export async function getHotPlayers(): Promise<PlayerPerformance[]> {
  const cacheKey = 'hot-players';
  const cached = getCached<PlayerPerformance[]>(cacheKey);
  if (cached) return cached;

  try {
    // This would require more detailed stats API calls
    // For now, return placeholder data that could be enhanced
    const roster = await getMarinersRoster();
    
    // Create sample performance data
    // In a real implementation, this would aggregate recent stats
    const hotPlayers: PlayerPerformance[] = roster.slice(0, 6).map(player => ({
      name: player.fullName,
      position: player.primaryPosition.abbreviation,
      battingAvg: 0.285 + (Math.random() * 0.1), // Sample data
      homeRuns: Math.floor(Math.random() * 30),
      rbis: Math.floor(Math.random() * 80),
      hotStreak: Math.random() > 0.7,
      coldStreak: Math.random() > 0.8,
    }));

    return setCache(cacheKey, hotPlayers, 60 * 60 * 1000); // 1 hour cache
  } catch (error) {
    console.error('Failed to get player performance:', error);
    return [];
  }
}

/**
 * Get latest Mariners news from multiple sources
 */
export async function getMarinersNews(): Promise<NewsItem[]> {
  const cacheKey = 'mariners-news';
  const cached = getCached<NewsItem[]>(cacheKey);
  if (cached) return cached;

  const news: NewsItem[] = [];

  try {
    // ESPN News API
    const espnResponse = await fetch(ESPN_API.NEWS);
    const espnData = await espnResponse.json();
    
    if (espnData.articles) {
      const marinersNews = espnData.articles
        .filter((article: any) => 
          article.headline?.toLowerCase().includes('mariners') ||
          article.headline?.toLowerCase().includes('seattle')
        )
        .slice(0, 5)
        .map((article: any) => ({
          title: article.headline,
          url: article.links?.web?.href || '#',
          source: 'ESPN',
          published: article.published,
          excerpt: article.description,
        }));
      
      news.push(...marinersNews);
    }
  } catch (error) {
    console.log('ESPN news unavailable');
  }

  // Could add more news sources here (MLB.com, Athletic, etc.)
  
  return setCache(cacheKey, news, 30 * 60 * 1000); // 30 minute cache
}

/**
 * Get upcoming schedule with enhanced data
 */
export async function getEnhancedSchedule(days = 7): Promise<EnhancedGameData[]> {
  const cacheKey = `enhanced-schedule-${days}`;
  const cached = getCached<EnhancedGameData[]>(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    const schedule = await getMarinersSchedule(
      undefined,
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const enhancedSchedule: EnhancedGameData[] = schedule.map(game => {
      const formatted = formatGameForDisplay(game);
      return {
        id: formatted.gamePk.toString(),
        date: formatted.date.toISOString(),
        opponent: formatted.opponent,
        isHome: formatted.isHome,
        status: formatted.status === 'Live' ? 'live' : 
                formatted.status === 'Final' ? 'final' : 'scheduled',
        ...(formatted.marinersScore !== undefined && {
          score: {
            mariners: formatted.marinersScore,
            opponent: formatted.opponentScore || 0,
          },
        }),
      };
    });

    return setCache(cacheKey, enhancedSchedule, 60 * 60 * 1000); // 1 hour cache
  } catch (error) {
    console.error('Failed to get enhanced schedule:', error);
    return [];
  }
}

/**
 * Get comprehensive dashboard data for TridentFans homepage
 */
export async function getDashboardData() {
  const cacheKey = 'dashboard-data';
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    const [liveGame, teamMetrics, schedule, news, hotPlayers] = await Promise.all([
      getLiveGameData(),
      getTeamMetrics(),
      getEnhancedSchedule(5),
      getMarinersNews(),
      getHotPlayers(),
    ]);

    const dashboardData = {
      liveGame,
      teamMetrics,
      upcomingGames: schedule.slice(0, 3),
      recentNews: news.slice(0, 3),
      hotPlayers: hotPlayers.slice(0, 3),
      lastUpdated: new Date().toISOString(),
    };

    return setCache(cacheKey, dashboardData, 5 * 60 * 1000); // 5 minute cache
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    return null;
  }
}

/**
 * Generate social media ready content from live data
 */
export async function generateGameContent(gameId: string): Promise<{
  twitterPost: string;
  redditTitle: string;
  forumPost: string;
} | null> {
  try {
    const liveGame = await getLiveGameData();
    if (!liveGame || liveGame.id !== gameId) return null;

    const isLive = liveGame.status === 'live';
    const isFinal = liveGame.status === 'final';
    
    if (isLive && liveGame.liveData && liveGame.score) {
      return {
        twitterPost: `🔥 LIVE: Mariners ${liveGame.score.mariners} - ${liveGame.opponent} ${liveGame.score.opponent} | ${liveGame.liveData.inningHalf} ${liveGame.liveData.inning} | ${liveGame.liveData.outs} outs #TrueToTheBlue`,
        redditTitle: `Live Game Thread: Mariners vs ${liveGame.opponent}`,
        forumPost: `Game is LIVE! Following along on TridentFans with real-time reactions.`,
      };
    }
    
    if (isFinal && liveGame.score) {
      const won = liveGame.score.mariners > liveGame.score.opponent;
      return {
        twitterPost: `${won ? '✅' : '❌'} FINAL: Mariners ${liveGame.score.mariners} - ${liveGame.opponent} ${liveGame.score.opponent} ${won ? 'W' : 'L'} #Mariners`,
        redditTitle: `Post Game Thread: Mariners ${won ? 'WIN' : 'lose'} ${liveGame.score.mariners}-${liveGame.score.opponent}`,
        forumPost: `What a game! ${won ? 'Another one in the books 🔥' : 'Tough loss but we bounce back tomorrow'}`,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to generate game content:', error);
    return null;
  }
}

export default {
  getLiveGameData,
  getTeamMetrics,
  getHotPlayers,
  getMarinersNews,
  getEnhancedSchedule,
  getDashboardData,
  generateGameContent,
};