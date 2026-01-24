import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ExternalLink, Clock, Filter } from 'lucide-react';

// Mock news data
const mockNews = [
  {
    id: '1',
    title: 'Mariners announce Spring Training schedule',
    summary:
      'The Seattle Mariners have released their 2026 Spring Training schedule, featuring games against divisional rivals and interleague opponents.',
    source: 'MLB.com',
    url: 'https://mlb.com/mariners',
    category: 'news',
    publishedAt: '2 hours ago',
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Julio Rodriguez signs historic extension',
    summary:
      'The Mariners have locked up their superstar centerfielder with a long-term contract extension that will keep him in Seattle for years to come.',
    source: 'Seattle Times',
    url: 'https://seattletimes.com',
    category: 'trade',
    publishedAt: '5 hours ago',
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Prospect Watch: Top 10 Mariners prospects for 2026',
    summary:
      'A look at the brightest young stars in the Mariners farm system and their projected timelines to the majors.',
    source: 'The Athletic',
    url: 'https://theathletic.com',
    category: 'analysis',
    publishedAt: '1 day ago',
    imageUrl: null,
  },
  {
    id: '4',
    title: 'T-Mobile Park upgrades announced for 2026 season',
    summary:
      'New amenities, improved concessions, and enhanced fan experiences coming to the ballpark this season.',
    source: 'MLB.com',
    url: 'https://mlb.com/mariners',
    category: 'news',
    publishedAt: '2 days ago',
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
    publishedAt: '3 days ago',
    imageUrl: null,
  },
];

const categories = [
  { id: 'all', name: 'All News' },
  { id: 'news', name: 'News' },
  { id: 'trade', name: 'Trades' },
  { id: 'game', name: 'Game Recaps' },
  { id: 'analysis', name: 'Analysis' },
];

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-mariners-teal" />
          News
        </h1>
        <p className="mt-2 text-muted-foreground">
          Stay up to date with the latest Mariners news and analysis
        </p>
      </div>

      {/* Categories Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button key={cat.id} variant={cat.id === 'all' ? 'mariners' : 'outline'} size="sm">
            {cat.name}
          </Button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockNews.map(article => (
          <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {article.imageUrl && (
              <div className="aspect-video bg-muted">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!article.imageUrl && (
              <div className="aspect-video bg-gradient-to-br from-mariners-navy to-mariners-teal flex items-center justify-center">
                <span className="text-6xl opacity-20">🔱</span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant={
                    article.category === 'trade'
                      ? 'mariners'
                      : article.category === 'analysis'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {article.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.publishedAt}
                </span>
              </div>
              <CardTitle className="line-clamp-2">{article.title}</CardTitle>
              <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{article.source}</span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mariners-teal hover:text-mariners-navy transition-colors inline-flex items-center gap-1 text-sm font-medium"
                >
                  Read More
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <Button variant="outline" size="lg">
          Load More News
        </Button>
      </div>
    </div>
  );
}
