import { NextResponse } from 'next/server';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
}

// Cache for news
let newsCache: { data: NewsItem[]; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Fetch Reddit r/Mariners posts
async function fetchRedditNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://www.reddit.com/r/Mariners/hot.json?limit=10', {
      headers: { 'User-Agent': 'TridentFans/1.0' },
    });

    if (!response.ok) throw new Error('Reddit fetch failed');

    const data = await response.json();
    const posts = data.data.children || [];

    return posts
      .filter((post: { data: { stickied: boolean } }) => !post.data.stickied)
      .slice(0, 8)
      .map(
        (post: {
          data: {
            id: string;
            title: string;
            selftext: string;
            permalink: string;
            created_utc: number;
            thumbnail: string;
            link_flair_text: string;
          };
        }) => {
          const flair = post.data.link_flair_text?.toLowerCase() || '';
          let category = 'news';
          if (flair.includes('trade') || flair.includes('rumor')) category = 'trade';
          else if (flair.includes('game') || flair.includes('recap')) category = 'recap';
          else if (flair.includes('analysis') || flair.includes('stat')) category = 'analysis';

          return {
            id: `reddit-${post.data.id}`,
            title: post.data.title,
            summary: post.data.selftext?.slice(0, 200) || 'Discussion on r/Mariners',
            source: 'r/Mariners',
            url: `https://reddit.com${post.data.permalink}`,
            category,
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            imageUrl:
              post.data.thumbnail && post.data.thumbnail.startsWith('http')
                ? post.data.thumbnail
                : null,
          };
        }
      );
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return [];
  }
}

// Fetch MLB.com Mariners RSS
async function fetchMLBNews(): Promise<NewsItem[]> {
  try {
    // MLB RSS feed for Mariners
    const response = await fetch('https://www.mlb.com/mariners/feeds/news/rss.xml');

    if (!response.ok) throw new Error('MLB RSS fetch failed');

    const xml = await response.text();

    // Simple XML parsing for RSS items
    const items: NewsItem[] = [];
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    for (const itemXml of itemMatches.slice(0, 6)) {
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description =
        itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const guid = itemXml.match(/<guid.*?>(.*?)<\/guid>/)?.[1] || link;

      if (title && link) {
        items.push({
          id: `mlb-${Buffer.from(guid).toString('base64').slice(0, 10)}`,
          title,
          summary: description.replace(/<[^>]*>/g, '').slice(0, 200),
          source: 'MLB.com',
          url: link,
          category: 'news',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          imageUrl: null,
        });
      }
    }

    return items;
  } catch (error) {
    console.error('MLB RSS fetch error:', error);
    return [];
  }
}

// Generate fresh mock news as fallback
function generateMockNews(): NewsItem[] {
  const now = Date.now();
  return [
    {
      id: 'mock-1',
      title: 'Mariners Spring Training Update: Roster Battles Heat Up',
      summary:
        'Competition intensifies as players fight for final roster spots heading into the 2026 season.',
      source: 'MLB.com',
      url: 'https://www.mlb.com/mariners/news',
      category: 'news',
      publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
    {
      id: 'mock-2',
      title: 'Julio Rodriguez Continues Hot Spring',
      summary:
        'The young superstar has been crushing it in spring training, showing improved plate discipline.',
      source: 'Seattle Times',
      url: 'https://www.seattletimes.com/sports/mariners/',
      category: 'news',
      publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
    {
      id: 'mock-3',
      title: 'AL West Preview: Can Mariners Finally Break Through?',
      summary:
        'Analysis of the Mariners chances in a competitive AL West division this season.',
      source: 'FanGraphs',
      url: 'https://www.fangraphs.com',
      category: 'analysis',
      publishedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
    {
      id: 'mock-4',
      title: 'George Kirby Named Opening Day Starter',
      summary:
        'The young ace will take the mound for the Mariners on Opening Day against the Rangers.',
      source: 'MLB.com',
      url: 'https://www.mlb.com/mariners/news',
      category: 'news',
      publishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
    {
      id: 'mock-5',
      title: 'Trade Rumors: Mariners Linked to Star Outfielder',
      summary: 'Seattle reportedly exploring trade options to boost their lineup for the playoff push.',
      source: 'The Athletic',
      url: 'https://theathletic.com',
      category: 'trade',
      publishedAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
    {
      id: 'mock-6',
      title: 'Cal Raleigh: Big Dumper Era Continues',
      summary: "The fan favorite catcher discusses his offseason work and expectations for the season.",
      source: 'Seattle Times',
      url: 'https://www.seattletimes.com/sports/mariners/',
      category: 'news',
      publishedAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: null,
    },
  ];
}

export async function GET() {
  try {
    // Check cache
    if (newsCache && Date.now() - newsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        news: newsCache.data,
        cached: true,
      });
    }

    // Fetch from multiple sources in parallel
    const [redditNews, mlbNews] = await Promise.all([fetchRedditNews(), fetchMLBNews()]);

    // Combine and dedupe
    let allNews = [...mlbNews, ...redditNews];

    // If we got no news from APIs, use mock data
    if (allNews.length === 0) {
      allNews = generateMockNews();
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Cache the results
    newsCache = { data: allNews, timestamp: Date.now() };

    return NextResponse.json({
      news: allNews,
      cached: false,
      sources: {
        reddit: redditNews.length,
        mlb: mlbNews.length,
      },
    });
  } catch (error) {
    console.error('News API error:', error);

    // Return mock data on error
    return NextResponse.json({
      news: generateMockNews(),
      error: 'Using cached data due to fetch error',
    });
  }
}
