/**
 * Mariners News Aggregation & Content Creation System
 * Monitors all major sources, creates engaging posts with proper citations
 */

import { web_search, web_fetch } from '@/lib/web-tools';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// News sources Mark monitors
export const NEWS_SOURCES = {
  tier1: [
    {
      name: 'MLB.com Mariners',
      url: 'https://www.mlb.com/mariners/news',
      reliability: 'official',
      checkFrequency: 'every 30 minutes'
    },
    {
      name: 'Seattle Times (Ryan Divish)',
      url: 'https://www.seattletimes.com/sports/mariners/',
      reliability: 'beat reporter',
      checkFrequency: 'every hour'
    },
    {
      name: 'The Athletic',
      url: 'https://theathletic.com/team/mariners/',
      reliability: 'premium analysis',
      checkFrequency: 'twice daily'
    }
  ],
  tier2: [
    {
      name: 'Lookout Landing',
      url: 'https://www.lookoutlanding.com/',
      reliability: 'fan community',
      checkFrequency: 'daily'
    },
    {
      name: 'ESPN Seattle',
      url: 'https://www.espn.com/mlb/team/_/name/sea',
      reliability: 'mainstream media',
      checkFrequency: 'daily'
    }
  ],
  social: [
    {
      name: '@Mariners',
      platform: 'twitter',
      reliability: 'official',
      checkFrequency: 'real-time'
    },
    {
      name: '@RyanDivish',
      platform: 'twitter', 
      reliability: 'beat reporter',
      checkFrequency: 'real-time'
    }
  ]
};

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  published: string;
  reliability: 'official' | 'beat reporter' | 'analysis' | 'fan community' | 'social media';
  category: 'breaking' | 'roster' | 'analysis' | 'game recap' | 'prospect' | 'trade rumor';
  impact_level: 'high' | 'medium' | 'low';
  requires_response: boolean;
  mark_analysis?: string;
  community_post?: string;
}

/**
 * Mark's news monitoring system
 */
export async function monitorMarinersNews(): Promise<NewsItem[]> {
  const news: NewsItem[] = [];
  
  try {
    // Search for recent Mariners news
    const searchResults = await web_search({
      query: 'Seattle Mariners news trade roster prospect 2026',
      count: 10,
      freshness: 'pd' // past day
    });

    for (const result of searchResults.results || []) {
      if (isMarinersRelevant(result.title, result.snippet)) {
        const newsItem = await processNewsItem(result);
        if (newsItem) {
          news.push(newsItem);
        }
      }
    }

    // Monitor specific high-priority terms
    const prioritySearches = [
      'Seattle Mariners trade rumors',
      'Seattle Mariners roster moves', 
      'Jerry Dipoto trade',
      'Mariners prospect call up',
      'Scott Servais manager'
    ];

    for (const query of prioritySearches) {
      const results = await web_search({ query, count: 5, freshness: 'pd' });
      for (const result of results.results || []) {
        const newsItem = await processNewsItem(result, true);
        if (newsItem) {
          news.push(newsItem);
        }
      }
    }

  } catch (error) {
    console.error('Error monitoring news:', error);
  }

  // Sort by impact level and recency
  return news.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    if (impactOrder[a.impact_level] !== impactOrder[b.impact_level]) {
      return impactOrder[b.impact_level] - impactOrder[a.impact_level];
    }
    return new Date(b.published).getTime() - new Date(a.published).getTime();
  });
}

/**
 * Process individual news item and determine significance
 */
async function processNewsItem(searchResult: any, isPriority = false): Promise<NewsItem | null> {
  try {
    const content = await web_fetch({
      url: searchResult.url,
      extractMode: 'text',
      maxChars: 2000
    });

    if (!content.text || content.text.length < 100) {
      return null; // Not enough content
    }

    const newsItem: NewsItem = {
      id: generateNewsId(searchResult.url),
      title: cleanTitle(searchResult.title),
      content: content.text.substring(0, 500) + '...',
      source: extractSourceName(searchResult.url),
      url: searchResult.url,
      published: new Date().toISOString(), // Would extract from article if available
      reliability: determineReliability(searchResult.url),
      category: categorizeNews(searchResult.title, content.text),
      impact_level: determineImpactLevel(searchResult.title, content.text, isPriority),
      requires_response: requiresImmediateResponse(searchResult.title, content.text)
    };

    // Generate Mark's analysis if high impact
    if (newsItem.impact_level === 'high') {
      newsItem.mark_analysis = await generateMarkAnalysis(newsItem);
      newsItem.community_post = await generateCommunityPost(newsItem);
    }

    return newsItem;

  } catch (error) {
    console.error('Error processing news item:', error);
    return null;
  }
}

/**
 * Generate Mark's analysis of news item
 */
async function generateMarkAnalysis(newsItem: NewsItem): Promise<string> {
  const analysisPrompts = {
    'roster': `Analyze this Mariners roster move from Mark's perspective. How does this impact the team? What does it mean for 2026?`,
    'trade rumor': `Mark reacts to this trade rumor. Is it realistic? Would it be good for the team? What's Jerry thinking?`,
    'prospect': `Mark's take on this prospect news. Timeline for MLB impact? How excited should fans be?`,
    'breaking': `Breaking Mariners news requires Mark's immediate reaction. What's his first take?`,
    'game recap': `Mark's post-game analysis. What were the key factors? How does this affect the bigger picture?`
  };

  const prompt = analysisPrompts[newsItem.category] || 'Mark provides his expert analysis of this Mariners development.';
  
  // In a real implementation, this would use AI to generate Mark's authentic voice
  return `Mark's Take: ${prompt}. This ${newsItem.impact_level} impact news requires community discussion.`;
}

/**
 * Generate community post content
 */
async function generateCommunityPost(newsItem: NewsItem): Promise<string> {
  const sourceCredit = `**Source:** [${newsItem.source}](${newsItem.url})`;
  
  const postTemplate = `# ${newsItem.title}

${newsItem.content}

${sourceCredit}

---

## Mark's Take

${newsItem.mark_analysis}

**What do you think?** Drop your reactions and analysis below.

**Go M's!** ⚓`;

  return postTemplate;
}

/**
 * Utility functions for news processing
 */
function isMarinersRelevant(title: string, snippet: string): boolean {
  const marinersTerms = [
    'mariners', 'seattle', 'm\'s', 'jerry dipoto', 'scott servais',
    'julio rodriguez', 'cal raleigh', 'logan gilbert', 'george kirby',
    't-mobile park', 'safeco', 'randy arozarena', 'josh naylor'
  ];
  
  const text = (title + ' ' + snippet).toLowerCase();
  return marinersTerms.some(term => text.includes(term));
}

function determineReliability(url: string): NewsItem['reliability'] {
  if (url.includes('mlb.com')) return 'official';
  if (url.includes('seattletimes.com') || url.includes('theathletic.com')) return 'beat reporter';
  if (url.includes('espn.com') || url.includes('lookoutlanding.com')) return 'analysis';
  if (url.includes('twitter.com') || url.includes('reddit.com')) return 'social media';
  return 'fan community';
}

function categorizeNews(title: string, content: string): NewsItem['category'] {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('trade') || text.includes('acquire') || text.includes('sign')) return 'roster';
  if (text.includes('prospect') || text.includes('call up') || text.includes('minor league')) return 'prospect';
  if (text.includes('rumor') || text.includes('speculation')) return 'trade rumor';
  if (text.includes('game') || text.includes('final') || text.includes('score')) return 'game recap';
  if (text.includes('breaking') || text.includes('announce')) return 'breaking';
  return 'analysis';
}

function determineImpactLevel(title: string, content: string, isPriority: boolean): NewsItem['impact_level'] {
  if (isPriority) return 'high';
  
  const text = (title + ' ' + content).toLowerCase();
  
  // High impact keywords
  if (text.includes('trade') || text.includes('sign') || text.includes('fire') || 
      text.includes('injury') || text.includes('suspension') || text.includes('breaking')) {
    return 'high';
  }
  
  // Medium impact keywords  
  if (text.includes('rumor') || text.includes('prospect') || text.includes('call up') ||
      text.includes('lineup') || text.includes('rotation')) {
    return 'medium';
  }
  
  return 'low';
}

function requiresImmediateResponse(title: string, content: string): boolean {
  const urgentKeywords = ['breaking', 'trade', 'sign', 'fire', 'injury', 'suspension'];
  const text = (title + ' ' + content).toLowerCase();
  return urgentKeywords.some(keyword => text.includes(keyword));
}

function generateNewsId(url: string): string {
  return `news-${Date.now()}-${url.split('/').pop()?.substring(0, 10)}`;
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim();
}

function extractSourceName(url: string): string {
  const domain = new URL(url).hostname;
  const sourceMap: Record<string, string> = {
    'mlb.com': 'MLB.com',
    'seattletimes.com': 'Seattle Times',
    'theathletic.com': 'The Athletic',
    'espn.com': 'ESPN',
    'lookoutlanding.com': 'Lookout Landing',
    'twitter.com': 'Twitter',
    'reddit.com': 'Reddit'
  };
  
  for (const [domain_key, name] of Object.entries(sourceMap)) {
    if (domain.includes(domain_key)) return name;
  }
  
  return domain;
}

/**
 * Store news items in database for tracking
 */
export async function storeNewsItem(newsItem: NewsItem): Promise<void> {
  try {
    await supabase
      .from('news_items')
      .insert({
        news_id: newsItem.id,
        title: newsItem.title,
        content: newsItem.content,
        source: newsItem.source,
        url: newsItem.url,
        published_at: newsItem.published,
        reliability: newsItem.reliability,
        category: newsItem.category,
        impact_level: newsItem.impact_level,
        requires_response: newsItem.requires_response,
        mark_analysis: newsItem.mark_analysis,
        community_post: newsItem.community_post,
        created_at: new Date().toISOString()
      })
      .onConflict('news_id');
  } catch (error) {
    console.error('Error storing news item:', error);
  }
}

/**
 * Create community post from news item
 */
export async function createCommunityPostFromNews(newsItem: NewsItem): Promise<string | null> {
  if (!newsItem.community_post) return null;
  
  try {
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        title: newsItem.title,
        content: newsItem.community_post,
        author_display_name: 'Mark',
        author_emoji: '⚓',
        category: 'Mariners News',
        tags: [newsItem.category, newsItem.source.toLowerCase()],
        is_news_post: true,
        news_source_url: newsItem.url,
        user_id: 'system-mark-id'
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return post.id;
  } catch (error) {
    console.error('Error creating community post:', error);
    return null;
  }
}

export default {
  monitorMarinersNews,
  storeNewsItem,
  createCommunityPostFromNews,
  NEWS_SOURCES
};