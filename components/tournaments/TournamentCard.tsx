'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  tournament_type: 'weekly' | 'monthly' | 'special';
  start_date: string;
  end_date: string;
  prize_description: string | null;
  status: 'upcoming' | 'active' | 'completed';
  participant_count: number;
}

interface TournamentCardProps {
  tournament: Tournament;
  isJoined?: boolean;
  onJoinSuccess?: () => void;
}

const typeColors: Record<Tournament['tournament_type'], string> = {
  weekly: 'bg-purple-500 text-white',
  monthly: 'bg-amber-500 text-white',
  special: 'bg-gradient-to-r from-mariners-teal to-mariners-navy text-white',
};

const statusConfig: Record<Tournament['status'], { variant: 'default' | 'success' | 'secondary'; label: string }> = {
  upcoming: { variant: 'default', label: 'Upcoming' },
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'secondary', label: 'Completed' },
};

export function TournamentCard({ tournament, isJoined = false, onJoinSuccess }: TournamentCardProps) {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(isJoined);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleJoin = async () => {
    if (!user) {
      setError('Please sign in to join tournaments');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('You have already joined this tournament');
        } else {
          setError('Failed to join tournament');
        }
        return;
      }

      setJoined(true);
      onJoinSuccess?.();
    } catch {
      setError('An error occurred');
    } finally {
      setJoining(false);
    }
  };

  const statusInfo = statusConfig[tournament.status];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-mariners-teal flex-shrink-0" />
            <CardTitle className="text-lg line-clamp-1">{tournament.name}</CardTitle>
          </div>
          <Badge className={typeColors[tournament.tournament_type]}>
            {tournament.tournament_type.charAt(0).toUpperCase() + tournament.tournament_type.slice(1)}
          </Badge>
        </div>
        <Badge variant={statusInfo.variant} className="w-fit mt-2">
          {statusInfo.label}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {tournament.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{tournament.description}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{tournament.participant_count} participant{tournament.participant_count !== 1 ? 's' : ''}</span>
        </div>

        {tournament.prize_description && (
          <div className="rounded-lg bg-mariners-teal/10 p-3">
            <p className="text-sm font-medium text-mariners-teal">
              Prize: {tournament.prize_description}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        {tournament.status === 'completed' ? (
          <Button variant="outline" className="w-full" disabled>
            Completed
          </Button>
        ) : joined ? (
          <Button variant="outline" className="w-full" disabled>
            <Check className="h-4 w-4 mr-2" />
            Joined
          </Button>
        ) : (
          <Button
            variant="mariners"
            className="w-full"
            onClick={handleJoin}
            disabled={joining || !user}
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Tournament'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
