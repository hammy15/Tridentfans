'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerSearch } from './PlayerSearch';
import { StatBar, StatBarCompact } from './StatBar';
import { cn } from '@/lib/utils';
import type { PlayerSearchResult, PlayerFullStats, HittingStats, PitchingStats } from '@/lib/player-stats';

interface PlayerComparisonProps {
  initialPlayer1?: PlayerSearchResult | null;
  initialPlayer2?: PlayerSearchResult | null;
  onCompare?: (player1Id: number, player2Id: number) => void;
}

type StatMode = 'season' | 'career';

export function PlayerComparison({
  initialPlayer1 = null,
  initialPlayer2 = null,
  onCompare,
}: PlayerComparisonProps) {
  const [player1, setPlayer1] = useState<PlayerSearchResult | null>(initialPlayer1);
  const [player2, setPlayer2] = useState<PlayerSearchResult | null>(initialPlayer2);
  const [player1Stats, setPlayer1Stats] = useState<PlayerFullStats | null>(null);
  const [player2Stats, setPlayer2Stats] = useState<PlayerFullStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statMode, setStatMode] = useState<StatMode>('season');
  const [error, setError] = useState<string | null>(null);

  // Fetch stats when both players are selected
  useEffect(() => {
    if (!player1 || !player2) {
      setPlayer1Stats(null);
      setPlayer2Stats(null);
      return;
    }

    async function fetchStats() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/players?compare=true&player1=${player1!.id}&player2=${player2!.id}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch player stats');
        }
        const data = await response.json();
        setPlayer1Stats(data.player1);
        setPlayer2Stats(data.player2);

        // Track the comparison
        onCompare?.(player1!.id, player2!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
        setPlayer1Stats(null);
        setPlayer2Stats(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [player1, player2, onCompare]);

  // Determine what type of stats to show
  const showHittingStats =
    player1Stats &&
    player2Stats &&
    (player1Stats.playerType !== 'pitcher' || player2Stats.playerType !== 'pitcher');
  const showPitchingStats =
    player1Stats &&
    player2Stats &&
    (player1Stats.playerType === 'pitcher' || player2Stats.playerType === 'pitcher' ||
     player1Stats.playerType === 'two-way' || player2Stats.playerType === 'two-way');

  // Get current stats based on mode
  const getHittingStats = (stats: PlayerFullStats | null): HittingStats | undefined => {
    if (!stats) return undefined;
    return statMode === 'season' ? stats.currentSeasonHitting : stats.careerHitting;
  };

  const getPitchingStats = (stats: PlayerFullStats | null): PitchingStats | undefined => {
    if (!stats) return undefined;
    return statMode === 'season' ? stats.currentSeasonPitching : stats.careerPitching;
  };

  const p1Hitting = getHittingStats(player1Stats);
  const p2Hitting = getHittingStats(player2Stats);
  const p1Pitching = getPitchingStats(player1Stats);
  const p2Pitching = getPitchingStats(player2Stats);

  // Calculate winner totals
  const calculateWinners = () => {
    let p1Wins = 0;
    let p2Wins = 0;

    if (showHittingStats && p1Hitting && p2Hitting) {
      const hittingStats: { key: keyof HittingStats; higher: boolean }[] = [
        { key: 'avg', higher: true },
        { key: 'obp', higher: true },
        { key: 'slg', higher: true },
        { key: 'ops', higher: true },
        { key: 'homeRuns', higher: true },
        { key: 'rbi', higher: true },
        { key: 'runs', higher: true },
        { key: 'stolenBases', higher: true },
      ];

      hittingStats.forEach(({ key, higher }) => {
        const v1 = parseFloat(String(p1Hitting[key])) || 0;
        const v2 = parseFloat(String(p2Hitting[key])) || 0;
        if (v1 !== v2) {
          if ((higher && v1 > v2) || (!higher && v1 < v2)) p1Wins++;
          else p2Wins++;
        }
      });
    }

    if (showPitchingStats && p1Pitching && p2Pitching) {
      const pitchingStats: { key: keyof PitchingStats; higher: boolean }[] = [
        { key: 'era', higher: false },
        { key: 'whip', higher: false },
        { key: 'strikeOuts', higher: true },
        { key: 'wins', higher: true },
      ];

      pitchingStats.forEach(({ key, higher }) => {
        const v1 = parseFloat(String(p1Pitching[key])) || 0;
        const v2 = parseFloat(String(p2Pitching[key])) || 0;
        if (v1 !== v2) {
          if ((higher && v1 > v2) || (!higher && v1 < v2)) p1Wins++;
          else p2Wins++;
        }
      });
    }

    return { p1Wins, p2Wins };
  };

  const { p1Wins, p2Wins } = player1Stats && player2Stats ? calculateWinners() : { p1Wins: 0, p2Wins: 0 };

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player 1 */}
        <Card className="border-l-4 border-l-mariners-navy">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Player 1</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerSearch
              onSelect={(p) => setPlayer1(p || null)}
              selectedPlayer={player1}
              placeholder="Search player..."
            />
          </CardContent>
        </Card>

        {/* Player 2 */}
        <Card className="border-l-4 border-l-mariners-teal">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Player 2</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerSearch
              onSelect={(p) => setPlayer2(p || null)}
              selectedPlayer={player2}
              placeholder="Search player..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-mariners-teal/30 border-t-mariners-teal rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading player stats...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {player1Stats && player2Stats && !isLoading && (
        <>
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={statMode === 'season' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatMode('season')}
            >
              Current Season
            </Button>
            <Button
              variant={statMode === 'career' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatMode('career')}
            >
              Career
            </Button>
          </div>

          {/* Player Header Comparison */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between gap-4">
                {/* Player 1 Info */}
                <div className="flex-1 text-center">
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted mb-3 ring-4 ring-mariners-navy/20">
                    <img
                      src={player1Stats.photoUrl}
                      alt={player1Stats.player.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current';
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-lg">{player1Stats.player.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {player1Stats.player.currentTeam?.abbreviation || player1Stats.player.currentTeam?.name || 'Free Agent'}{' '}
                    - {player1Stats.player.primaryPosition?.abbreviation}
                    {player1Stats.player.primaryNumber && ` #${player1Stats.player.primaryNumber}`}
                  </p>
                  <div
                    className={cn(
                      'mt-2 text-2xl font-bold',
                      p1Wins > p2Wins ? 'text-emerald-500' : p1Wins < p2Wins ? 'text-muted-foreground' : 'text-amber-500'
                    )}
                  >
                    {p1Wins} {p1Wins === 1 ? 'win' : 'wins'}
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xl font-bold text-muted-foreground">VS</span>
                  </div>
                </div>

                {/* Player 2 Info */}
                <div className="flex-1 text-center">
                  <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted mb-3 ring-4 ring-mariners-teal/20">
                    <img
                      src={player2Stats.photoUrl}
                      alt={player2Stats.player.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/generic/headshot/67/current';
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-lg">{player2Stats.player.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {player2Stats.player.currentTeam?.abbreviation || player2Stats.player.currentTeam?.name || 'Free Agent'}{' '}
                    - {player2Stats.player.primaryPosition?.abbreviation}
                    {player2Stats.player.primaryNumber && ` #${player2Stats.player.primaryNumber}`}
                  </p>
                  <div
                    className={cn(
                      'mt-2 text-2xl font-bold',
                      p2Wins > p1Wins ? 'text-emerald-500' : p2Wins < p1Wins ? 'text-muted-foreground' : 'text-amber-500'
                    )}
                  >
                    {p2Wins} {p2Wins === 1 ? 'win' : 'wins'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hitting Stats */}
          {showHittingStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-mariners-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Hitting Stats
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {statMode === 'season' ? new Date().getFullYear() : 'Career'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {p1Hitting && p2Hitting ? (
                  <>
                    <StatBar
                      stat="AVG"
                      label="Batting Average"
                      value1={p1Hitting.avg}
                      value2={p2Hitting.avg}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="decimal"
                      precision={3}
                    />
                    <StatBar
                      stat="OBP"
                      label="On-Base Percentage"
                      value1={p1Hitting.obp}
                      value2={p2Hitting.obp}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="decimal"
                      precision={3}
                    />
                    <StatBar
                      stat="SLG"
                      label="Slugging Percentage"
                      value1={p1Hitting.slg}
                      value2={p2Hitting.slg}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="decimal"
                      precision={3}
                    />
                    <StatBar
                      stat="OPS"
                      label="On-Base + Slugging"
                      value1={p1Hitting.ops}
                      value2={p2Hitting.ops}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="decimal"
                      precision={3}
                    />
                    <StatBar
                      stat="HR"
                      label="Home Runs"
                      value1={p1Hitting.homeRuns}
                      value2={p2Hitting.homeRuns}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    <StatBar
                      stat="RBI"
                      label="Runs Batted In"
                      value1={p1Hitting.rbi}
                      value2={p2Hitting.rbi}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    <StatBar
                      stat="R"
                      label="Runs"
                      value1={p1Hitting.runs}
                      value2={p2Hitting.runs}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    <StatBar
                      stat="SB"
                      label="Stolen Bases"
                      value1={p1Hitting.stolenBases}
                      value2={p2Hitting.stolenBases}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    {/* Games Played (for context) */}
                    <div className="pt-4 border-t border-border">
                      <StatBarCompact
                        label="Games"
                        value1={p1Hitting.gamesPlayed}
                        value2={p2Hitting.gamesPlayed}
                        higherIsBetter={true}
                      />
                      <StatBarCompact
                        label="At Bats"
                        value1={p1Hitting.atBats}
                        value2={p2Hitting.atBats}
                        higherIsBetter={true}
                      />
                      <StatBarCompact
                        label="Hits"
                        value1={p1Hitting.hits}
                        value2={p2Hitting.hits}
                        higherIsBetter={true}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No hitting stats available for {statMode === 'season' ? 'this season' : 'career'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pitching Stats */}
          {showPitchingStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-mariners-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pitching Stats
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {statMode === 'season' ? new Date().getFullYear() : 'Career'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {p1Pitching && p2Pitching ? (
                  <>
                    <StatBar
                      stat="ERA"
                      label="Earned Run Average"
                      value1={p1Pitching.era}
                      value2={p2Pitching.era}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="ratio"
                      higherIsBetter={false}
                    />
                    <StatBar
                      stat="WHIP"
                      label="Walks + Hits per IP"
                      value1={p1Pitching.whip}
                      value2={p2Pitching.whip}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="ratio"
                      higherIsBetter={false}
                    />
                    <StatBar
                      stat="W-L"
                      label="Wins"
                      value1={p1Pitching.wins}
                      value2={p2Pitching.wins}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    <StatBar
                      stat="K"
                      label="Strikeouts"
                      value1={p1Pitching.strikeOuts}
                      value2={p2Pitching.strikeOuts}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                    />
                    <StatBar
                      stat="BB"
                      label="Walks"
                      value1={p1Pitching.baseOnBalls}
                      value2={p2Pitching.baseOnBalls}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="integer"
                      higherIsBetter={false}
                    />
                    <StatBar
                      stat="IP"
                      label="Innings Pitched"
                      value1={p1Pitching.inningsPitched}
                      value2={p2Pitching.inningsPitched}
                      player1Name={player1Stats.player.fullName}
                      player2Name={player2Stats.player.fullName}
                      format="decimal"
                      precision={1}
                    />
                    {/* Additional context */}
                    <div className="pt-4 border-t border-border">
                      <StatBarCompact
                        label="Games"
                        value1={p1Pitching.gamesPlayed}
                        value2={p2Pitching.gamesPlayed}
                        higherIsBetter={true}
                      />
                      <StatBarCompact
                        label="Starts"
                        value1={p1Pitching.gamesStarted}
                        value2={p2Pitching.gamesStarted}
                        higherIsBetter={true}
                      />
                      <StatBarCompact
                        label="Saves"
                        value1={p1Pitching.saves}
                        value2={p2Pitching.saves}
                        higherIsBetter={true}
                      />
                      <StatBarCompact
                        label="Record"
                        value1={`${p1Pitching.wins}-${p1Pitching.losses}`}
                        value2={`${p2Pitching.wins}-${p2Pitching.losses}`}
                        higherIsBetter={true}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No pitching stats available for {statMode === 'season' ? 'this season' : 'career'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!player1 && !player2 && !isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Select Two Players to Compare</h3>
              <p className="text-sm max-w-md mx-auto">
                Search for any MLB player above to see their stats side by side.
                Mariners players appear first in search results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
