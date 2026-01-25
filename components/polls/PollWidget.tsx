'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Users, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';
import type { Poll, PollOption, PollCategory } from '@/types';

interface PollWidgetProps {
  userId?: string;
}

const CATEGORY_STYLES: Record<PollCategory, { bg: string; text: string }> = {
  game: { bg: 'bg-mariners-teal/10', text: 'text-mariners-teal' },
  trade: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  roster: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  general: { bg: 'bg-mariners-navy/10', text: 'text-mariners-navy' },
  fun: { bg: 'bg-purple-500/10', text: 'text-purple-600' },
};

function formatTimeRemaining(endsAt: string): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) return `${Math.floor(hours / 24)}d left`;
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
}

export function PollWidget({ userId }: PollWidgetProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteOptionId, setUserVoteOptionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedPoll() {
      try {
        const response = await fetch('/api/polls?featured=true&limit=1');
        const data = await response.json();

        if (response.ok && data.polls?.length > 0) {
          setPoll(data.polls[0]);

          // Check if user has voted
          if (userId) {
            const supabase = createClient();
            const { data: vote } = await supabase
              .from('poll_votes')
              .select('option_id')
              .eq('poll_id', data.polls[0].id)
              .eq('user_id', userId)
              .single();

            if (vote) {
              setHasVoted(true);
              setUserVoteOptionId(vote.option_id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch featured poll:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedPoll();
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!poll?.id) return;

    const supabase = createClient();
    const pollId = poll.id;

    const channel = supabase
      .channel(`widget-poll-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_options',
          filter: `poll_id=eq.${pollId}`,
        },
        (payload) => {
          if (payload.new && 'id' in payload.new) {
            setPoll((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                options: prev.options.map((opt) =>
                  opt.id === (payload.new as PollOption).id
                    ? { ...opt, vote_count: (payload.new as PollOption).vote_count }
                    : opt
                ),
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (optionId: string) => {
    if (!userId || !poll || hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId,
          userId,
        }),
      });

      if (response.ok) {
        setHasVoted(true);
        setUserVoteOptionId(optionId);

        // Optimistic update
        setPoll((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            options: prev.options.map((opt) =>
              opt.id === optionId
                ? { ...opt, vote_count: opt.vote_count + 1 }
                : opt
            ),
            total_votes: prev.total_votes + 1,
          };
        });
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
        </CardContent>
      </Card>
    );
  }

  if (!poll) {
    return null;
  }

  const categoryStyle = CATEGORY_STYLES[poll.category];
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const isEnded = new Date(poll.ends_at) <= new Date();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-mariners-teal" />
            <CardTitle className="text-sm font-medium">Quick Poll</CardTitle>
          </div>
          <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0 text-xs`}>
            {poll.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <p className="font-semibold text-sm">{poll.question}</p>

        {/* Voting or Results */}
        {hasVoted || isEnded ? (
          // Show results
          <div className="space-y-2">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0
                ? Math.round((option.vote_count / totalVotes) * 100)
                : 0;
              const isUserVote = option.id === userVoteOptionId;

              return (
                <div key={option.id} className="relative">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={isUserVote ? 'font-medium text-mariners-teal' : ''}>
                      {option.text}
                      {isUserVote && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                    </span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isUserVote ? 'bg-mariners-teal' : 'bg-mariners-navy/50'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show voting buttons
          <div className="space-y-2">
            {poll.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 text-sm
                  hover:bg-mariners-teal/10 hover:border-mariners-teal"
                onClick={() => handleVote(option.id)}
                disabled={isVoting || !userId}
              >
                {isVoting ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : null}
                {option.text}
              </Button>
            ))}
            {!userId && (
              <p className="text-xs text-muted-foreground">Sign in to vote</p>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalVotes}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeRemaining(poll.ends_at)}
            </span>
          </div>
          <Link href="/polls">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              All Polls
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
