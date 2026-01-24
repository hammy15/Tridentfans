'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Clock, Plus, Search, TrendingUp, X } from 'lucide-react';

// Mock data
const mockCategories = [
  { id: 'game-day', name: 'Game Day', icon: '🏟️', postCount: 156 },
  { id: 'general', name: 'General Discussion', icon: '💬', postCount: 423 },
  { id: 'trade-talk', name: 'Trade Talk', icon: '🔄', postCount: 89 },
  { id: 'roster', name: 'Roster Analysis', icon: '📊', postCount: 67 },
  { id: 'stadium', name: 'Stadium & Tickets', icon: '🎟️', postCount: 34 },
  { id: 'off-topic', name: 'Off Topic', icon: '🎮', postCount: 112 },
];

const mockPosts = [
  {
    id: '1',
    title: 'Game Day Thread: Mariners vs Angels - Jan 25',
    content:
      "Let's go! First game of the series. What are your predictions? I'm feeling a big game from Julio today.",
    author: { name: 'SeattleSogKing', avatar: null },
    category: 'game-day',
    categoryName: 'Game Day',
    upvotes: 45,
    replies: 234,
    createdAt: '2 hours ago',
    isPinned: true,
  },
  {
    id: '2',
    title: 'Julio Rodriguez extension discussion',
    content:
      "With Julio's performance this season, what do you think a fair extension looks like? 10 years? 12 years?",
    author: { name: 'JulioFan2024', avatar: null },
    category: 'trade-talk',
    categoryName: 'Trade Talk',
    upvotes: 89,
    replies: 67,
    createdAt: '5 hours ago',
    isPinned: false,
  },
  {
    id: '3',
    title: 'Best food spots at T-Mobile Park?',
    content:
      'Taking my dad to his first game next month. What are the must-try food spots at the stadium?',
    author: { name: 'NewFan2026', avatar: null },
    category: 'stadium',
    categoryName: 'Stadium & Tickets',
    upvotes: 23,
    replies: 45,
    createdAt: '1 day ago',
    isPinned: false,
  },
  {
    id: '4',
    title: 'George Kirby appreciation thread',
    content: 'Can we just talk about how dominant Kirby has been? His control is absolutely elite.',
    author: { name: 'TrueToTheBlue', avatar: null },
    category: 'general',
    categoryName: 'General Discussion',
    upvotes: 67,
    replies: 34,
    createdAt: '1 day ago',
    isPinned: false,
  },
];

export default function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '' });

  const filteredPosts = mockPosts.filter(post => {
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreatePost = () => {
    console.log('Creating post:', newPost);
    alert('Post created! (Demo mode)');
    setShowNewPost(false);
    setNewPost({ title: '', content: '', category: '' });
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
        <Button variant="mariners" onClick={() => setShowNewPost(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
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
                  {mockCategories.map(cat => (
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
                  disabled={!newPost.title || !newPost.content || !newPost.category}
                >
                  Post
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
                  <span className="text-sm opacity-70">{mockPosts.length}</span>
                </div>
              </button>
              {mockCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === cat.id ? 'bg-mariners-teal text-white' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-sm opacity-70">{cat.postCount}</span>
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
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Link key={post.id} href={`/forum/post/${post.id}`}>
                <Card
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    post.isPinned ? 'border-mariners-teal' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar fallback={post.author.name.charAt(0)} className="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {post.isPinned && (
                              <Badge variant="mariners" className="mb-2">
                                📌 Pinned
                              </Badge>
                            )}
                            <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
                          </div>
                        </div>
                        <p className="mt-2 text-muted-foreground line-clamp-2">{post.content}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <span className="font-medium">{post.author.name}</span>
                          <Badge variant="secondary">{post.categoryName}</Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ThumbsUp className="h-4 w-4" />
                            {post.upvotes}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            {post.replies}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {post.createdAt}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
