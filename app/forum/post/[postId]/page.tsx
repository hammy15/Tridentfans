'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Clock, ArrowLeft, Loader2, LogIn, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ShareButton } from '@/components/common/ShareButton';
import { getForumPostShareData } from '@/lib/share';
import { LiveGameChat } from '@/components/chat/LiveGameChat';
import type { ForumPost, ForumComment } from '@/types';

interface PostWithComments extends ForumPost {
  comments?: ForumComment[];
}

export default function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/forum/${resolvedParams.postId}`);
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      }
      setLoading(false);
    }
    fetchPost();
  }, [resolvedParams.postId]);

  const handleUpvote = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/forum/${resolvedParams.postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upvote' }),
      });
      const data = await res.json();
      if (data.post) {
        setPost({ ...post, upvotes: data.post.upvotes });
      }
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/forum/${resolvedParams.postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          content: newComment,
        }),
      });
      const data = await res.json();
      if (data.comment && post) {
        setPost({
          ...post,
          comments: [...(post.comments || []), data.comment],
        });
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
    setSubmitting(false);
  };

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link href="/forum">
            <Button variant="mariners">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/forum"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Forum
      </Link>

      {/* Post */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex gap-4">
            <Avatar fallback={post.author?.username?.[0] || '?'} className="h-12 w-12" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{post.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium">{post.author?.username || 'Anonymous'}</span>
                {post.category && (
                  <Badge variant="secondary">
                    {post.category.icon} {post.category.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatTimeAgo(post.created_at)}
                </div>
              </div>
              <div className="mt-6 prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleUpvote} className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  {post.upvotes}
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  {post.comments?.length || 0} comments
                </div>
                <ShareButton
                  data={getForumPostShareData({
                    id: post.id,
                    title: post.title,
                    content: post.content,
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Game Chat — shows on game thread posts */}
      {post.is_game_thread && post.mlb_game_id && (
        <Card className="mb-8">
          <CardContent className="p-0">
            <LiveGameChat gameId={String(post.mlb_game_id)} />
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({post.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add comment */}
          {user ? (
            <div className="flex gap-4">
              <Avatar fallback={user.email?.[0] || '?'} className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <Button
                  variant="mariners"
                  size="sm"
                  onClick={handleComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 border rounded-lg">
              <p className="text-muted-foreground mb-2">Sign in to comment</p>
              <Link href="/auth/login">
                <Button variant="mariners" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-6 pt-4 border-t">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar fallback={comment.author?.username?.[0] || '?'} className="h-10 w-10" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.author?.username || 'Anonymous'}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-2 text-muted-foreground"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {comment.upvotes}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
