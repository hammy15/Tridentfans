/**
 * Game Thread Automation System
 * Creates pre-game threads, manages lifecycle, and prepares content for approval
 */

import { createClient } from '@supabase/supabase-js';
import { getMarinersSchedule, formatGameForDisplay, getALWestStandings } from './mlb-api';
import { MARK_SYSTEM_PROMPT, MARK_CONTENT_VOICE } from './mark-soul';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface GameThreadContent {
  title: string;
  content: string;
  pre_game_analysis: string;
  prediction_setup: string;
  discussion_starters: string[];
  opponent_analysis: string;
  keys_to_victory: string[];
  game_info: {
    opponent: string;
    date: string;
    time: string;
    is_home: boolean;
    pitching_matchup?: string;
  };
}

/**
 * Get upcoming Mariners games for thread preparation
 */
export async function getUpcomingGameThreads(): Promise<any[]> {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const games = await getMarinersSchedule(
    undefined,
    today.toISOString().split('T')[0],
    nextWeek.toISOString().split('T')[0]
  );
  
  return games.filter(game => new Date(game.gameDate) > today);
}

/**
 * Generate comprehensive pre-game thread content
 */
export async function generateGameThreadContent(game: any): Promise<GameThreadContent> {
  const formatted = formatGameForDisplay(game);
  const gameDate = new Date(formatted.date);
  const isToday = gameDate.toDateString() === new Date().toDateString();
  const isTomorrow = gameDate.toDateString() === new Date(Date.now() + 24*60*60*1000).toDateString();
  
  // Get current standings for context
  const standings = await getALWestStandings();
  const marinersRecord = standings.find(team => team.team.name.includes('Seattle'));
  
  const timeStr = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles'
  });

  const content: GameThreadContent = {
    title: `Game Thread: Mariners ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent} - ${gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    
    content: `# ${formatted.isHome ? 'vs' : '@'} ${formatted.opponent}
**${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}** | **${timeStr} PT**
${formatted.isHome ? '🏠 T-Mobile Park' : `🛣️ ${formatted.venue}`}

---

## Pre-Game Setup

**Current Record:** ${marinersRecord ? `${marinersRecord.wins}-${marinersRecord.losses}` : 'TBD'}
**Division Standing:** ${marinersRecord ? `${standings.findIndex(t => t.team.id === marinersRecord.team.id) + 1}` : 'TBD'} in AL West

**What's at Stake:**
${isToday ? "It's game day! " : isTomorrow ? "Tomorrow's the day. " : ""}Looking to ${formatted.isHome ? 'defend the house' : 'take a series on the road'}. Every game matters in this division.

## Keys to Victory

🎯 **Offense:** Need to get to their starter early. Work counts, get into the bullpen.
⚡ **Defense:** Can't give away outs. JP and Julio need to be perfect up the middle.  
🔥 **Pitching:** Attack the zone, trust the defense, keep them off the bases.

## Discussion Starters

- **Lineup Predictions:** Who's batting where tonight?
- **Pitching Matchup:** Thoughts on our chances vs their starter?
- **Must-Watch Player:** Who's due for a big game?

---

**Make your predictions, share your takes, and let's get this W!**

**Go M's!** ⚓`,

    pre_game_analysis: `The ${formatted.opponent} come into this one with their own momentum. We need to focus on what we can control - quality at-bats, solid defense, and attacking strikes early in counts.`,
    
    prediction_setup: `**PREDICTION TIME:**
- Final Score?
- Who drives in the first run?
- Will we see extra innings?
- Player of the game?`,

    discussion_starters: [
      'What\'s your prediction for tonight\'s lineup?',
      'Which player is due for a breakout game?',
      'Key matchup to watch in this series?',
      'What needs to happen for us to win this series?'
    ],

    opponent_analysis: `**Scouting ${formatted.opponent}:**
Recent form and key players to watch. Their strengths and how we can exploit weaknesses.`,

    keys_to_victory: [
      'Get to their starting pitcher early',
      'Quality defense - no extra outs',
      'Timely hitting with RISP',
      'Bullpen management in late innings'
    ],

    game_info: {
      opponent: formatted.opponent,
      date: gameDate.toISOString().split('T')[0],
      time: timeStr,
      is_home: formatted.isHome,
      pitching_matchup: 'TBD vs TBD' // Would get from more detailed API
    }
  };

  return content;
}

/**
 * Prepare daily content for approval
 */
export async function prepareDailyContent(): Promise<{
  game_threads: GameThreadContent[];
  discussion_posts: any[];
  prediction_posts: any[];
}> {
  const upcomingGames = await getUpcomingGameThreads();
  const gameThreads = [];
  
  // Create threads for next 3 games
  for (const game of upcomingGames.slice(0, 3)) {
    const threadContent = await generateGameThreadContent(game);
    gameThreads.push(threadContent);
  }
  
  // Generate discussion topics
  const discussionPosts = [
    {
      title: 'Weekly Hot Takes Thread',
      content: 'Drop your boldest Mariners predictions and unpopular opinions here. No take too spicy! 🌶️',
      type: 'weekly_discussion'
    },
    {
      title: 'Prospect Watch: Minor League Update',  
      content: 'Latest news from Tacoma and Arkansas. Which prospects are making noise?',
      type: 'prospect_update'
    },
    {
      title: 'Trade Deadline Speculation',
      content: 'It\'s never too early to start thinking trades. What moves should Jerry make?',
      type: 'trade_talk'
    }
  ];

  // Generate prediction content
  const predictionPosts = [
    {
      title: 'Season Win Total: Over/Under Discussion',
      content: 'Where do you see this team finishing? Playoff bound or rebuilding year?',
      type: 'season_prediction'
    }
  ];

  return {
    game_threads: gameThreads,
    discussion_posts: discussionPosts,
    prediction_posts: predictionPosts
  };
}

/**
 * Auto-close previous game threads when new game starts
 */
export async function closeExpiredGameThreads(): Promise<number> {
  try {
    // Find threads that should be closed (game started > 3 hours ago)
    const cutoffTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredThreads } = await supabase
      .from('forum_posts')
      .select('id, title')
      .eq('is_game_thread', true)
      .eq('is_locked', false)
      .lt('game_start_time', cutoffTime);
    
    if (!expiredThreads?.length) return 0;
    
    // Close the threads
    const { error } = await supabase
      .from('forum_posts')
      .update({ is_locked: true, locked_reason: 'Game completed - thread archived' })
      .in('id', expiredThreads.map(t => t.id));
    
    if (error) throw error;
    
    return expiredThreads.length;
  } catch (error) {
    console.error('Error closing expired game threads:', error);
    return 0;
  }
}

/**
 * Create content approval queue
 */
export async function queueContentForApproval(content: any, type: string): Promise<string> {
  const filename = `content-approval-${type}-${Date.now()}.md`;
  const approvalContent = `# Content Approval Request

**Type:** ${type}
**Created:** ${new Date().toISOString()}
**Status:** Pending Approval

---

${JSON.stringify(content, null, 2)}

---

**Actions:**
- ✅ Approve and post
- ✏️ Edit and resubmit  
- ❌ Reject

**Mark**`;

  return filename;
}