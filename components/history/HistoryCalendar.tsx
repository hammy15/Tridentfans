'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from 'lucide-react';
import type { HistoricalMoment, HistoricalCategory } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/mariners-history-moments';

interface HistoryCalendarProps {
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function HistoryCalendar({ className = '' }: HistoryCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [moments, setMoments] = useState<HistoricalMoment[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const isToday = (month: number, day: number) =>
    month === today.getMonth() && day === today.getDate();

  useEffect(() => {
    if (selectedDay !== null) {
      fetchMomentsForDate(selectedMonth + 1, selectedDay);
    }
  }, [selectedMonth, selectedDay]);

  async function fetchMomentsForDate(month: number, day: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?month=${month}&day=${day}`);
      const data = await res.json();
      setMoments(data.moments || []);
    } catch (error) {
      console.error('Failed to fetch moments:', error);
      setMoments([]);
    }
    setLoading(false);
  }

  const prevMonth = () => {
    setSelectedMonth((prev) => (prev - 1 + 12) % 12);
    setSelectedDay(null);
    setMoments([]);
  };

  const nextMonth = () => {
    setSelectedMonth((prev) => (prev + 1) % 12);
    setSelectedDay(null);
    setMoments([]);
  };

  const handleDayClick = (day: number) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      setMoments([]);
    } else {
      setSelectedDay(day);
    }
  };

  const goToToday = () => {
    setSelectedMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  // Generate calendar days
  const daysInMonth = DAYS_IN_MONTH[selectedMonth];
  const firstDayOfMonth = new Date(2024, selectedMonth, 1).getDay(); // 2024 is a leap year
  const calendarDays: (number | null)[] = [];

  // Add empty slots for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add the days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-mariners-teal" />
              Mariners History Calendar
            </CardTitle>
            <CardDescription>
              Browse historical moments by date
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold">{MONTHS[selectedMonth]}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => (
            <button
              key={idx}
              onClick={() => day && handleDayClick(day)}
              disabled={day === null}
              className={`
                aspect-square p-1 text-sm rounded-md transition-colors
                ${day === null ? 'invisible' : ''}
                ${
                  selectedDay === day && day !== null
                    ? 'bg-mariners-teal text-white font-bold'
                    : isToday(selectedMonth, day || 0)
                    ? 'bg-mariners-navy text-white'
                    : 'hover:bg-muted'
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Selected Date Moments */}
        {selectedDay !== null && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">
              {MONTHS[selectedMonth]} {selectedDay}
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
              </div>
            ) : moments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {moments.map((moment) => (
                  <div
                    key={moment.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`${CATEGORY_COLORS[moment.category as HistoricalCategory]} text-white text-xs`}
                        >
                          {CATEGORY_LABELS[moment.category as HistoricalCategory]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {moment.year}
                        </span>
                      </div>
                      {moment.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <h5 className="font-semibold text-sm mb-1">{moment.title}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {moment.description}
                    </p>
                    {moment.player_names && moment.player_names.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {moment.player_names.slice(0, 3).map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                        {moment.player_names.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{moment.player_names.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No historical moments recorded for this date
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
