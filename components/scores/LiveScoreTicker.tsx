'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'pregame' | 'live' | 'final';
  inning?: string;
  startTime?: string;
}

// Mock data for development/fallback
const mockGames: LiveGame[] = [
  {
    id: '1',
    homeTeam: 'SEA',
    awayTeam: 'LAA',
    homeScore: 5,
    awayScore: 3,
    status: 'live',
    inning: 'Bot 7th',
  },
  {
    id: '2',
    homeTeam: 'NYY',
    awayTeam: 'BOS',
    homeScore: 2,
    awayScore: 4,
    status: 'live',
    inning: 'Top 5th',
  },
  {
    id: '3',
    homeTeam: 'LAD',
    awayTeam: 'SF',
    homeScore: 0,
    awayScore: 0,
    status: 'pregame',
    startTime: '7:10 PM',
  },
  {
    id: '4',
    homeTeam: 'HOU',
    awayTeam: 'TEX',
    homeScore: 6,
    awayScore: 2,
    status: 'final',
  },
  {
    id: '5',
    homeTeam: 'CHC',
    awayTeam: 'MIL',
    homeScore: 3,
    awayScore: 3,
    status: 'live',
    inning: 'Top 9th',
  },
  {
    id: '6',
    homeTeam: 'ATL',
    awayTeam: 'PHI',
    homeScore: 7,
    awayScore: 5,
    status: 'final',
  },
  {
    id: '7',
    homeTeam: 'SD',
    awayTeam: 'AZ',
    homeScore: 0,
    awayScore: 0,
    status: 'pregame',
    startTime: '9:40 PM',
  },
  {
    id: '8',
    homeTeam: 'CLE',
    awayTeam: 'DET',
    homeScore: 4,
    awayScore: 1,
    status: 'live',
    inning: 'Bot 6th',
  },
];

function GameCard({ game }: { game: LiveGame }) {
  const isMariners = game.homeTeam === 'SEA' || game.awayTeam === 'SEA';
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isPregame = game.status === 'pregame';

  return (
    <div
      className={cn(
        'flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md border',
        isMariners
          ? 'bg-[#005C5C]/20 border-[#005C5C] text-white'
          : 'bg-white/5 border-white/20 text-white/90'
      )}
    >
      {/* Live badge */}
      {isLive && (
        <Badge variant="live" className="text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
          <Radio className="h-2.5 w-2.5" />
          LIVE
        </Badge>
      )}

      {/* Teams and scores */}
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <span className={cn(isMariners && game.awayTeam === 'SEA' && 'text-[#005C5C] font-bold')}>
          {game.awayTeam}
        </span>
        {!isPregame && (
          <>
            <span className="text-white/60">{game.awayScore}</span>
            <span className="text-white/40">-</span>
            <span className="text-white/60">{game.homeScore}</span>
          </>
        )}
        <span className={cn(isMariners && game.homeTeam === 'SEA' && 'text-[#005C5C] font-bold')}>
          {game.homeTeam}
        </span>
      </div>

      {/* Status */}
      <span className="text-xs text-white/50 whitespace-nowrap">
        {isLive && game.inning}
        {isFinal && 'Final'}
        {isPregame && game.startTime}
      </span>
    </div>
  );
}

export function LiveScoreTicker() {
  const [games, setGames] = useState<LiveGame[]>(mockGames);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        // Attempt to fetch from MLB Stats API via our endpoint
        const res = await fetch('/api/mlb?type=scores');
        if (res.ok) {
          const data = await res.json();
          if (data.games && data.games.length > 0) {
            setGames(data.games);
          }
        }
      } catch (error) {
        console.error('Failed to fetch scores, using mock data:', error);
        // Keep using mock data on error
      }
      setLoading(false);
    }

    fetchScores();

    // Refresh every 60 seconds
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort games: live first, then pregame, then final
  // Mariners games prioritized within each category
  const sortedGames = [...games].sort((a, b) => {
    const statusOrder = { live: 0, pregame: 1, final: 2 };
    const aIsMariners = a.homeTeam === 'SEA' || a.awayTeam === 'SEA';
    const bIsMariners = b.homeTeam === 'SEA' || b.awayTeam === 'SEA';

    // First sort by Mariners
    if (aIsMariners && !bIsMariners) return -1;
    if (!aIsMariners && bIsMariners) return 1;

    // Then by status
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (loading || games.length === 0) {
    return null;
  }

  // Duplicate games for seamless loop
  const duplicatedGames = [...sortedGames, ...sortedGames];

  return (
    <div
      className="w-full bg-[#0C2C56] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-10 flex items-center">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0C2C56] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0C2C56] to-transparent z-10 pointer-events-none" />

        {/* Scrolling content */}
        <div
          ref={tickerRef}
          className={cn('flex gap-4 px-8', 'animate-ticker', isPaused && 'animation-paused')}
          style={{
            animationDuration: `${sortedGames.length * 5}s`,
          }}
        >
          {duplicatedGames.map((game, index) => (
            <GameCard key={`${game.id}-${index}`} game={game} />
          ))}
        </div>
      </div>

      {/* Inline styles for animation */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-ticker {
          animation: ticker linear infinite;
          will-change: transform;
        }

        .animation-paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
