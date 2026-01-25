'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuickPoll } from './QuickPoll';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import type { Poll, PollCategory } from '@/types';

interface PollFeedProps {
  userId?: string;
  initialPolls?: Poll[];
  showFilters?: boolean;
  pageSize?: number;
}

const CATEGORIES: { value: PollCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'game', label: 'Game Day' },
  { value: 'trade', label: 'Trade Talk' },
  { value: 'roster', label: 'Roster' },
  { value: 'general', label: 'General' },
  { value: 'fun', label: 'Fun' },
];

export function PollFeed({
  userId,
  initialPolls = [],
  showFilters = true,
  pageSize = 10
}: PollFeedProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [loading, setLoading] = useState(initialPolls.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState<PollCategory | 'all'>('all');
  const [page, setPage] = useState(0);

  const fetchPolls = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;

    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        active: 'true',
      });

      if (category !== 'all') {
        params.set('category', category);
      }

      const response = await fetch(`/api/polls?${params}`);
      const data = await response.json();

      if (response.ok) {
        const newPolls = data.polls || [];

        if (reset) {
          setPolls(newPolls);
        } else {
          setPolls((prev) => [...prev, ...newPolls]);
        }

        setHasMore(newPolls.length === pageSize);
        if (!reset) {
          setPage((p) => p + 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, page, pageSize]);

  // Initial load and category change
  useEffect(() => {
    fetchPolls(true);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to new polls
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('new-polls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'polls',
        },
        async (payload) => {
          // Fetch the complete poll with options
          const { data: newPoll } = await supabase
            .from('polls')
            .select('*, options:poll_options(*)')
            .eq('id', payload.new.id)
            .single();

          if (newPoll && newPoll.is_active) {
            // Add to top if featured, otherwise to beginning
            setPolls((prev) => {
              if (newPoll.is_featured) {
                const featured = prev.filter(p => p.is_featured);
                const nonFeatured = prev.filter(p => !p.is_featured);
                return [newPoll, ...featured, ...nonFeatured];
              }
              return [newPoll, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleVote = (pollId: string, optionId: string) => {
    // Update local state for immediate feedback
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, vote_count: opt.vote_count + 1 }
              : opt
          ),
          total_votes: poll.total_votes + 1,
        };
      })
    );
  };

  // Separate featured polls
  const featuredPolls = polls.filter(p => p.is_featured);
  const regularPolls = polls.filter(p => !p.is_featured);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? 'mariners' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Featured Polls */}
      {featuredPolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Featured Polls
          </h3>
          {featuredPolls.map((poll) => (
            <QuickPoll
              key={poll.id}
              poll={poll}
              userId={userId}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {/* Regular Polls */}
      {regularPolls.length > 0 && (
        <div className="space-y-4">
          {featuredPolls.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Latest Polls
            </h3>
          )}
          {regularPolls.map((poll) => (
            <QuickPoll
              key={poll.id}
              poll={poll}
              userId={userId}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {polls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No polls available{category !== 'all' ? ` in ${category}` : ''}
          </p>
          <Button
            variant="outline"
            onClick={() => fetchPolls(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Load More */}
      {hasMore && polls.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchPolls(false)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
