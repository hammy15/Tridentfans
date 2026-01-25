'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Swords, Search, Calendar, Loader2, X, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, PredictionGame } from '@/types';

interface CreateChallengeProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated?: () => void;
}

export function CreateChallenge({ isOpen, onClose, onChallengeCreated }: CreateChallengeProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'opponent' | 'game'>('opponent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Profile | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<PredictionGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PredictionGame | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const supabase = createClient();
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user?.id || '')
        .limit(10);

      if (searchError) {
        console.error('Search error:', searchError);
        return;
      }

      setSearchResults(data as Profile[] || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [user?.id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Fetch upcoming games when moving to game selection
  useEffect(() => {
    if (step === 'game' && selectedOpponent) {
      fetchUpcomingGames();
    }
  }, [step, selectedOpponent]);

  const fetchUpcomingGames = async () => {
    setLoadingGames(true);
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error: gamesError } = await supabase
        .from('prediction_games')
        .select('*')
        .gte('game_date', today)
        .in('status', ['scheduled', 'in_progress'])
        .order('game_date', { ascending: true })
        .limit(10);

      if (gamesError) {
        console.error('Failed to fetch games:', gamesError);
        return;
      }

      setUpcomingGames(data as PredictionGame[] || []);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSelectOpponent = (opponent: Profile) => {
    setSelectedOpponent(opponent);
    setStep('game');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectGame = (game: PredictionGame) => {
    setSelectedGame(game);
  };

  const handleSubmit = async () => {
    if (!user || !selectedOpponent || !selectedGame) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          opponent_id: selectedOpponent.id,
          game_id: selectedGame.id,
          status: 'pending',
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A challenge already exists for this game and opponent');
        } else {
          setError('Failed to create challenge');
        }
        return;
      }

      onChallengeCreated?.();
      handleClose();
    } catch {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('opponent');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedOpponent(null);
    setSelectedGame(null);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    setStep('opponent');
    setSelectedGame(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-mariners-teal" />
              <CardTitle>Create Challenge</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto max-h-[60vh]">
          {step === 'opponent' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opponent-search">Search for an opponent</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="opponent-search"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
                </div>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSelectOpponent(profile)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar
                        src={profile.avatar_url}
                        alt={profile.username}
                        fallback={profile.username.charAt(0)}
                        className="h-10 w-10"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {profile.display_name || profile.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{profile.username}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Opponent */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-mariners-teal/10">
                <Avatar
                  src={selectedOpponent?.avatar_url}
                  alt={selectedOpponent?.username || ''}
                  fallback={selectedOpponent?.username?.charAt(0) || '?'}
                  className="h-10 w-10"
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedOpponent?.display_name || selectedOpponent?.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Challenging @{selectedOpponent?.username}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  Change
                </Button>
              </div>

              {/* Game Selection */}
              <div className="space-y-2">
                <Label>Select a game</Label>

                {loadingGames && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
                  </div>
                )}

                {!loadingGames && upcomingGames.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming games available
                  </p>
                )}

                {upcomingGames.length > 0 && (
                  <div className="space-y-2">
                    {upcomingGames.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => handleSelectGame(game)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                          selectedGame?.id === game.id
                            ? 'border-mariners-teal bg-mariners-teal/10'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {game.is_home ? 'vs' : '@'} {game.opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(game.game_date)} at {formatTime(game.game_time)}
                          </p>
                        </div>
                        {selectedGame?.id === game.id && (
                          <div className="h-5 w-5 rounded-full bg-mariners-teal flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          )}
        </CardContent>

        {step === 'game' && (
          <CardFooter className="border-t gap-2">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button
              variant="mariners"
              onClick={handleSubmit}
              disabled={!selectedGame || submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4 mr-2" />
                  Send Challenge
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
