// components/news/AutoNewsWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink, Rss } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
}

export function AutoNewsWidget() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news/mariners');
      const data = await response.json();
      setArticles(data.articles || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'breaking': return 'bg-red-500 text-white';
      case 'injury': return 'bg-orange-500 text-white';
      case 'trade': return 'bg-blue-500 text-white';
      case 'prospect': return 'bg-green-500 text-white';
      case 'spring training': return 'bg-mariners-teal text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-mariners-teal animate-spin" />
            Latest Mariners News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Rss className="h-5 w-5 text-mariners-teal" />
          Latest Mariners News
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Updated {formatTimeAgo(lastUpdated.toISOString())}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent news articles</p>
              <p className="text-sm">Check back for spring training updates!</p>
            </div>
          ) : (
            articles.slice(0, 6).map((article) => (
              <div
                key={article.id}
                className="group border rounded-lg p-4 transition-all hover:shadow-md hover:border-mariners-teal/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.source}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(article.publishedAt)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-sm leading-tight mb-2 group-hover:text-mariners-teal transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-lg bg-mariners-teal/10 text-mariners-teal hover:bg-mariners-teal/20 transition-colors"
                    aria-label="Read full article"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        
        {articles.length > 6 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.open('/news', '_blank')}
              className="text-sm text-mariners-teal hover:text-mariners-navy font-medium"
            >
              View All News →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}