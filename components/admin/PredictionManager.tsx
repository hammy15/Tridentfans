'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trophy, CheckCircle, Clock, Users } from 'lucide-react';

interface PredictionGame {
  id: string;
  game_date: string;
  opponent: string;
  opponent_abbr: string;
  game_time: string;
  is_home: boolean;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed';
  actual_result: {
    mariners_runs: number;
    opponent_runs: number;
  } | null;
  prediction_count?: number;
}

export function PredictionManager({ adminPassword }: { adminPassword: string }) {
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    game_date: '',
    game_time: '19:10',
    opponent: '',
    opponent_abbr: '',
    is_home: true,
  });

  // Result input state
  const [resultInputs, setResultInputs] = useState<
    Record<string, { mariners: string; opponent: string }>
  >({});

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      const res = await fetch('/api/predictions?type=games');
      const data = await res.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
    setLoading(false);
  }

  async function createGame() {
    setCreating(true);
    try {
      const res = await fetch('/api/predictions/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          password: adminPassword,
        }),
      });

      if (res.ok) {
        setFormData({
          game_date: '',
          game_time: '19:10',
          opponent: '',
          opponent_abbr: '',
          is_home: true,
        });
        setShowForm(false);
        fetchGames();
      }
    } catch (error) {
      console.error('Failed to create game:', error);
    }
    setCreating(false);
  }

  async function updateResult(gameId: string) {
    const result = resultInputs[gameId];
    if (!result) return;

    try {
      const res = await fetch('/api/predictions/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          marinersRuns: parseInt(result.mariners),
          opponentRuns: parseInt(result.opponent),
          password: adminPassword,
        }),
      });

      if (res.ok) {
        fetchGames();
        setResultInputs(prev => {
          const updated = { ...prev };
          delete updated[gameId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to update result:', error);
    }
  }

  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const completedGames = games.filter(g => g.status === 'final');

  return (
    <div className="space-y-6">
      {/* Create Game Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prediction Games</h3>
          <p className="text-sm text-muted-foreground">
            Create games for users to predict and enter results when complete
          </p>
        </div>
        <Button variant="mariners" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Game
        </Button>
      </div>

      {/* Create Game Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Prediction Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Date</Label>
                <Input
                  type="date"
                  value={formData.game_date}
                  onChange={e => setFormData({ ...formData, game_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Game Time</Label>
                <Input
                  type="time"
                  value={formData.game_time}
                  onChange={e => setFormData({ ...formData, game_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opponent</Label>
                <Input
                  placeholder="Los Angeles Angels"
                  value={formData.opponent}
                  onChange={e => setFormData({ ...formData, opponent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Abbreviation</Label>
                <Input
                  placeholder="LAA"
                  maxLength={3}
                  value={formData.opponent_abbr}
                  onChange={e =>
                    setFormData({ ...formData, opponent_abbr: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.is_home}
                  onChange={() => setFormData({ ...formData, is_home: true })}
                />
                Home Game
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!formData.is_home}
                  onChange={() => setFormData({ ...formData, is_home: false })}
                />
                Away Game
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="mariners" onClick={createGame} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Game'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      ) : (
        <>
          {/* Upcoming Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Games ({upcomingGames.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingGames.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming games. Create one above!
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingGames.map(game => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold text-sm">
                          {game.opponent_abbr}
                        </div>
                        <div>
                          <p className="font-medium">
                            {game.is_home ? 'vs' : '@'} {game.opponent}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(game.game_date).toLocaleDateString()} at {game.game_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {game.prediction_count || 0} predictions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Games Needing Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Enter Results
              </CardTitle>
              <CardDescription>Enter final scores to calculate prediction scores</CardDescription>
            </CardHeader>
            <CardContent>
              {games.filter(g => g.status === 'scheduled' && new Date(g.game_date) < new Date())
                .length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No games need results yet</p>
              ) : (
                <div className="space-y-3">
                  {games
                    .filter(g => g.status === 'scheduled' && new Date(g.game_date) < new Date())
                    .map(game => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mariners-navy text-white font-bold text-sm">
                            {game.opponent_abbr}
                          </div>
                          <div>
                            <p className="font-medium">
                              {game.is_home ? 'vs' : '@'} {game.opponent}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(game.game_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="SEA"
                            className="w-16"
                            value={resultInputs[game.id]?.mariners || ''}
                            onChange={e =>
                              setResultInputs(prev => ({
                                ...prev,
                                [game.id]: { ...prev[game.id], mariners: e.target.value },
                              }))
                            }
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            placeholder={game.opponent_abbr}
                            className="w-16"
                            value={resultInputs[game.id]?.opponent || ''}
                            onChange={e =>
                              setResultInputs(prev => ({
                                ...prev,
                                [game.id]: { ...prev[game.id], opponent: e.target.value },
                              }))
                            }
                          />
                          <Button
                            variant="mariners"
                            size="sm"
                            onClick={() => updateResult(game.id)}
                            disabled={
                              !resultInputs[game.id]?.mariners || !resultInputs[game.id]?.opponent
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Games */}
          {completedGames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Games ({completedGames.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedGames.slice(0, 5).map(game => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <span>
                        {game.is_home ? 'vs' : '@'} {game.opponent} -{' '}
                        {new Date(game.game_date).toLocaleDateString()}
                      </span>
                      <Badge
                        variant={
                          game.actual_result &&
                          game.actual_result.mariners_runs > game.actual_result.opponent_runs
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          game.actual_result &&
                          game.actual_result.mariners_runs > game.actual_result.opponent_runs
                            ? 'bg-green-600'
                            : ''
                        }
                      >
                        {game.actual_result
                          ? `${game.actual_result.mariners_runs}-${game.actual_result.opponent_runs}`
                          : 'No result'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
