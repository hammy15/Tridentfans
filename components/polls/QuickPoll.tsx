'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import type { Poll, PollOption, PollCategory } from '@/types';
import { PollResults } from './PollResults';

interface QuickPollProps {
  poll: Poll;
  userId?: string;
  onVote?: (pollId: string, optionId: string) => void;
  compact?: boolean;
}

const CATEGORY_STYLES: Record<PollCategory, { bg: string; text: string; label: string }> = {
  game: { bg: 'bg-mariners-teal/10', text: 'text-mariners-teal', label: 'Game Day' },
  trade: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Trade Talk' },
  roster: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Roster' },
  general: { bg: 'bg-mariners-navy/10', text: 'text-mariners-navy', label: 'General' },
  fun: { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'Fun' },
};

function formatTimeRemaining(endsAt: string): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function QuickPoll({ poll, userId, onVote, compact = false }: QuickPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [error, setError] = useState<string | null>(null);

  const categoryStyle = CATEGORY_STYLES[localPoll.category];
  const isEnded = new Date(localPoll.ends_at) <= new Date();

  // Check if user has already voted
  useEffect(() => {
    async function checkExistingVote() {
      if (!userId) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', userId)
        .single();

      if (data) {
        setSelectedOption(data.option_id);
        setHasVoted(true);
      }
    }

    checkExistingVote();
  }, [userId, poll.id]);

  // Subscribe to real-time vote updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_options',
          filter: `poll_id=eq.${poll.id}`,
        },
        (payload) => {
          // Update local poll options with new vote counts
          if (payload.new && 'id' in payload.new) {
            setLocalPoll((prev) => ({
              ...prev,
              options: prev.options.map((opt) =>
                opt.id === (payload.new as PollOption).id
                  ? { ...opt, vote_count: (payload.new as PollOption).vote_count }
                  : opt
              ),
              total_votes: prev.options.reduce((sum, opt) => {
                if (opt.id === (payload.new as PollOption).id) {
                  return sum + (payload.new as PollOption).vote_count;
                }
                return sum + opt.vote_count;
              }, 0),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  const handleVote = async (optionId: string) => {
    if (!userId || hasVoted || isEnded || isVoting) return;

    setIsVoting(true);
    setError(null);
    setSelectedOption(optionId);

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to vote');
      }

      setHasVoted(true);
      onVote?.(poll.id, optionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
      setSelectedOption(null);
    } finally {
      setIsVoting(false);
    }
  };

  // Calculate percentages
  const totalVotes = localPoll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
  const optionsWithPercentage = localPoll.options.map((opt) => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
  }));

  if (hasVoted || isEnded) {
    return (
      <PollResults
        poll={{ ...localPoll, options: optionsWithPercentage, total_votes: totalVotes }}
        userVoteOptionId={selectedOption}
        compact={compact}
      />
    );
  }

  return (
    <Card className={`overflow-hidden ${localPoll.is_featured ? 'ring-2 ring-mariners-teal' : ''}`}>
      <CardHeader className={compact ? 'p-4 pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0`}>
                {categoryStyle.label}
              </Badge>
              {localPoll.is_featured && (
                <Badge variant="mariners" className="text-xs">
                  Featured
                </Badge>
              )}
            </div>
            <CardTitle className={compact ? 'text-base' : 'text-lg'}>
              {localPoll.question}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-4 pt-0' : 'pt-0'}>
        {/* Voting Options */}
        <div className="space-y-2 mb-4">
          {optionsWithPercentage.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className={`w-full justify-start h-auto py-3 px-4 text-left transition-all
                ${selectedOption === option.id ? 'ring-2 ring-mariners-teal bg-mariners-teal/5' : ''}
                hover:bg-mariners-teal/10 hover:border-mariners-teal
              `}
              onClick={() => handleVote(option.id)}
              disabled={isVoting || !userId}
            >
              {isVoting && selectedOption === option.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : selectedOption === option.id ? (
                <CheckCircle2 className="h-4 w-4 mr-2 text-mariners-teal" />
              ) : null}
              <span className="flex-1">{option.text}</span>
            </Button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive mb-3">{error}</p>
        )}

        {!userId && (
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to vote
          </p>
        )}

        {/* Poll Meta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTimeRemaining(localPoll.ends_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
