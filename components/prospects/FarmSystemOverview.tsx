'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  TrendingUp,
  Users,
  Star,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
} from 'lucide-react';

interface FarmSystemOverviewProps {
  limit?: number;
  showUpdates?: boolean;
}

const levelColors: Record<string, string> = {
  AAA: 'bg-purple-500',
  AA: 'bg-blue-500',
  'A+': 'bg-green-500',
  A: 'bg-emerald-500',
  Rookie: 'bg-orange-500',
  DSL: 'bg-yellow-500',
};

export function FarmSystemOverview({
  limit = 10,
  showUpdates = true,
}: FarmSystemOverviewProps) {
  const [topProspects, setTopProspects] = useState<Prospect[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<
    (ProspectUpdate & { prospect?: Prospect })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [systemRanking, setSystemRanking] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch(`/api/prospects?limit=${limit}&featured=true`);
      const data = await res.json();

      if (data.prospects) {
        setTopProspects(
          data.prospects.sort(
            (a: Prospect, b: Prospect) =>
              (a.ranking || 999) - (b.ranking || 999)
          )
        );
      }

      if (data.updates) {
        setRecentUpdates(data.updates);
      }

      if (data.systemRanking !== undefined) {
        setSystemRanking(data.systemRanking);
      }
    } catch (error) {
      console.error('Failed to fetch farm system data:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-mariners-teal" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-mariners-teal" />
              Farm System Overview
            </CardTitle>
            <CardDescription>
              Top prospects in the Mariners organization
            </CardDescription>
          </div>
          {systemRanking && (
            <Badge variant="mariners" className="text-lg px-4 py-1">
              #{systemRanking} System
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {/* Top 10 Prospects List */}
          <div className="space-y-2">
            {topProspects.slice(0, 10).map((prospect, index) => (
              <Link
                key={prospect.id}
                href={`/prospects?highlight=${prospect.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                {/* Ranking */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index < 3
                      ? 'bg-mariners-gold text-mariners-navy'
                      : 'bg-muted'
                  }`}
                >
                  {prospect.ranking || index + 1}
                </div>

                {/* Name & Position */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-mariners-teal transition-colors">
                    {prospect.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prospect.position} - {prospect.team_name}
                  </p>
                </div>

                {/* Level Badge */}
                <Badge
                  className={`${levelColors[prospect.level]} text-white hidden sm:inline-flex`}
                >
                  {prospect.level}
                </Badge>

                {/* ETA */}
                {prospect.eta && (
                  <span className="text-sm text-muted-foreground hidden md:block">
                    ETA: {prospect.eta}
                  </span>
                )}

                {/* Featured indicator */}
                {prospect.is_featured && (
                  <Star className="w-4 h-4 text-mariners-gold fill-mariners-gold" />
                )}

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-mariners-teal transition-colors" />
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-4 pt-4 border-t">
            <Link href="/prospects">
              <Button variant="outline" className="w-full">
                View Full Farm System
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      {showUpdates && recentUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-mariners-teal" />
              Recent Prospect News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUpdates.slice(0, 5).map((update) => (
                <div
                  key={update.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  {/* Update Type Icon */}
                  <div
                    className={`mt-0.5 ${
                      update.update_type === 'promotion'
                        ? 'text-green-500'
                        : update.update_type === 'injury'
                          ? 'text-red-500'
                          : 'text-blue-500'
                    }`}
                  >
                    {update.update_type === 'promotion' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : update.update_type === 'injury' ? (
                      <ArrowDownCircle className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{update.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {update.update_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {update.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(update.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prospects by Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              topProspects.reduce(
                (acc, p) => {
                  acc[p.level] = (acc[p.level] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            )
              .sort((a, b) => {
                const order = ['AAA', 'AA', 'A+', 'A', 'Rookie', 'DSL'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
              })
              .map(([level, count]) => (
                <Link
                  key={level}
                  href={`/prospects?level=${level}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Badge className={`${levelColors[level]} text-white`}>
                    {level}
                  </Badge>
                  <span className="font-medium">{count}</span>
                  <span className="text-muted-foreground text-sm">
                    prospect{count !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
