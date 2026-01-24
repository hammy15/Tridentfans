'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  Plus,
  Search,
  TrendingUp,
  X,
  Loader2,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { ForumCategory, ForumPost } from '@/types';

// Mock data for when database is empty
const mockCategories = [
  {
    id: 'game-day',
    name: 'Game Day',
    slug: 'game-day',
    icon: '🏟️',
    description: '',
    sort_order: 1,
  },
  {
    id: 'general',
    name: 'General Discussion',
    slug: 'general',
    icon: '💬',
    description: '',
    sort_order: 2,
  },
  {
    id: 'trade-talk',
    name: 'Trade Talk',
    slug: 'trade-talk',
    icon: '🔄',
    description: '',
    sort_order: 3,
  },
  {
    id: 'roster',
    name: 'Roster Analysis',
    slug: 'roster',
    icon: '📊',
    description: '',
    sort_order: 4,
  },
  {
    id: 'stadium',
    name: 'Stadium & Tickets',
    slug: 'stadium',
    icon: '🎟️',
    description: '',
    sort_order: 5,
  },
  {
    id: 'off-topic',
    name: 'Off Topic',
    slug: 'off-topic',
    icon: '🎮',
    description: '',
    sort_order: 6,
  },
];

const mockPosts = [
  {
    id: 'mock-1',
    title: 'Game Day Thread: Mariners vs Angels - Jan 25',
    content: "Let's go! First game of the series. What are your predictions?",
    author: { username: 'SeattleSogKing' },
    category: { name: 'Game Day', slug: 'game-day', icon: '🏟️' },
    upvotes: 45,
    comment_count: 234,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Julio Rodriguez extension discussion',
    content: "With Julio's performance this season, what do you think a fair extension looks like?",
    author: { username: 'JulioFan2024' },
    category: { name: 'Trade Talk', slug: 'trade-talk', icon: '🔄' },
    upvotes: 89,
    comment_count: 67,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Best food spots at T-Mobile Park?',
    content: 'Taking my dad to his first game next month. What are the must-try food spots?',
    author: { username: 'NewFan2026' },
    category: { name: 'Stadium & Tickets', slug: 'stadium', icon: '🎟️' },
    upvotes: 23,
    comment_count: 45,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    title: 'George Kirby appreciation thread',
    content: 'Can we just talk about how dominant Kirby has been? His control is absolutely elite.',
    author: { username: 'TrueToTheBlue' },
    category: { name: 'General Discussion', slug: 'general', icon: '💬' },
    upvotes: 67,
    comment_count: 34,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ForumPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '' });

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/forum?type=categories');
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          setCategories(mockCategories as ForumCategory[]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(mockCategories as ForumCategory[]);
      }
    }
    fetchCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const url = selectedCategory
          ? `/api/forum?type=posts&categoryId=${selectedCategory}`
          : '/api/forum?type=posts';
        const res = await fetch(url);
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts(mockPosts as unknown as ForumPost[]);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        setPosts(mockPosts as unknown as ForumPost[]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, [selectedCategory]);

  const filteredPosts = posts.filter(post => {
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreatePost = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          categoryId: newPost.category,
          title: newPost.title,
          content: newPost.content,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPosts([data.post, ...posts]);
        setShowNewPost(false);
        setNewPost({ title: '', content: '', category: '' });
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-mariners-teal" />
            Forum
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join the conversation with fellow Mariners fans
          </p>
        </div>
        {user ? (
          <Button variant="mariners" onClick={() => setShowNewPost(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        ) : (
          <Link href="/auth/login">
            <Button variant="mariners">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to Post
            </Button>
          </Link>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Post</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowNewPost(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newPost.category}
                  onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share your thoughts..."
                  rows={5}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
                <Button
                  variant="mariners"
                  className="flex-1"
                  onClick={handleCreatePost}
                  disabled={!newPost.title || !newPost.content || !newPost.category || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  !selectedCategory ? 'bg-mariners-teal text-white' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>All Posts</span>
                </div>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === cat.id ? 'bg-mariners-teal text-white' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Trending */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">#JulioExtension</p>
                <p className="text-muted-foreground">89 posts</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">#SpringTraining2026</p>
                <p className="text-muted-foreground">45 posts</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">#GoMariners</p>
                <p className="text-muted-foreground">234 posts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Posts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Link key={post.id} href={`/forum/post/${post.id}`}>
                  <Card className="transition-all hover:shadow-md cursor-pointer mb-4">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar
                          fallback={post.author?.username?.[0] || '?'}
                          className="h-10 w-10"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
                          <p className="mt-2 text-muted-foreground line-clamp-2">{post.content}</p>
                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-medium">
                              {post.author?.username || 'Anonymous'}
                            </span>
                            {post.category && (
                              <Badge variant="secondary">
                                {post.category.icon} {post.category.name}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ThumbsUp className="h-4 w-4" />
                              {post.upvotes}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              {post.comment_count || 0}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {formatTimeAgo(post.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No posts found</p>
                  {user && (
                    <Button
                      variant="mariners"
                      className="mt-4"
                      onClick={() => setShowNewPost(true)}
                    >
                      Create the first post
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
