'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
}

interface UserBadgesProps {
  userId: string;
  compact?: boolean;
  showAll?: boolean;
}

export function UserBadges({ userId, compact = false, showAll = false }: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  async function fetchBadges() {
    try {
      const res = await fetch(`/api/badges?userId=${userId}`);
      const data = await res.json();
      setBadges(data.badges || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (badges.length === 0) {
    if (compact) return null;
    return <p className="text-sm text-muted-foreground">No badges yet</p>;
  }

  const displayBadges = showAll ? badges : badges.slice(0, 5);

  if (compact) {
    return (
      <div className="flex gap-1">
        {displayBadges.map(badge => (
          <span
            key={badge.id}
            title={`${badge.badge_name}: ${badge.badge_description}`}
            className="cursor-help"
          >
            {badge.badge_icon}
          </span>
        ))}
        {!showAll && badges.length > 5 && (
          <span className="text-xs text-muted-foreground">+{badges.length - 5}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Badges ({badges.length})</h3>
      <div className="flex flex-wrap gap-2">
        {displayBadges.map(badge => (
          <Badge
            key={badge.id}
            variant="outline"
            className="px-3 py-2 flex items-center gap-2 cursor-help"
            title={badge.badge_description}
          >
            <span className="text-lg">{badge.badge_icon}</span>
            <span>{badge.badge_name}</span>
          </Badge>
        ))}
      </div>
      {!showAll && badges.length > 5 && (
        <p className="text-sm text-muted-foreground">And {badges.length - 5} more...</p>
      )}
    </div>
  );
}

// Badge showcase for profile pages
export function BadgeShowcase({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  async function fetchBadges() {
    try {
      const res = await fetch(`/api/badges?userId=${userId}`);
      const data = await res.json();
      setBadges(data.badges || []);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No badges earned yet</p>
        <p className="text-sm mt-2">Participate in predictions and forum discussions to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map(badge => (
        <div
          key={badge.id}
          className="flex flex-col items-center p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <span className="text-4xl mb-2">{badge.badge_icon}</span>
          <p className="font-medium text-center">{badge.badge_name}</p>
          <p className="text-xs text-muted-foreground text-center mt-1">{badge.badge_description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(badge.earned_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
