'use client';

import { useState, useEffect } from 'react';
import { PollFeed } from '@/components/polls/PollFeed';
import { PollResults } from '@/components/polls/PollResults';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-auth';
import { useSearchParams } from 'next/navigation';
import type { Poll } from '@/types';

type TabType = 'active' | 'ended';

export function PollsPageClient() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabType>('active');
  const [endedPolls, setEndedPolls] = useState<Poll[]>([]);
  const [loadingEnded, setLoadingEnded] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Handle direct poll link
  const pollId = searchParams.get('id');
  const [linkedPoll, setLinkedPoll] = useState<Poll | null>(null);
  const [loadingLinked, setLoadingLinked] = useState(!!pollId);

  useEffect(() => {
    async function fetchLinkedPoll() {
      if (!pollId) return;

      setLoadingLinked(true);
      try {
        const response = await fetch(`/api/polls?id=${pollId}`);
        const data = await response.json();

        if (response.ok && data.poll) {
          setLinkedPoll(data.poll);
        }
      } catch (error) {
        console.error('Failed to fetch poll:', error);
      } finally {
        setLoadingLinked(false);
      }
    }

    fetchLinkedPoll();
  }, [pollId]);

  useEffect(() => {
    async function fetchEndedPolls() {
      if (tab !== 'ended') return;

      setLoadingEnded(true);
      try {
        const response = await fetch('/api/polls?active=false&limit=20');
        const data = await response.json();

        if (response.ok) {
          setEndedPolls(data.polls || []);

          // Fetch user votes for ended polls
          if (user) {
            const supabase = createClient();
            const pollIds = data.polls.map((p: Poll) => p.id);
            const { data: votes } = await supabase
              .from('poll_votes')
              .select('poll_id, option_id')
              .eq('user_id', user.id)
              .in('poll_id', pollIds);

            if (votes) {
              const votesMap: Record<string, string> = {};
              votes.forEach((v) => {
                votesMap[v.poll_id] = v.option_id;
              });
              setUserVotes(votesMap);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch ended polls:', error);
      } finally {
        setLoadingEnded(false);
      }
    }

    fetchEndedPolls();
  }, [tab, user]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-mariners-teal/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-mariners-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Quick Polls</h1>
          <p className="text-sm text-muted-foreground">
            Vote and see what the community thinks
          </p>
        </div>
      </div>

      {/* Linked Poll (from URL) */}
      {pollId && (
        <div className="mb-6">
          {loadingLinked ? (
            <Card>
              <CardContent className="p-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
              </CardContent>
            </Card>
          ) : linkedPoll ? (
            <div className="space-y-2">
              <Badge variant="outline" className="mb-2">Shared Poll</Badge>
              <PollResults
                poll={linkedPoll}
                userVoteOptionId={user ? userVotes[linkedPoll.id] : undefined}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'active' ? 'mariners' : 'outline'}
          size="sm"
          onClick={() => setTab('active')}
        >
          Active
        </Button>
        <Button
          variant={tab === 'ended' ? 'mariners' : 'outline'}
          size="sm"
          onClick={() => setTab('ended')}
        >
          Ended
        </Button>
      </div>

      {/* Content */}
      {tab === 'active' ? (
        <PollFeed userId={user?.id} />
      ) : (
        <div className="space-y-4">
          {loadingEnded ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
            </div>
          ) : endedPolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No ended polls yet
            </div>
          ) : (
            endedPolls.map((poll) => (
              <PollResults
                key={poll.id}
                poll={poll}
                userVoteOptionId={userVotes[poll.id]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
