'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, CheckCircle2, Share2, Trophy, Check } from 'lucide-react';
import type { Poll, PollCategory } from '@/types';

interface PollResultsProps {
  poll: Poll;
  userVoteOptionId?: string | null;
  compact?: boolean;
  showShareButton?: boolean;
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

export function PollResults({
  poll,
  userVoteOptionId,
  compact = false,
  showShareButton = true
}: PollResultsProps) {
  const [copied, setCopied] = useState(false);

  const categoryStyle = CATEGORY_STYLES[poll.category];
  const isEnded = new Date(poll.ends_at) <= new Date();

  // Find the winning option(s)
  const maxVotes = Math.max(...poll.options.map(o => o.vote_count));
  const winningOptionIds = poll.options
    .filter(o => o.vote_count === maxVotes && maxVotes > 0)
    .map(o => o.id);

  const handleShare = async () => {
    const shareText = `Check out this poll on TridentFans: "${poll.question}"`;
    const shareUrl = `${window.location.origin}/polls?id=${poll.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TridentFans Poll',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={`overflow-hidden ${poll.is_featured ? 'ring-2 ring-mariners-teal' : ''}`}>
      <CardHeader className={compact ? 'p-4 pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0`}>
                {categoryStyle.label}
              </Badge>
              {poll.is_featured && (
                <Badge variant="mariners" className="text-xs">
                  Featured
                </Badge>
              )}
              {isEnded && (
                <Badge variant="outline" className="text-xs">
                  Ended
                </Badge>
              )}
            </div>
            <CardTitle className={compact ? 'text-base' : 'text-lg'}>
              {poll.question}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-4 pt-0' : 'pt-0'}>
        {/* Results Bars */}
        <div className="space-y-3 mb-4">
          {poll.options.map((option) => {
            const isUserVote = option.id === userVoteOptionId;
            const isWinning = winningOptionIds.includes(option.id) && isEnded;
            const percentage = option.percentage || 0;

            return (
              <div key={option.id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isUserVote ? 'text-mariners-teal' : ''}`}>
                      {option.text}
                    </span>
                    {isUserVote && (
                      <CheckCircle2 className="h-4 w-4 text-mariners-teal" />
                    )}
                    {isWinning && (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-lg ${
                      isWinning
                        ? 'bg-gradient-to-r from-mariners-teal to-mariners-navy'
                        : isUserVote
                        ? 'bg-mariners-teal'
                        : 'bg-mariners-navy/60'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <span className="text-xs text-muted-foreground">
                      {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Poll Meta & Share */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}</span>
            </div>
            {!isEnded && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTimeRemaining(poll.ends_at)}</span>
              </div>
            )}
          </div>

          {showShareButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </>
              )}
            </Button>
          )}
        </div>

        {userVoteOptionId && (
          <p className="text-xs text-muted-foreground mt-2">
            You voted for this poll
          </p>
        )}
      </CardContent>
    </Card>
  );
}
