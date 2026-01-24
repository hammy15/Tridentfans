'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Pin, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category_id: string;
  user_id: string;
  upvotes: number;
  is_pinned: boolean;
  created_at: string;
  author?: {
    username: string;
    display_name: string | null;
  };
  category?: {
    name: string;
    slug: string;
  };
}

export function ForumModeration({ adminPassword }: { adminPassword: string }) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/forum?limit=20');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
    setLoading(false);
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setActionLoading(postId);
    try {
      const res = await fetch(`/api/forum/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setActionLoading(null);
  }

  async function togglePin(postId: string, currentlyPinned: boolean) {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/forum/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_pinned: !currentlyPinned,
          password: adminPassword,
        }),
      });

      if (res.ok) {
        setPosts(posts.map(p => (p.id === postId ? { ...p, is_pinned: !currentlyPinned } : p)));
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
    setActionLoading(null);
  }

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const recentPosts = posts.filter(p => !p.is_pinned).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{pinnedPosts.length}</p>
            <p className="text-sm text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Reported</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      ) : (
        <>
          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pin className="h-5 w-5" />
                  Pinned Posts ({pinnedPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pinnedPosts.map(post => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {post.author?.display_name || post.author?.username || 'Unknown'} in{' '}
                          {post.category?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePin(post.id, true)}
                          disabled={actionLoading === post.id}
                        >
                          {actionLoading === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Unpin'
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                          disabled={actionLoading === post.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Posts
              </CardTitle>
              <CardDescription>Manage and moderate forum content</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No posts yet</p>
              ) : (
                <div className="space-y-2">
                  {recentPosts.map(post => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{post.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {post.category?.name || 'Unknown'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {post.author?.display_name || post.author?.username || 'Unknown'} •{' '}
                          {new Date(post.created_at).toLocaleDateString()} • {post.upvotes} upvotes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePin(post.id, false)}
                          disabled={actionLoading === post.id}
                        >
                          {actionLoading === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pin className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                          disabled={actionLoading === post.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moderation Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Moderation Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Pin important announcements and game day threads
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Remove spam, harassment, or off-topic content
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Keep discussions civil and Mariners-focused
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
