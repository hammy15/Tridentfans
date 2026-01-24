'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ExternalLink, Clock, Loader2, Bookmark } from 'lucide-react';
import Image from 'next/image';
import { BookmarkButton, ShareToForumButton, NewsBookmarks } from '@/components/news/NewsBookmarks';
import { useAuth } from '@/contexts/AuthContext';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
}

const categories = [
  { id: 'all', name: 'All News' },
  { id: 'news', name: 'News' },
  { id: 'trade', name: 'Trades' },
  { id: 'game', name: 'Game Recaps' },
  { id: 'analysis', name: 'Analysis' },
];

export default function NewsPage() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        if (data.news) {
          setNews(data.news);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
      setLoading(false);
    }
    fetchNews();
  }, []);

  const filteredNews =
    selectedCategory === 'all'
      ? news
      : news.filter(article => article.category === selectedCategory);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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

      {/* Categories Filter & Bookmarks Toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'mariners' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowBookmarks(false);
              }}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        {user && (
          <Button
            variant={showBookmarks ? 'mariners' : 'outline'}
            size="sm"
            onClick={() => setShowBookmarks(!showBookmarks)}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            My Bookmarks
          </Button>
        )}
      </div>

      {/* Bookmarks Section */}
      {showBookmarks && user && (
        <div className="mb-8">
          <NewsBookmarks showAll />
        </div>
      )}

      {/* News Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map(article => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {article.imageUrl ? (
                <div className="aspect-video bg-muted relative">
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-mariners-navy to-mariners-teal flex items-center justify-center">
                  <span className="text-6xl opacity-20">🔱</span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={
                      article.category === 'trade'
                        ? 'default'
                        : article.category === 'analysis'
                          ? 'secondary'
                          : 'outline'
                    }
                    className={article.category === 'trade' ? 'bg-mariners-teal' : ''}
                  >
                    {article.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(article.publishedAt)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                <CardDescription className="line-clamp-3">{article.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{article.source}</span>
                  <div className="flex items-center gap-1">
                    <BookmarkButton
                      articleUrl={article.url}
                      articleTitle={article.title}
                      articleSource={article.source}
                      articleImage={article.imageUrl || undefined}
                      articleSummary={article.summary}
                    />
                    <ShareToForumButton
                      articleUrl={article.url}
                      articleTitle={article.title}
                      articleSummary={article.summary}
                    />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredNews.length === 0 && !loading && (
        <div className="text-center py-12">
          <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No news found in this category</p>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="https://www.mlb.com/mariners/news"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mariners-navy text-white text-lg">
              M
            </div>
            <div>
              <p className="font-medium">MLB.com Mariners</p>
              <p className="text-sm text-muted-foreground">Official team news</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
          <a
            href="https://www.seattletimes.com/sports/mariners/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white text-lg">
              ST
            </div>
            <div>
              <p className="font-medium">Seattle Times</p>
              <p className="text-sm text-muted-foreground">Local coverage</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
          <a
            href="https://www.reddit.com/r/Mariners/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white text-lg">
              R
            </div>
            <div>
              <p className="font-medium">r/Mariners</p>
              <p className="text-sm text-muted-foreground">Reddit community</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
          </a>
        </div>
      </div>
    </div>
  );
}
