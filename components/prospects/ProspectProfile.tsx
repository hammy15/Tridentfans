'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Prospect, ProspectUpdate } from '@/types';
import {
  X,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowUpCircle,
  Zap,
  FileText,
} from 'lucide-react';

interface ProspectProfileProps {
  prospect: Prospect;
  onClose: () => void;
  updates?: ProspectUpdate[];
}

const levelColors: Record<string, string> = {
  AAA: 'bg-purple-500',
  AA: 'bg-blue-500',
  'A+': 'bg-green-500',
  A: 'bg-emerald-500',
  Rookie: 'bg-orange-500',
  DSL: 'bg-yellow-500',
};

const updateTypeIcons: Record<string, React.ReactNode> = {
  promotion: <ArrowUpCircle className="w-4 h-4 text-green-500" />,
  stats: <TrendingUp className="w-4 h-4 text-blue-500" />,
  injury: <AlertCircle className="w-4 h-4 text-red-500" />,
  trade: <Zap className="w-4 h-4 text-purple-500" />,
  signing: <FileText className="w-4 h-4 text-teal-500" />,
};

function GradeBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-green-500';
    if (v >= 60) return 'bg-blue-500';
    if (v >= 50) return 'bg-yellow-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRating = (v: number) => {
    if (v >= 80) return 'Elite';
    if (v >= 70) return 'Plus-Plus';
    if (v >= 60) return 'Plus';
    if (v >= 55) return 'Above Avg';
    if (v >= 50) return 'Average';
    if (v >= 45) return 'Below Avg';
    if (v >= 40) return 'Fringe';
    return 'Poor';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value} - {getRating(value)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${(value / 80) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function ProspectProfile({
  prospect,
  onClose,
  updates = [],
}: ProspectProfileProps) {
  const [imageError, setImageError] = useState(false);
  const isPitcher =
    prospect.position === 'P' ||
    prospect.position === 'RHP' ||
    prospect.position === 'LHP';

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-mariners-navy to-mariners-teal p-6 text-white">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="w-24 h-24 rounded-full bg-white/20 overflow-hidden border-4 border-white/50 flex-shrink-0">
              {prospect.photo_url && !imageError ? (
                <img
                  src={prospect.photo_url}
                  alt={prospect.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white/70" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {prospect.ranking && (
                  <Badge className="bg-mariners-gold text-mariners-navy font-bold">
                    #{prospect.ranking}
                  </Badge>
                )}
                <Badge className={`${levelColors[prospect.level]} text-white`}>
                  {prospect.level}
                </Badge>
                {prospect.is_featured && (
                  <Badge variant="outline" className="border-white/50 text-white">
                    Featured
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl font-bold">{prospect.name}</h2>
              <p className="text-white/80">{prospect.team_name}</p>

              <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                <span>{prospect.position}</span>
                <span>Age {prospect.age}</span>
                <span>B/T: {prospect.bats}/{prospect.throws}</span>
                {prospect.eta && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    ETA: {prospect.eta}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isPitcher ? 'Pitching Stats' : 'Batting Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {isPitcher ? (
                  <>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-mariners-teal">
                        {prospect.stats.era?.toFixed(2) ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">ERA</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.wins ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.strikeouts ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">K</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.whip?.toFixed(2) ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">WHIP</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-mariners-teal">
                        {prospect.stats.avg
                          ? `.${Math.round(prospect.stats.avg * 1000)
                              .toString()
                              .padStart(3, '0')}`
                          : '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">AVG</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.hr ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">HR</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.rbi ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">RBI</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {prospect.stats.sb ?? '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">SB</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scouting Grades */}
          {prospect.scouting_grades && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scouting Grades</CardTitle>
                <CardDescription>
                  20-80 scouting scale (50 = MLB average)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {prospect.scouting_grades.hit !== undefined && (
                  <GradeBar label="Hit" value={prospect.scouting_grades.hit} />
                )}
                {prospect.scouting_grades.power !== undefined && (
                  <GradeBar label="Power" value={prospect.scouting_grades.power} />
                )}
                {prospect.scouting_grades.speed !== undefined && (
                  <GradeBar label="Speed" value={prospect.scouting_grades.speed} />
                )}
                {prospect.scouting_grades.arm !== undefined && (
                  <GradeBar label="Arm" value={prospect.scouting_grades.arm} />
                )}
                {prospect.scouting_grades.field !== undefined && (
                  <GradeBar label="Field" value={prospect.scouting_grades.field} />
                )}
                {prospect.scouting_grades.overall !== undefined && (
                  <div className="pt-2 border-t">
                    <GradeBar
                      label="Overall"
                      value={prospect.scouting_grades.overall}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {prospect.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scouting Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{prospect.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Updates */}
          {updates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="flex gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {updateTypeIcons[update.update_type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{update.title}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {update.update_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {update.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(update.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground text-center">
            Last updated:{' '}
            {new Date(prospect.last_updated).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
