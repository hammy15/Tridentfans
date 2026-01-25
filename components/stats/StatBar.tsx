'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatBarProps {
  stat: string;
  label: string;
  value1: number | string;
  value2: number | string;
  player1Name: string;
  player2Name: string;
  format?: 'decimal' | 'percentage' | 'integer' | 'ratio';
  higherIsBetter?: boolean;
  precision?: number;
}

export function StatBar({
  stat,
  label,
  value1,
  value2,
  player1Name,
  player2Name,
  format = 'decimal',
  higherIsBetter = true,
  precision = 3,
}: StatBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Convert string values to numbers for comparison
  const num1 = typeof value1 === 'string' ? parseFloat(value1) || 0 : value1;
  const num2 = typeof value2 === 'string' ? parseFloat(value2) || 0 : value2;

  // Determine winner
  const winner1 = higherIsBetter ? num1 > num2 : num1 < num2;
  const winner2 = higherIsBetter ? num2 > num1 : num2 < num1;
  const tie = num1 === num2;

  // Calculate percentages for the bar
  const total = num1 + num2 || 1;
  const percentage1 = (num1 / total) * 100;
  const percentage2 = (num2 / total) * 100;

  // Format values for display
  const formatValue = (val: number | string): string => {
    const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
    switch (format) {
      case 'decimal':
        return numVal.toFixed(precision);
      case 'percentage':
        return `${(numVal * 100).toFixed(1)}%`;
      case 'integer':
        return Math.round(numVal).toString();
      case 'ratio':
        return numVal.toFixed(2);
      default:
        return String(val);
    }
  };

  return (
    <div className="space-y-2">
      {/* Stat Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground uppercase">{stat}</span>
      </div>

      {/* Values Display */}
      <div className="flex items-center justify-between gap-4">
        {/* Player 1 Value */}
        <div
          className={cn(
            'flex-1 text-left transition-all duration-300',
            winner1 && !tie && 'text-emerald-500 font-bold',
            tie && 'text-amber-500'
          )}
        >
          <span className="text-lg tabular-nums">{formatValue(value1)}</span>
          {winner1 && !tie && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Visual Bar */}
        <div className="flex-[2] h-4 bg-muted rounded-full overflow-hidden relative">
          {/* Player 1 Side */}
          <div
            className={cn(
              'absolute left-0 top-0 h-full transition-all duration-700 ease-out rounded-l-full',
              winner1 && !tie ? 'bg-emerald-500' : tie ? 'bg-amber-500' : 'bg-mariners-navy/60'
            )}
            style={{ width: animated ? `${percentage1}%` : '0%' }}
          />
          {/* Player 2 Side */}
          <div
            className={cn(
              'absolute right-0 top-0 h-full transition-all duration-700 ease-out rounded-r-full',
              winner2 && !tie ? 'bg-emerald-500' : tie ? 'bg-amber-500' : 'bg-mariners-teal/60'
            )}
            style={{ width: animated ? `${percentage2}%` : '0%' }}
          />
          {/* Center Divider */}
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-background transform -translate-x-1/2 z-10" />
        </div>

        {/* Player 2 Value */}
        <div
          className={cn(
            'flex-1 text-right transition-all duration-300',
            winner2 && !tie && 'text-emerald-500 font-bold',
            tie && 'text-amber-500'
          )}
        >
          {winner2 && !tie && (
            <span className="mr-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          <span className="text-lg tabular-nums">{formatValue(value2)}</span>
        </div>
      </div>

      {/* Player Names (for mobile reference) */}
      <div className="flex items-center justify-between text-xs text-muted-foreground md:hidden">
        <span className="truncate max-w-[40%]">{player1Name}</span>
        <span className="truncate max-w-[40%] text-right">{player2Name}</span>
      </div>
    </div>
  );
}

// Compact version for dense layouts
export function StatBarCompact({
  label,
  value1,
  value2,
  higherIsBetter = true,
}: {
  label: string;
  value1: number | string;
  value2: number | string;
  higherIsBetter?: boolean;
}) {
  const num1 = typeof value1 === 'string' ? parseFloat(value1) || 0 : value1;
  const num2 = typeof value2 === 'string' ? parseFloat(value2) || 0 : value2;

  const winner1 = higherIsBetter ? num1 > num2 : num1 < num2;
  const winner2 = higherIsBetter ? num2 > num1 : num2 < num1;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span
        className={cn(
          'tabular-nums',
          winner1 ? 'text-emerald-500 font-semibold' : 'text-foreground'
        )}
      >
        {value1}
      </span>
      <span className="text-xs font-medium text-muted-foreground px-2">{label}</span>
      <span
        className={cn(
          'tabular-nums',
          winner2 ? 'text-emerald-500 font-semibold' : 'text-foreground'
        )}
      >
        {value2}
      </span>
    </div>
  );
}
