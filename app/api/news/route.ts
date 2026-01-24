import { NextResponse } from 'next/server';

// News sources for Mariners
const NEWS_SOURCES = [
  { name: 'MLB.com Mariners', url: 'https://www.mlb.com/mariners/news' },
  { name: 'Seattle Times Sports', url: 'https://www.seattletimes.com/sports/mariners/' },
  { name: 'r/Mariners', url: 'https://www.reddit.com/r/Mariners/' },
];

// Mock news data - in production this would scrape/aggregate from sources
const mockNewsData = [
  {
    id: '1',
    title: 'Mariners announce Spring Training schedule',
    summary:
      'The Seattle Mariners have released their 2026 Spring Training schedule, featuring games against divisional rivals and interleague opponents.',
    source: 'MLB.com',
    url: 'https://mlb.com/mariners/news',
    category: 'news',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Julio Rodriguez leads AL in spring training power numbers',
    summary: 'The young star continues to impress as the Mariners prepare for opening day.',
    source: 'Seattle Times',
    url: 'https://seattletimes.com/sports/mariners',
    category: 'news',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Prospect Watch: Top 10 Mariners prospects for 2026',
    summary:
      'A look at the brightest young stars in the Mariners farm system and their projected timelines to the majors.',
    source: 'MLB Pipeline',
    url: 'https://mlb.com/mariners/prospects',
    category: 'analysis',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '4',
    title: 'T-Mobile Park upgrades announced for 2026 season',
    summary:
      'New amenities, improved concessions, and enhanced fan experiences coming to the ballpark this season.',
    source: 'MLB.com',
    url: 'https://mlb.com/mariners/ballpark',
    category: 'news',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Analysis: Mariners rotation depth is best in franchise history',
    summary:
      'With Gilbert, Kirby, and a deep bullpen, the Mariners pitching staff is primed for a dominant 2026 campaign.',
    source: 'FanGraphs',
    url: 'https://fangraphs.com',
    category: 'analysis',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '6',
    title: 'Cal Raleigh named to All-Star game for second straight year',
    summary: 'Big Dumper continues to be one of the best catchers in baseball.',
    source: 'MLB.com',
    url: 'https://mlb.com/mariners/news',
    category: 'news',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '7',
    title: 'George Kirby extension talks underway',
    summary:
      'The Mariners are reportedly in discussions with their young ace about a long-term deal.',
    source: 'Seattle Times',
    url: 'https://seattletimes.com/sports/mariners',
    category: 'trade',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
  {
    id: '8',
    title: 'Mariners trade deadline preview: Needs and targets',
    summary: 'What moves should Seattle make to bolster their playoff push?',
    source: 'The Athletic',
    url: 'https://theathletic.com',
    category: 'trade',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: null,
  },
];

export async function GET() {
  try {
    // Return mock news data
    // In production, this would aggregate from real sources
    return NextResponse.json({
      news: mockNewsData,
      sources: NEWS_SOURCES,
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
