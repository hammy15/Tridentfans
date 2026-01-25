'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Prospect } from '@/types';
import { User, TrendingUp, Calendar } from 'lucide-react';

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
}

const levelColors: Record<string, string> = {
  AAA: 'bg-purple-500',
  AA: 'bg-blue-500',
  'A+': 'bg-green-500',
  A: 'bg-emerald-500',
  Rookie: 'bg-orange-500',
  DSL: 'bg-yellow-500',
};

const positionColors: Record<string, string> = {
  P: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  C: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  '1B': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  '2B': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  '3B': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  SS: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  LF: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  CF: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  RF: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  OF: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  DH: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  RHP: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  LHP: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  IF: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  UT: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

// Simple radar chart for scouting grades
function ScoutingRadar({ grades }: { grades: Prospect['scouting_grades'] }) {
  if (!grades) return null;

  const gradeLabels = [
    { key: 'hit', label: 'HIT' },
    { key: 'power', label: 'PWR' },
    { key: 'speed', label: 'SPD' },
    { key: 'arm', label: 'ARM' },
    { key: 'field', label: 'FLD' },
  ];

  return (
    <div className="flex gap-1 mt-2">
      {gradeLabels.map(({ key, label }) => {
        const value = grades[key as keyof typeof grades];
        if (value === undefined) return null;

        const getColor = (v: number) => {
          if (v >= 70) return 'bg-green-500';
          if (v >= 55) return 'bg-blue-500';
          if (v >= 45) return 'bg-yellow-500';
          return 'bg-gray-400';
        };

        return (
          <div key={key} className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <div
              className={`w-6 h-6 rounded-full ${getColor(value)} flex items-center justify-center`}
            >
              <span className="text-[10px] font-bold text-white">{value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProspectCard({ prospect, onClick }: ProspectCardProps) {
  const [imageError, setImageError] = useState(false);
  const isPitcher =
    prospect.position === 'P' ||
    prospect.position === 'RHP' ||
    prospect.position === 'LHP';

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header with photo/placeholder */}
        <div className="relative bg-gradient-to-br from-mariners-navy to-mariners-teal h-24 flex items-end justify-between p-3">
          {/* Ranking badge */}
          {prospect.ranking && (
            <div className="absolute top-2 left-2 bg-mariners-gold text-mariners-navy font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md">
              #{prospect.ranking}
            </div>
          )}

          {/* Photo */}
          <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20 overflow-hidden border-2 border-white/50">
            {prospect.photo_url && !imageError ? (
              <img
                src={prospect.photo_url}
                alt={prospect.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-white/70" />
              </div>
            )}
          </div>

          {/* Level badge */}
          <Badge className={`${levelColors[prospect.level]} text-white`}>
            {prospect.level}
          </Badge>
        </div>

        {/* Player info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg leading-tight">{prospect.name}</h3>
              <p className="text-sm text-muted-foreground">{prospect.team_name}</p>
            </div>
            <Badge
              variant="outline"
              className={positionColors[prospect.position] || 'bg-gray-100'}
            >
              {prospect.position}
            </Badge>
          </div>

          {/* Quick info row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span>Age {prospect.age}</span>
            <span>B/T: {prospect.bats}/{prospect.throws}</span>
            {prospect.eta && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                ETA: {prospect.eta}
              </span>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex gap-3 mb-2">
            {isPitcher ? (
              <>
                {prospect.stats.era !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-mariners-teal">
                      {prospect.stats.era.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">ERA</p>
                  </div>
                )}
                {prospect.stats.wins !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">{prospect.stats.wins}</p>
                    <p className="text-xs text-muted-foreground">W</p>
                  </div>
                )}
                {prospect.stats.strikeouts !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">{prospect.stats.strikeouts}</p>
                    <p className="text-xs text-muted-foreground">K</p>
                  </div>
                )}
                {prospect.stats.whip !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {prospect.stats.whip.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">WHIP</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {prospect.stats.avg !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-mariners-teal">
                      .{Math.round(prospect.stats.avg * 1000)
                        .toString()
                        .padStart(3, '0')}
                    </p>
                    <p className="text-xs text-muted-foreground">AVG</p>
                  </div>
                )}
                {prospect.stats.hr !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">{prospect.stats.hr}</p>
                    <p className="text-xs text-muted-foreground">HR</p>
                  </div>
                )}
                {prospect.stats.rbi !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">{prospect.stats.rbi}</p>
                    <p className="text-xs text-muted-foreground">RBI</p>
                  </div>
                )}
                {prospect.stats.sb !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold">{prospect.stats.sb}</p>
                    <p className="text-xs text-muted-foreground">SB</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Scouting grades */}
          {prospect.scouting_grades && (
            <ScoutingRadar grades={prospect.scouting_grades} />
          )}

          {/* Featured indicator */}
          {prospect.is_featured && (
            <div className="mt-3 flex items-center gap-1 text-xs text-mariners-teal font-medium">
              <TrendingUp className="w-3 h-3" />
              Featured Prospect
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
