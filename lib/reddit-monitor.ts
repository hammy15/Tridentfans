/**
 * Reddit Monitoring and Engagement System
 * Tracks Mariners discussions for organic engagement opportunities
 */

// Reddit API doesn't require auth for read-only operations
const REDDIT_API_BASE = 'https://www.reddit.com';

// Subreddits to monitor
const TARGET_SUBREDDITS = [
  'mariners',
  'baseball', 
  'fantasybaseball',
  'baseballtraderumors',
  'minorleaguebaseball',
  'sabermetrics'
];

// Keywords that trigger engagement opportunities
const MARINERS_KEYWORDS = [
  'mariners', 'seattle', 'm\'s', 'trident',
  'julio rodriguez', 'cal raleigh', 'george kirby',
  'logan gilbert', 'jp crawford', 'eugenio suarez',
  't-mobile park', 'safeco', 'jerry dipoto',
  'scott servais', 'felix hernandez', 'king felix',
  'griffey', 'edgar', 'the double', 'refuse to lose',
  'sog', 'soggy', 'chaos ball'
];

const TRADE_KEYWORDS = [
  'trade deadline', 'prospect', 'farm system',
  'rotation', 'bullpen', 'dh', 'outfield'
];

const STATS_KEYWORDS = [
  'war', 'ops', 'era', 'whip', 'babip', 'fip',
  'sabermetrics', 'advanced stats', 'statcast'
];

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext?: string;
  upvote_ratio: number;
  permalink: string;
  flair_text?: string;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
  parent_id: string;
  permalink: string;
  replies?: RedditComment[];
}

export interface EngagementOpportunity {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  title: string;
  content: string;
  url: string;
  relevanceScore: number;
  suggestedPersona: 'mark' | 'hammy' | 'spartan';
  suggestedResponse: string;
  keywords: string[];
}

// Cache for API responses
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
 * Fetch Reddit data with caching
 */
async function fetchReddit<T>(endpoint: string, ttlMs = 5 * 60 * 1000): Promise<T> {
  const cacheKey = endpoint;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${REDDIT_API_BASE}${endpoint}.json`, {
    headers: {
      'User-Agent': 'TridentFans/1.0 (Mariners Fan Community)',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return setCache(cacheKey, data, ttlMs);
}

/**
 * Monitor hot posts in target subreddits
 */
export async function getHotPosts(subreddit: string, limit = 25): Promise<RedditPost[]> {
  try {
    const data = await fetchReddit<{
      data: { children: Array<{ data: RedditPost }> };
    }>(`/r/${subreddit}/hot?limit=${limit}`);

    return data.data.children.map(child => ({
      ...child.data,
      permalink: `https://reddit.com${child.data.permalink}`,
    }));
  } catch (error) {
    console.error(`Failed to fetch /r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Get comments for a specific post
 */
export async function getPostComments(subreddit: string, postId: string): Promise<RedditComment[]> {
  try {
    const data = await fetchReddit<[
      { data: { children: Array<{ data: RedditPost }> } },
      { data: { children: Array<{ data: RedditComment }> } }
    ]>(`/r/${subreddit}/comments/${postId}`);

    return data[1].data.children
      .filter(child => child.data.body && child.data.body !== '[deleted]')
      .map(child => ({
        ...child.data,
        permalink: `https://reddit.com${child.data.permalink}`,
      }));
  } catch (error) {
    console.error(`Failed to fetch comments for ${postId}:`, error);
    return [];
  }
}

/**
 * Search Reddit for Mariners content
 */
export async function searchMarinersContent(query: string, subreddit?: string, timeframe = 'day'): Promise<RedditPost[]> {
  try {
    const searchPath = subreddit ? `/r/${subreddit}/search` : '/search';
    const params = new URLSearchParams({
      q: query,
      sort: 'hot',
      t: timeframe,
      type: 'sr,link',
      ...(subreddit && { restrict_sr: 'true' })
    });

    const data = await fetchReddit<{
      data: { children: Array<{ data: RedditPost }> };
    }>(`${searchPath}?${params}`);

    return data.data.children.map(child => ({
      ...child.data,
      permalink: `https://reddit.com${child.data.permalink}`,
    }));
  } catch (error) {
    console.error(`Failed to search for "${query}":`, error);
    return [];
  }
}

/**
 * Calculate relevance score for engagement
 */
function calculateRelevanceScore(post: RedditPost): number {
  let score = 0;

  // Base score from engagement
  score += Math.min(post.score / 10, 10); // Max 10 points from upvotes
  score += Math.min(post.num_comments / 5, 5); // Max 5 points from comments

  // Keyword matching
  const content = (post.title + ' ' + (post.selftext || '')).toLowerCase();
  const marinersMatches = MARINERS_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  score += marinersMatches.length * 2;

  // Subreddit relevance
  if (post.subreddit === 'mariners') score += 15;
  else if (post.subreddit === 'baseball') score += 10;
  else if (['fantasybaseball', 'baseballtraderumors'].includes(post.subreddit)) score += 8;

  // Recency bonus (newer posts get higher scores)
  const hoursOld = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
  if (hoursOld < 2) score += 5;
  else if (hoursOld < 6) score += 3;
  else if (hoursOld < 24) score += 1;

  // Quality indicators
  if (post.upvote_ratio > 0.9) score += 3;
  if (post.flair_text?.toLowerCase().includes('discussion')) score += 2;

  return Math.round(score);
}

/**
 * Determine which persona should engage
 */
function suggestPersona(post: RedditPost): 'mark' | 'hammy' | 'spartan' {
  const content = (post.title + ' ' + (post.selftext || '')).toLowerCase();
  
  // Trade analysis -> Hammy
  const tradeMatches = TRADE_KEYWORDS.filter(keyword => 
    content.includes(keyword.toLowerCase())
  );
  if (tradeMatches.length >= 2) return 'hammy';

  // Stats discussion -> Spartan  
  const statsMatches = STATS_KEYWORDS.filter(keyword =>
    content.includes(keyword.toLowerCase())
  );
  if (statsMatches.length >= 2) return 'spartan';

  // Game threads, general discussion -> Mark
  if (content.includes('game thread') || 
      content.includes('prediction') || 
      content.includes('discussion')) return 'mark';

  // Default to appropriate persona by subreddit
  if (post.subreddit === 'baseballtraderumors') return 'hammy';
  if (post.subreddit === 'sabermetrics') return 'spartan';
  
  return 'mark'; // Default
}

/**
 * Generate suggested response based on persona and content
 */
function generateSuggestedResponse(post: RedditPost, persona: 'mark' | 'hammy' | 'spartan'): string {
  const content = post.title.toLowerCase();
  
  if (persona === 'mark') {
    if (content.includes('prediction')) {
      return "Been tracking predictions on my site - this is exactly the kind of call that either ages perfectly or haunts you all season. What's your take?";
    }
    if (content.includes('game thread')) {
      return "Love the energy in here. Nothing beats live reactions with fellow M's fans. How we feeling about tonight's lineup?";
    }
    return "Been following the M's since '95 - this reminds me of [relevant memory]. What do you think?";
  }
  
  if (persona === 'hammy') {
    if (content.includes('trade')) {
      return "Called this one weeks ago. Here's the breakdown: [analysis]. Jerry's been building toward this for months.";
    }
    if (content.includes('prospect')) {
      return "Interesting take. Looking at our farm system depth, this makes sense because [reason]. The timeline fits perfectly.";
    }
    return "Good analysis. From a roster construction standpoint, this is about [strategic reason].";
  }
  
  if (persona === 'spartan') {
    if (content.includes('stats') || content.includes('war') || content.includes('ops')) {
      return "Actually disagree here. The numbers tell a different story: [stat-based argument]. Everyone's missing the real trend.";
    }
    if (content.includes('overrated') || content.includes('underrated')) {
      return "Hot take but you're onto something. Did a deep dive on this - the advanced metrics support your point.";
    }
    return "Unpopular opinion: the data says otherwise. Here's why everyone's wrong about this...";
  }
  
  return "Interesting discussion. What's your take on [relevant aspect]?";
}

/**
 * Find engagement opportunities across all monitored subreddits
 */
export async function findEngagementOpportunities(): Promise<EngagementOpportunity[]> {
  const opportunities: EngagementOpportunity[] = [];
  
  for (const subreddit of TARGET_SUBREDDITS) {
    try {
      const posts = await getHotPosts(subreddit, 15);
      
      for (const post of posts) {
        const relevanceScore = calculateRelevanceScore(post);
        
        // Only engage with relevant content (score > 5)
        if (relevanceScore > 5) {
          const persona = suggestPersona(post);
          const suggestedResponse = generateSuggestedResponse(post, persona);
          
          const keywords = MARINERS_KEYWORDS.filter(keyword =>
            (post.title + ' ' + (post.selftext || '')).toLowerCase().includes(keyword.toLowerCase())
          );
          
          opportunities.push({
            id: post.id,
            type: 'post',
            subreddit: post.subreddit,
            title: post.title,
            content: post.selftext || '',
            url: post.permalink,
            relevanceScore,
            suggestedPersona: persona,
            suggestedResponse,
            keywords,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process /r/${subreddit}:`, error);
    }
  }
  
  // Sort by relevance score (highest first)
  return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Monitor for mentions of TridentFans or our usernames
 */
export async function monitorMentions(): Promise<EngagementOpportunity[]> {
  const searches = [
    'tridentfans',
    'trident fans', 
    'mariners community',
    'mariners forum'
  ];
  
  const opportunities: EngagementOpportunity[] = [];
  
  for (const query of searches) {
    try {
      const posts = await searchMarinersContent(query, undefined, 'week');
      
      for (const post of posts) {
        // High relevance for direct mentions
        const relevanceScore = 20 + calculateRelevanceScore(post);
        
        opportunities.push({
          id: post.id,
          type: 'post',
          subreddit: post.subreddit,
          title: post.title,
          content: post.selftext || '',
          url: post.permalink,
          relevanceScore,
          suggestedPersona: 'mark',
          suggestedResponse: "Thanks for the mention! Always happy to chat M's with fellow fans.",
          keywords: [query],
        });
      }
    } catch (error) {
      console.error(`Failed to search for mentions of "${query}":`, error);
    }
  }
  
  return opportunities;
}

/**
 * Get trending Mariners topics for content ideas
 */
export async function getTrendingTopics(): Promise<{ topic: string; count: number; posts: RedditPost[] }[]> {
  const allPosts: RedditPost[] = [];
  
  // Gather posts from all subreddits
  for (const subreddit of TARGET_SUBREDDITS) {
    try {
      const posts = await getHotPosts(subreddit, 20);
      const marinersposts = posts.filter(post => {
        const content = (post.title + ' ' + (post.selftext || '')).toLowerCase();
        return MARINERS_KEYWORDS.some(keyword => 
          content.includes(keyword.toLowerCase())
        );
      });
      allPosts.push(...marinersPosts);
    } catch (error) {
      console.error(`Failed to get trending from /r/${subreddit}:`, error);
    }
  }
  
  // Extract topics and count frequency
  const topicCounts = new Map<string, RedditPost[]>();
  
  for (const post of allPosts) {
    for (const keyword of MARINERS_KEYWORDS) {
      const content = (post.title + ' ' + (post.selftext || '')).toLowerCase();
      if (content.includes(keyword.toLowerCase())) {
        if (!topicCounts.has(keyword)) {
          topicCounts.set(keyword, []);
        }
        topicCounts.get(keyword)!.push(post);
      }
    }
  }
  
  // Return sorted by frequency
  return Array.from(topicCounts.entries())
    .map(([topic, posts]) => ({
      topic,
      count: posts.length,
      posts: posts.slice(0, 5), // Top 5 posts for this topic
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 trending topics
}

/**
 * Enhanced human writing patterns for responses
 */
export const HUMAN_WRITING_PATTERNS = {
  mark: {
    starters: ["Been thinking about this...", "You know what's wild?", "Honestly,", "Man,", "Like,"],
    fillers: ["you know", "I mean", "like", "honestly", "for real"],
    enders: ["Go M's", "What do you think?", "Anyone else feel this way?", "Just my two cents"],
    mistakes: ["its/it's confusion", "missing apostrophes", "run-on sentences"],
    reactions: ["Dude.", "No way.", "This.", "Exactly.", "For real though."]
  },
  hammy: {
    starters: ["Looking at this deal...", "From a roster perspective,", "Here's the thing -", "Called this one"],
    fillers: ["obviously", "clearly", "in my opinion", "the way I see it"],
    enders: ["Thoughts?", "What am I missing?", "That's my read anyway", "Time will tell"],
    mistakes: ["occasional typos", "incomplete sentences when excited"],
    reactions: ["Yep.", "Nailed it.", "Exactly right.", "This is it."]
  },
  spartan: {
    starters: ["Actually,", "Here's where you're wrong:", "The numbers say", "Unpopular opinion:"],
    fillers: ["obviously", "clearly", "let's be honest", "the data shows"],
    enders: ["Fight me.", "Change my mind.", "The stats don't lie.", "Prove me wrong."],
    mistakes: ["overly confident", "sometimes wrong but never admits it"],
    reactions: ["Wrong.", "Nope.", "Not even close.", "Please."]
  }
};

export default {
  findEngagementOpportunities,
  monitorMentions,
  getTrendingTopics,
  getHotPosts,
  searchMarinersContent,
  HUMAN_WRITING_PATTERNS
};