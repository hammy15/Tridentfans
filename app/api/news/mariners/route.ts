// app/api/news/mariners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail']
  }
});

// News sources for auto-pulling
const NEWS_SOURCES = [
  {
    name: 'MLB.com Mariners',
    url: 'https://www.mlb.com/mariners/news/rss.xml',
    category: 'Official'
  },
  {
    name: 'Seattle Times',
    url: 'https://www.seattletimes.com/sports/mariners/feed/',
    category: 'Beat Reporter'
  },
  // Add more sources as needed
];

export async function GET(request: NextRequest) {
  try {
    const allArticles = await Promise.all(
      NEWS_SOURCES.map(source => fetchFromSource(source))
    );

    // Flatten and sort by date
    const articles = allArticles
      .flat()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20); // Limit to 20 most recent

    return NextResponse.json({ 
      articles,
      lastUpdated: new Date().toISOString(),
      sources: NEWS_SOURCES.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news articles', articles: [] }, 
      { status: 500 }
    );
  }
}

async function fetchFromSource(source: { name: string; url: string; category: string }) {
  try {
    const feed = await parser.parseURL(source.url);
    
    return feed.items.map((item, index) => ({
      id: `${source.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      title: item.title || 'Untitled',
      summary: cleanSummary(item.contentSnippet || item.content || ''),
      url: item.link || '#',
      source: source.name,
      publishedAt: item.pubDate || new Date().toISOString(),
      category: determineCategory(item.title || '', item.contentSnippet || ''),
      thumbnail: extractThumbnail(item)
    }));

  } catch (error) {
    console.error(`Failed to fetch from ${source.name}:`, error);
    return [];
  }
}

function cleanSummary(content: string): string {
  // Remove HTML tags and limit length
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200) + (content.length > 200 ? '...' : '');
}

function determineCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase();
  
  if (text.includes('injury') || text.includes('injured') || text.includes('dl') || text.includes('disabled list')) {
    return 'Injury';
  }
  if (text.includes('trade') || text.includes('traded') || text.includes('acquire') || text.includes('deal')) {
    return 'Trade';
  }
  if (text.includes('prospect') || text.includes('minor league') || text.includes('call up') || text.includes('promote')) {
    return 'Prospect';
  }
  if (text.includes('spring training') || text.includes('cactus league')) {
    return 'Spring Training';
  }
  if (text.includes('breaking') || text.includes('urgent') || text.includes('developing')) {
    return 'Breaking';
  }
  if (text.includes('game') || text.includes('win') || text.includes('loss') || text.includes('score')) {
    return 'Game';
  }
  
  return 'General';
}

function extractThumbnail(item: any): string | null {
  // Extract thumbnail from various RSS formats
  if (item['media:thumbnail']) {
    return item['media:thumbnail'].url || item['media:thumbnail'];
  }
  if (item['media:content']) {
    return item['media:content'].url || item['media:content'];
  }
  if (item.enclosure && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  return null;
}