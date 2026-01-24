'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  author?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface UseRealTimeCommentsOptions {
  postId: string;
  enabled?: boolean;
  pollInterval?: number;
}

export function useRealTimeComments({
  postId,
  enabled = true,
  pollInterval = 10000, // 10 seconds default
}: UseRealTimeCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const lastFetchRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComments = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(`/api/forum/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      const newComments = data.post?.comments || [];

      if (isInitial) {
        setComments(newComments);
        lastFetchRef.current = newComments.length > 0
          ? newComments[newComments.length - 1].id
          : null;
      } else {
        // Check for new comments since last fetch
        const lastId = lastFetchRef.current;
        if (lastId) {
          const lastIndex = newComments.findIndex((c: Comment) => c.id === lastId);
          if (lastIndex !== -1 && lastIndex < newComments.length - 1) {
            const addedCount = newComments.length - 1 - lastIndex;
            setNewCommentCount(prev => prev + addedCount);
          }
        }
        setComments(newComments);
        if (newComments.length > 0) {
          lastFetchRef.current = newComments[newComments.length - 1].id;
        }
      }

      setError(null);
    } catch (err) {
      setError('Failed to load comments');
      console.error('Real-time comments error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Initial fetch
  useEffect(() => {
    if (enabled && postId) {
      setLoading(true);
      fetchComments(true);
    }
  }, [postId, enabled, fetchComments]);

  // Polling
  useEffect(() => {
    if (!enabled || !postId) return;

    intervalRef.current = setInterval(() => {
      fetchComments(false);
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [postId, enabled, pollInterval, fetchComments]);

  const addComment = useCallback((comment: Comment) => {
    setComments(prev => [...prev, comment]);
    lastFetchRef.current = comment.id;
  }, []);

  const clearNewCount = useCallback(() => {
    setNewCommentCount(0);
  }, []);

  const refresh = useCallback(() => {
    fetchComments(false);
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    newCommentCount,
    addComment,
    clearNewCount,
    refresh,
  };
}

// Hook for real-time post updates on forum list
export function useRealTimePosts(categoryId?: string, pollInterval = 30000) {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostCount, setNewPostCount] = useState(0);
  const lastPostIdRef = useRef<string | null>(null);

  const fetchPosts = useCallback(async (isInitial = false) => {
    try {
      let url = '/api/forum?type=posts&limit=20';
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      const newPosts = data.posts || [];

      if (isInitial) {
        setPosts(newPosts);
        lastPostIdRef.current = newPosts.length > 0 ? newPosts[0].id : null;
      } else {
        // Check for new posts
        const lastId = lastPostIdRef.current;
        if (lastId && newPosts.length > 0) {
          const lastIndex = newPosts.findIndex((p: { id: string }) => p.id === lastId);
          if (lastIndex > 0) {
            setNewPostCount(prev => prev + lastIndex);
          }
        }
        setPosts(newPosts);
        if (newPosts.length > 0) {
          lastPostIdRef.current = newPosts[0].id;
        }
      }
    } catch (err) {
      console.error('Real-time posts error:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    setLoading(true);
    fetchPosts(true);
  }, [categoryId, fetchPosts]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [categoryId, pollInterval, fetchPosts]);

  const clearNewCount = useCallback(() => {
    setNewPostCount(0);
    fetchPosts(true);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    newPostCount,
    clearNewCount,
    refresh: () => fetchPosts(false),
  };
}
