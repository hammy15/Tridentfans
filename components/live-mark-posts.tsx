'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';

interface LivePost {
  id: string;
  timestamp: string;
  author: string;
  title?: string;
  parent_post?: string;
  content: string;
  replies?: any[];
}

export function LiveMarkPosts() {
  const [posts, setPosts] = useState<LivePost[]>([]);

  useEffect(() => {
    // Load Mark's live posts
    const loadPosts = async () => {
      try {
        const [spotlightRes, replyRes] = await Promise.all([
          fetch('/live-posts/julio-spotlight.json'),
          fetch('/live-posts/spring-reply.json')
        ]);

        const posts: LivePost[] = [];
        
        if (spotlightRes.ok) {
          posts.push(await spotlightRes.json());
        }
        
        if (replyRes.ok) {
          posts.push(await replyRes.json());
        }

        setPosts(posts);
      } catch (error) {
        console.error('Failed to load live posts:', error);
      }
    };

    loadPosts();
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="bg-teal-600 text-white">
          🔱 Mark is LIVE - New Content Posted
        </Badge>
      </div>
      
      {posts.map((post) => (
        <Card key={post.id} className="border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-teal-700">{post.author}</span>
                {post.author === 'Mark' && (
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                    Co-founder
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{new Date(post.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            
            {post.title && (
              <CardTitle className="text-xl text-teal-700">{post.title}</CardTitle>
            )}
            
            {post.parent_post && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Reply to:</span> {post.parent_post}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm max-w-none">
              {post.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold text-teal-700 mb-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-semibold text-teal-600 mb-3 mt-6">{line.slice(3)}</h2>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-bold mb-2">{line.slice(2, -2)}</p>;
                }
                if (line.trim() === '') {
                  return <br key={i} />;
                }
                return <p key={i} className="mb-3 leading-relaxed">{line}</p>;
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-teal-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Posted to live TridentFans community
                </span>
                <Badge className="bg-green-100 text-green-700">
                  LIVE NOW
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
        <p className="text-sm text-teal-700">
          🔱 Mark is actively posting to the TridentFans community. Join the discussion and engage with authentic Mariners fan content.
        </p>
      </div>
    </div>
  );
}