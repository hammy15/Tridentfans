'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Swords, Calendar, Loader2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, PredictionGame } from '@/types';

export interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  game_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  challenger_score: number | null;
  opponent_score: number | null;
  created_at: string;
  // Joined fields
  challenger?: Profile;
  opponent?: Profile;
  game?: PredictionGame;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onUpdate?: () => void;
}

const statusConfig: Record<Challenge['status'], { variant: 'default' | 'success' | 'destructive' | 'secondary'; label: string }> = {
  pending: { variant: 'default', label: 'Pending' },
  accepted: { variant: 'success', label: 'Accepted' },
  declined: { variant: 'destructive', label: 'Declined' },
  completed: { variant: 'secondary', label: 'Completed' },
};

export function ChallengeCard({ challenge, onUpdate }: ChallengeCardProps) {
  const { user } = useAuth();
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChallenger = user?.id === challenge.challenger_id;
  const isOpponent = user?.id === challenge.opponent_id;
  const canRespond = isOpponent && challenge.status === 'pending';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('challenges')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', challenge.id);

      if (updateError) {
        setError('Failed to respond to challenge');
        return;
      }

      onUpdate?.();
    } catch {
      setError('An error occurred');
    } finally {
      setResponding(false);
    }
  };

  const statusInfo = statusConfig[challenge.status];
  const challengerName = challenge.challenger?.display_name || challenge.challenger?.username || 'Unknown';
  const opponentName = challenge.opponent?.display_name || challenge.opponent?.username || 'Unknown';

  // Determine winner for completed challenges
  let winner: 'challenger' | 'opponent' | 'tie' | null = null;
  if (challenge.status === 'completed' && challenge.challenger_score !== null && challenge.opponent_score !== null) {
    if (challenge.challenger_score > challenge.opponent_score) {
      winner = 'challenger';
    } else if (challenge.opponent_score > challenge.challenger_score) {
      winner = 'opponent';
    } else {
      winner = 'tie';
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-mariners-navy/5 to-mariners-teal/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-mariners-teal" />
            <span className="font-semibold">Challenge</span>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Participants */}
        <div className="flex items-center justify-between gap-4">
          {/* Challenger */}
          <div className="flex-1 text-center">
            <Avatar
              src={challenge.challenger?.avatar_url}
              alt={challengerName}
              fallback={challengerName.charAt(0)}
              className={`h-12 w-12 mx-auto mb-2 ${
                winner === 'challenger' ? 'ring-2 ring-green-500' : ''
              }`}
            />
            <p className="font-medium text-sm truncate">{challengerName}</p>
            {isChallenger && (
              <Badge variant="outline" className="text-xs mt-1">You</Badge>
            )}
            {challenge.status === 'completed' && challenge.challenger_score !== null && (
              <p className="text-2xl font-bold mt-2 text-mariners-teal">
                {challenge.challenger_score}
              </p>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-center">
            <Avatar
              src={challenge.opponent?.avatar_url}
              alt={opponentName}
              fallback={opponentName.charAt(0)}
              className={`h-12 w-12 mx-auto mb-2 ${
                winner === 'opponent' ? 'ring-2 ring-green-500' : ''
              }`}
            />
            <p className="font-medium text-sm truncate">{opponentName}</p>
            {isOpponent && (
              <Badge variant="outline" className="text-xs mt-1">You</Badge>
            )}
            {challenge.status === 'completed' && challenge.opponent_score !== null && (
              <p className="text-2xl font-bold mt-2 text-mariners-teal">
                {challenge.opponent_score}
              </p>
            )}
          </div>
        </div>

        {/* Game Info */}
        {challenge.game && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {challenge.game.is_home ? 'vs' : '@'} {challenge.game.opponent}
                </p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(challenge.game.game_date)}</span>
                </div>
              </div>
              <Badge variant="outline">{challenge.game.status}</Badge>
            </div>
          </div>
        )}

        {/* Winner Banner */}
        {winner && (
          <div className={`rounded-lg p-3 text-center ${
            winner === 'tie'
              ? 'bg-muted'
              : winner === 'challenger' && isChallenger || winner === 'opponent' && isOpponent
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
          }`}>
            <p className="font-semibold">
              {winner === 'tie'
                ? "It's a tie!"
                : winner === 'challenger'
                  ? `${challengerName} wins!`
                  : `${opponentName} wins!`
              }
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </CardContent>

      {canRespond && (
        <CardFooter className="gap-2 pt-3 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleRespond(false)}
            disabled={responding}
          >
            {responding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Decline
              </>
            )}
          </Button>
          <Button
            variant="mariners"
            className="flex-1"
            onClick={() => handleRespond(true)}
            disabled={responding}
          >
            {responding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Accept
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
