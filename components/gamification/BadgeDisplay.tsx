'use client';

import { useState } from 'react';

type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface Badge {
  icon: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  earnedAt: string | Date;
}

interface BadgeDisplayProps {
  badges: Badge[];
  columns?: 2 | 3 | 4 | 5 | 6;
  showEarnedDate?: boolean;
}

// Rarity color mapping
const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-600 dark:text-gray-400',
    glow: '',
  },
  uncommon: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400 dark:border-green-600',
    text: 'text-green-600 dark:text-green-400',
    glow: 'shadow-green-200 dark:shadow-green-900/50',
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-200 dark:shadow-blue-900/50',
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-400 dark:border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-200 dark:shadow-purple-900/50',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
    border: 'border-yellow-400 dark:border-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    glow: 'shadow-lg shadow-yellow-200 dark:shadow-yellow-900/50',
  },
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function BadgeDisplay({
  badges,
  columns = 4,
  showEarnedDate = true
}: BadgeDisplayProps) {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-4xl mb-2">🏆</p>
        <p>No badges earned yet</p>
        <p className="text-sm mt-1">Complete activities to earn badges!</p>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {badges.map((badge, index) => {
        const colors = RARITY_COLORS[badge.rarity];
        const uniqueKey = `${badge.name}-${index}`;
        const isHovered = hoveredBadge === uniqueKey;
        const earnedDate = badge.earnedAt instanceof Date
          ? badge.earnedAt
          : new Date(badge.earnedAt);

        return (
          <div
            key={uniqueKey}
            className={`
              relative flex flex-col items-center p-4 rounded-xl border-2
              transition-all duration-300 cursor-default
              ${colors.bg} ${colors.border} ${colors.glow}
              hover:scale-105 hover:shadow-lg
              ${badge.rarity === 'legendary' ? 'animate-[pulse-legendary_3s_ease-in-out_infinite]' : ''}
            `}
            onMouseEnter={() => setHoveredBadge(uniqueKey)}
            onMouseLeave={() => setHoveredBadge(null)}
          >
            {/* Badge icon */}
            <span className="text-4xl mb-2">{badge.icon}</span>

            {/* Badge name */}
            <p className="font-semibold text-center text-sm leading-tight">
              {badge.name}
            </p>

            {/* Rarity label */}
            <span className={`text-xs font-medium mt-1 ${colors.text}`}>
              {RARITY_LABELS[badge.rarity]}
            </span>

            {/* Earned date */}
            {showEarnedDate && (
              <p className="text-xs text-muted-foreground mt-2">
                {earnedDate.toLocaleDateString()}
              </p>
            )}

            {/* Tooltip on hover */}
            {isHovered && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                  bg-popover text-popover-foreground border rounded-lg shadow-xl
                  p-3 w-48 text-center transition-opacity duration-200"
              >
                <p className="text-sm">{badge.description}</p>
                {/* Tooltip arrow */}
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
                    border-8 border-transparent border-t-popover"
                />
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

// Single badge display component
interface SingleBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function SingleBadge({ badge, size = 'md', showTooltip = true }: SingleBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = RARITY_COLORS[badge.rarity];

  const sizeClasses = {
    sm: 'p-2 text-xl',
    md: 'p-3 text-3xl',
    lg: 'p-4 text-5xl',
  };

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-xl border-2
        transition-all duration-300 cursor-default
        ${colors.bg} ${colors.border} ${colors.glow}
        ${sizeClasses[size]}
        hover:scale-110
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={showTooltip ? undefined : `${badge.name}: ${badge.description}`}
    >
      <span>{badge.icon}</span>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
            bg-popover text-popover-foreground border rounded-lg shadow-xl
            p-3 w-48 text-center"
        >
          <p className="font-semibold text-sm">{badge.name}</p>
          <span className={`text-xs font-medium ${colors.text}`}>
            {RARITY_LABELS[badge.rarity]}
          </span>
          <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
              border-8 border-transparent border-t-popover"
          />
        </div>
      )}
    </div>
  );
}
