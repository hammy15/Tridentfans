'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bookmark, BookmarkCheck, ExternalLink, Trash2, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BookmarkedArticle {
  id: string;
  article_url: string;
  article_title: string;
  article_source: string | null;
  article_image: string | null;
  article_summary: string | null;
  created_at: string;
}

interface NewsBookmarksProps {
  showAll?: boolean;
}

export function NewsBookmarks({ showAll = false }: NewsBookmarksProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchBookmarks() {
    try {
      const res = await fetch(`/api/bookmarks?userId=${user?.id}`);
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    }
    setLoading(false);
  }

  async function removeBookmark(bookmarkId: string) {
    try {
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkId, userId: user?.id }),
      });
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sign in to save bookmarks
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  const displayBookmarks = showAll ? bookmarks : bookmarks.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved Articles ({bookmarks.length})
        </h3>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved articles yet</p>
            <p className="text-sm mt-2">Bookmark articles from the News page to save them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="overflow-hidden">
              <div className="flex">
                {bookmark.article_image && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={bookmark.article_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={bookmark.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-mariners-teal line-clamp-2"
                      >
                        {bookmark.article_title}
                      </a>
                      {bookmark.article_source && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {bookmark.article_source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeBookmark(bookmark.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                      <a
                        href={bookmark.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                  {bookmark.article_summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {bookmark.article_summary}
                    </p>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}

          {!showAll && bookmarks.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              And {bookmarks.length - 5} more saved articles...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Bookmark button for individual articles
interface BookmarkButtonProps {
  articleUrl: string;
  articleTitle: string;
  articleSource?: string;
  articleImage?: string;
  articleSummary?: string;
  className?: string;
}

export function BookmarkButton({
  articleUrl,
  articleTitle,
  articleSource,
  articleImage,
  articleSummary,
  className,
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkBookmark();
    }
  }, [user, articleUrl]);

  async function checkBookmark() {
    try {
      const res = await fetch(`/api/bookmarks?userId=${user?.id}`);
      const data = await res.json();
      const bookmarked = data.bookmarks?.some(
        (b: BookmarkedArticle) => b.article_url === articleUrl
      );
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Failed to check bookmark:', error);
    }
  }

  async function toggleBookmark() {
    if (!user) {
      alert('Please sign in to save bookmarks');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        // Find and remove bookmark
        const res = await fetch(`/api/bookmarks?userId=${user.id}`);
        const data = await res.json();
        const bookmark = data.bookmarks?.find(
          (b: BookmarkedArticle) => b.article_url === articleUrl
        );
        if (bookmark) {
          await fetch('/api/bookmarks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookmarkId: bookmark.id, userId: user.id }),
          });
        }
        setIsBookmarked(false);
      } else {
        // Add bookmark
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            articleUrl,
            articleTitle,
            articleSource,
            articleImage,
            articleSummary,
          }),
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={toggleBookmark}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-mariners-teal" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
}

// Share to forum button
interface ShareToForumButtonProps {
  articleUrl: string;
  articleTitle: string;
  articleSummary?: string;
}

export function ShareToForumButton({
  articleUrl,
  articleTitle,
  articleSummary,
}: ShareToForumButtonProps) {
  const { user } = useAuth();

  function handleShare() {
    if (!user) {
      alert('Please sign in to share to forum');
      return;
    }

    // Build forum post URL with pre-filled content
    const content = `${articleSummary || ''}\n\n[Read more](${articleUrl})`;
    const params = new URLSearchParams({
      title: articleTitle,
      content: content,
    });

    window.location.href = `/forum?newPost=true&${params.toString()}`;
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-1" />
      Share
    </Button>
  );
}
