'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerComparison } from '@/components/stats/PlayerComparison';
import { cn } from '@/lib/utils';
import type { PlayerSearchResult, FeaturedComparison } from '@/lib/player-stats';

// Pre-defined quick comparisons
const QUICK_COMPARISONS = [
  { player1Id: 663728, player1Name: 'Julio Rodriguez', player2Id: 545361, player2Name: 'Mike Trout', label: 'Julio vs Trout' },
  { player1Id: 641680, player1Name: 'George Kirby', player2Id: 621111, player2Name: 'Gerrit Cole', label: 'Kirby vs Cole' },
  { player1Id: 668227, player1Name: 'Cal Raleigh', player2Id: 663728, player2Name: 'Julio Rodriguez', label: 'Cal vs Julio' },
  { player1Id: 682998, player1Name: 'Logan Gilbert', player2Id: 675911, player2Name: 'Corbin Burnes', label: 'Gilbert vs Burnes' },
];

export function PlayerComparisonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [featuredComparisons, setFeaturedComparisons] = useState<FeaturedComparison[]>([]);
  const [initialPlayer1, setInitialPlayer1] = useState<PlayerSearchResult | null>(null);
  const [initialPlayer2, setInitialPlayer2] = useState<PlayerSearchResult | null>(null);

  // Load featured comparisons
  useEffect(() => {
    async function loadFeatured() {
      try {
        const response = await fetch('/api/players/featured');
        if (response.ok) {
          const data = await response.json();
          setFeaturedComparisons(data.comparisons || []);
        }
      } catch {
        // Use default quick comparisons if API fails
        setFeaturedComparisons([]);
      }
    }
    loadFeatured();
  }, []);

  // Handle URL parameters for pre-selected players
  useEffect(() => {
    const p1 = searchParams.get('player1');
    const p2 = searchParams.get('player2');

    if (p1 && p2) {
      // Fetch player info for pre-selected players
      async function loadPlayers() {
        try {
          const [res1, res2] = await Promise.all([
            fetch(`/api/players?playerId=${p1}`),
            fetch(`/api/players?playerId=${p2}`),
          ]);

          if (res1.ok && res2.ok) {
            const data1 = await res1.json();
            const data2 = await res2.json();
            setInitialPlayer1(data1.player);
            setInitialPlayer2(data2.player);
          }
        } catch (error) {
          console.error('Failed to load players from URL:', error);
        }
      }
      loadPlayers();
    }
  }, [searchParams]);

  // Handle quick comparison click
  const handleQuickCompare = (p1Id: number, p2Id: number, p1Name: string, p2Name: string) => {
    // Create mock player objects for initial selection
    setInitialPlayer1({
      id: p1Id,
      fullName: p1Name,
      firstName: p1Name.split(' ')[0],
      lastName: p1Name.split(' ').slice(1).join(' '),
      primaryPosition: { code: 'U', name: 'Unknown', abbreviation: 'U', type: 'Unknown' },
      active: true,
    });
    setInitialPlayer2({
      id: p2Id,
      fullName: p2Name,
      firstName: p2Name.split(' ')[0],
      lastName: p2Name.split(' ').slice(1).join(' '),
      primaryPosition: { code: 'U', name: 'Unknown', abbreviation: 'U', type: 'Unknown' },
      active: true,
    });

    // Update URL without reload
    router.push(`/compare?player1=${p1Id}&player2=${p2Id}`, { scroll: false });
  };

  // Generate shareable link
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Player Comparison | TridentFans',
          text: 'Check out this MLB player comparison!',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Update URL when comparison changes
  const handleCompare = (player1Id: number, player2Id: number) => {
    const newUrl = `/compare?player1=${player1Id}&player2=${player2Id}`;
    router.push(newUrl, { scroll: false });
  };

  const allQuickComparisons = featuredComparisons.length > 0
    ? featuredComparisons.map((c) => ({
        player1Id: c.player1_id,
        player1Name: c.player1_name,
        player2Id: c.player2_id,
        player2Name: c.player2_name,
        label: c.label,
      }))
    : QUICK_COMPARISONS;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-mariners-navy to-mariners-teal bg-clip-text text-transparent">
          Player Comparison
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Compare any two MLB players side by side. See batting averages, home runs, ERA,
          and more to settle debates and analyze matchups.
        </p>
      </div>

      {/* Quick Compare Buttons */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Quick Compare</CardTitle>
          <CardDescription>
            Popular matchups to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allQuickComparisons.map((comp, index) => (
              <Button
                key={`${comp.player1Id}-${comp.player2Id}-${index}`}
                variant="outline"
                size="sm"
                onClick={() => handleQuickCompare(comp.player1Id, comp.player2Id, comp.player1Name, comp.player2Name)}
                className={cn(
                  'hover:bg-mariners-teal/10 hover:border-mariners-teal',
                  'transition-colors duration-200'
                )}
              >
                {comp.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Comparison Tool */}
      <PlayerComparison
        initialPlayer1={initialPlayer1}
        initialPlayer2={initialPlayer2}
        onCompare={handleCompare}
      />

      {/* Share Button */}
      {(initialPlayer1 || initialPlayer2) && (
        <div className="mt-6 text-center">
          <Button variant="mariners" onClick={handleShare}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share Comparison
          </Button>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-mariners-teal/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mariners-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Real-Time Stats</h3>
            <p className="text-sm text-muted-foreground">
              Stats are pulled directly from MLB&apos;s official API and updated throughout the season.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-mariners-navy/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-mariners-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Career & Season</h3>
            <p className="text-sm text-muted-foreground">
              Toggle between current season stats and career totals to see the full picture.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Share & Discuss</h3>
            <p className="text-sm text-muted-foreground">
              Share your comparisons with friends or bring them to the forum for debate.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
