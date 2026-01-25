'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentCard, Tournament } from './TournamentCard';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trophy, Calendar, CheckCircle } from 'lucide-react';

interface TournamentWithJoined extends Tournament {
  isJoined: boolean;
}

export function TournamentList() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentWithJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch all tournaments with participant counts
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants(count)
        `)
        .order('start_date', { ascending: true });

      if (tournamentsError) {
        console.error('Failed to fetch tournaments:', tournamentsError);
        return;
      }

      // Fetch user's joined tournaments if logged in
      let joinedTournamentIds: string[] = [];
      if (user) {
        const { data: participations } = await supabase
          .from('tournament_participants')
          .select('tournament_id')
          .eq('user_id', user.id);

        joinedTournamentIds = participations?.map(p => p.tournament_id) || [];
      }

      // Transform data
      const transformedTournaments: TournamentWithJoined[] = (tournamentsData || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        tournament_type: t.tournament_type,
        start_date: t.start_date,
        end_date: t.end_date,
        prize_description: t.prize_description,
        status: t.status,
        participant_count: t.tournament_participants?.[0]?.count || 0,
        isJoined: joinedTournamentIds.includes(t.id),
      }));

      setTournaments(transformedTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const activeTournaments = tournaments.filter(t => t.status === 'active');
  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  const renderTournamentGrid = (items: TournamentWithJoined[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(tournament => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            isJoined={tournament.isJoined}
            onJoinSuccess={fetchTournaments}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-mariners-teal" />
        <h2 className="text-2xl font-bold">Tournaments</h2>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Active</span>
            {activeTournaments.length > 0 && (
              <span className="ml-1 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                {activeTournaments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Upcoming</span>
            {upcomingTournaments.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                {upcomingTournaments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Completed</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {renderTournamentGrid(activeTournaments, 'No active tournaments at the moment')}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {renderTournamentGrid(upcomingTournaments, 'No upcoming tournaments scheduled')}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderTournamentGrid(completedTournaments, 'No completed tournaments yet')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
