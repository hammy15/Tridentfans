'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlayerSearch } from '@/components/stats/PlayerSearch';
import { cn } from '@/lib/utils';
import type { PlayerSearchResult, FeaturedComparison, PopularComparison } from '@/lib/player-stats';

export function PlayerCompareAdmin() {
  const [featuredComparisons, setFeaturedComparisons] = useState<FeaturedComparison[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<PopularComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New comparison form state
  const [newPlayer1, setNewPlayer1] = useState<PlayerSearchResult | null>(null);
  const [newPlayer2, setNewPlayer2] = useState<PlayerSearchResult | null>(null);
  const [newLabel, setNewLabel] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [featuredRes, popularRes] = await Promise.all([
        fetch('/api/players/featured'),
        fetch('/api/players/popular'),
      ]);

      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedComparisons(data.comparisons || []);
      }

      if (popularRes.ok) {
        const data = await popularRes.json();
        setPopularComparisons(data.comparisons || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load comparison data' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new featured comparison
  const handleAddFeatured = async () => {
    if (!newPlayer1 || !newPlayer2 || !newLabel.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/players/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_id: newPlayer1.id,
          player1_name: newPlayer1.fullName,
          player2_id: newPlayer2.id,
          player2_name: newPlayer2.fullName,
          label: newLabel.trim(),
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Featured comparison added' });
        setNewPlayer1(null);
        setNewPlayer2(null);
        setNewLabel('');
        loadData();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add comparison' });
      }
    } catch (error) {
      console.error('Failed to add featured comparison:', error);
      setMessage({ type: 'error', text: 'Failed to add comparison' });
    } finally {
      setIsSaving(false);
    }
  };

  // Remove featured comparison
  const handleRemoveFeatured = async (id: string) => {
    if (!confirm('Are you sure you want to remove this featured comparison?')) return;

    try {
      const response = await fetch(`/api/players/featured?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Featured comparison removed' });
        loadData();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove comparison' });
      }
    } catch (error) {
      console.error('Failed to remove featured comparison:', error);
      setMessage({ type: 'error', text: 'Failed to remove comparison' });
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/players/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive }),
      });

      if (response.ok) {
        loadData();
      } else {
        setMessage({ type: 'error', text: 'Failed to update comparison' });
      }
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the player stats cache?')) return;

    try {
      const response = await fetch('/api/players/cache', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cache cleared successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to clear cache' });
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setMessage({ type: 'error', text: 'Failed to clear cache' });
    }
  };

  // Clear message after timeout
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-mariners-teal/30 border-t-mariners-teal rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading comparison data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div
          className={cn(
            'px-4 py-3 rounded-lg',
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          )}
        >
          {message.text}
        </div>
      )}

      {/* Add New Featured Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Add Featured Comparison</CardTitle>
          <CardDescription>
            Featured comparisons appear as quick picks on the compare page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Player 1</Label>
              <PlayerSearch
                onSelect={(p) => setNewPlayer1(p || null)}
                selectedPlayer={newPlayer1}
                placeholder="Search player 1..."
              />
            </div>
            <div className="space-y-2">
              <Label>Player 2</Label>
              <PlayerSearch
                onSelect={(p) => setNewPlayer2(p || null)}
                selectedPlayer={newPlayer2}
                placeholder="Search player 2..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label (e.g., &quot;Julio vs Trout&quot;)</Label>
            <Input
              id="label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Enter a short label..."
            />
          </div>

          <Button
            onClick={handleAddFeatured}
            disabled={isSaving || !newPlayer1 || !newPlayer2 || !newLabel.trim()}
            variant="mariners"
          >
            {isSaving ? 'Adding...' : 'Add Featured Comparison'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Featured Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Comparisons</CardTitle>
          <CardDescription>
            Manage the quick compare buttons shown on the compare page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredComparisons.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No featured comparisons yet
            </p>
          ) : (
            <div className="space-y-3">
              {featuredComparisons.map((comp) => (
                <div
                  key={comp.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    comp.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  )}
                >
                  <div>
                    <p className="font-medium">{comp.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {comp.player1_name} vs {comp.player2_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(comp.id, comp.is_active)}
                    >
                      {comp.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeatured(comp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Comparisons Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Comparisons</CardTitle>
          <CardDescription>
            Most frequently compared player matchups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {popularComparisons.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No comparison data yet
            </p>
          ) : (
            <div className="space-y-2">
              {popularComparisons.map((comp, index) => (
                <div
                  key={`${comp.player1_id}-${comp.player2_id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">
                      Player {comp.player1_id} vs Player {comp.player2_id}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {comp.count} {comp.count === 1 ? 'comparison' : 'comparisons'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Clear cached player stats if data appears stale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleClearCache}>
            Clear Player Stats Cache
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
