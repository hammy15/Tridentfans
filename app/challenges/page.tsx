'use client';

import { useState, useEffect, useCallback } from 'react';
import { Swords, Clock, Trophy, History, UserPlus, Loader2, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChallengeCard, CreateChallenge, type Challenge } from '@/components/challenges';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:profiles!challenges_challenger_id_fkey(id, username, display_name, avatar_url),
          opponent:profiles!challenges_opponent_id_fkey(id, username, display_name, avatar_url),
          game:prediction_games(id, opponent, opponent_abbr, game_date, game_time, is_home, status)
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch challenges:', error);
        return;
      }

      setChallenges(data as Challenge[] || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Filter challenges by status and role
  const pendingChallenges = challenges.filter(
    c => c.status === 'pending' && c.opponent_id === user?.id
  );
  const sentChallenges = challenges.filter(
    c => c.status === 'pending' && c.challenger_id === user?.id
  );
  const activeChallenges = challenges.filter(c => c.status === 'accepted');
  const completedChallenges = challenges.filter(
    c => c.status === 'completed' || c.status === 'declined'
  );

  // Calculate stats
  const totalWins = challenges.filter(c => {
    if (c.status !== 'completed' || c.challenger_score === null || c.opponent_score === null) return false;
    const isChallenger = c.challenger_id === user?.id;
    const challengerWon = c.challenger_score > c.opponent_score;
    return isChallenger ? challengerWon : !challengerWon;
  }).length;

  const totalLosses = challenges.filter(c => {
    if (c.status !== 'completed' || c.challenger_score === null || c.opponent_score === null) return false;
    const isChallenger = c.challenger_id === user?.id;
    const challengerWon = c.challenger_score > c.opponent_score;
    return isChallenger ? !challengerWon : challengerWon;
  }).length;

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  const renderChallengeGrid = (challengeList: Challenge[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      );
    }

    if (challengeList.length === 0) {
      return renderEmptyState(emptyMessage);
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challengeList.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onUpdate={fetchChallenges}
          />
        ))}
      </div>
    );
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-mariners-teal/10 flex items-center justify-center mx-auto mb-4">
              <Swords className="h-8 w-8 text-mariners-teal" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Head-to-Head Challenges</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to challenge friends and prove you&apos;re the better Mariners predictor!
            </p>
            <Link href="/auth/login">
              <Button variant="mariners" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Play
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Swords className="h-8 w-8 text-mariners-teal" />
              Head-to-Head Challenges
            </h1>
            <p className="mt-2 text-muted-foreground">
              Challenge friends to prediction battles
            </p>
          </div>
          <Button variant="mariners" size="lg" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Challenge a Friend
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <Swords className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLosses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mariners-teal/10">
              <History className="h-6 w-6 text-mariners-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold">{challenges.length}</p>
              <p className="text-sm text-muted-foreground">Total Challenges</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Challenges Alert */}
      {pendingChallenges.length > 0 && (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Challenges
              <Badge variant="warning">{pendingChallenges.length}</Badge>
            </CardTitle>
            <CardDescription>
              You have challenges waiting for your response!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onUpdate={fetchChallenges}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different challenge states */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Sent</span>
            {sentChallenges.length > 0 && (
              <span className="ml-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
                {sentChallenges.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Active</span>
            {activeChallenges.length > 0 && (
              <span className="ml-1 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                {activeChallenges.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {renderChallengeGrid(sentChallenges, 'No pending challenges sent')}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {renderChallengeGrid(activeChallenges, 'No active challenges')}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderChallengeGrid(completedChallenges, 'No challenge history yet')}
        </TabsContent>
      </Tabs>

      {/* Create Challenge Modal */}
      <CreateChallenge
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onChallengeCreated={fetchChallenges}
      />
    </div>
  );
}
