'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Shuffle,
  Star,
} from 'lucide-react';
import type { HistoricalMoment, HistoricalCategory } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/mariners-history-moments';

interface OnThisDayProps {
  className?: string;
  compact?: boolean;
}

export function OnThisDay({ className = '', compact = false }: OnThisDayProps) {
  const [moments, setMoments] = useState<HistoricalMoment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [randomMoment, setRandomMoment] = useState<HistoricalMoment | null>(null);

  useEffect(() => {
    fetchTodayHistory();
  }, []);

  async function fetchTodayHistory() {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const res = await fetch(`/api/history?month=${month}&day=${day}`);
      const data = await res.json();

      if (data.moments && data.moments.length > 0) {
        setMoments(data.moments);
      } else if (data.randomMoment) {
        // No moments for today, show a random one
        setRandomMoment(data.randomMoment);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
    setLoading(false);
  }

  async function fetchRandomMoment() {
    try {
      const res = await fetch('/api/history?random=true');
      const data = await res.json();
      if (data.moment) {
        setRandomMoment(data.moment);
        setMoments([]);
      }
    } catch (error) {
      console.error('Failed to fetch random moment:', error);
    }
  }

  const nextMoment = () => {
    setCurrentIndex((prev) => (prev + 1) % moments.length);
  };

  const prevMoment = () => {
    setCurrentIndex((prev) => (prev - 1 + moments.length) % moments.length);
  };

  const currentMoment = moments[currentIndex] || randomMoment;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </CardContent>
      </Card>
    );
  }

  if (!currentMoment) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-mariners-teal" />
            On This Day in Mariners History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No historical moments found. Check back later!
          </p>
          <Button variant="outline" onClick={fetchRandomMoment} className="w-full">
            <Shuffle className="h-4 w-4 mr-2" />
            Show Random Moment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`${className} bg-gradient-to-r from-mariners-navy to-mariners-teal text-white`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium text-white/80">
                  {moments.length > 0 ? 'On This Day' : 'From Mariners History'}
                </span>
                <span className="text-sm text-white/60">
                  {currentMoment.date_month}/{currentMoment.date_day}/{currentMoment.year}
                </span>
              </div>
              <h4 className="font-bold mb-1">{currentMoment.title}</h4>
              <p className="text-sm text-white/80 line-clamp-2">{currentMoment.description}</p>
            </div>
            {currentMoment.is_featured && (
              <Star className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-mariners-teal" />
              {moments.length > 0 ? 'On This Day' : 'From Mariners History'}
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </div>
          {moments.length === 0 && (
            <Button variant="ghost" size="sm" onClick={fetchRandomMoment}>
              <Shuffle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Content */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  className={`${CATEGORY_COLORS[currentMoment.category as HistoricalCategory]} text-white`}
                >
                  {CATEGORY_LABELS[currentMoment.category as HistoricalCategory]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentMoment.year}
                </span>
                {currentMoment.is_featured && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <h3 className="font-bold text-lg leading-tight">{currentMoment.title}</h3>
            </div>
          </div>

          <p className="text-muted-foreground">{currentMoment.description}</p>

          {/* Player Tags */}
          {currentMoment.player_names && currentMoment.player_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {currentMoment.player_names.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          )}

          {/* Source Link */}
          {currentMoment.source_url && (
            <a
              href={currentMoment.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-mariners-teal hover:underline"
            >
              Learn more
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Carousel Navigation */}
        {moments.length > 1 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMoment}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {moments.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex
                      ? 'bg-mariners-teal'
                      : 'bg-muted hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to moment ${idx + 1}`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMoment}
              className="text-muted-foreground hover:text-foreground"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
