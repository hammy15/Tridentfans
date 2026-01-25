'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserMinus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'mariners';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialFollowing,
  variant = 'mariners',
  size = 'sm',
  showIcon = true,
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasChecked, setHasChecked] = useState(initialFollowing !== undefined);

  const supabase = createClient();

  // Check if already following
  const checkFollowStatus = useCallback(async () => {
    if (!user || user.id === userId || hasChecked) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    setIsFollowing(!!data);
    setHasChecked(true);
  }, [user, userId, supabase, hasChecked]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleFollow = async () => {
    if (!user || user.id === userId) return;

    setIsLoading(true);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (!error) {
        setIsFollowing(false);
        onFollowChange?.(false);
      }
    } else {
      // Follow
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
      });

      if (!error) {
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    }

    setIsLoading(false);
  };

  // Don't show button for own profile or if not logged in
  if (!user || user.id === userId) {
    return null;
  }

  const showUnfollow = isFollowing && isHovering;

  return (
    <Button
      variant={isFollowing ? (showUnfollow ? 'destructive' : 'outline') : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        'min-w-[100px] transition-all duration-200',
        isFollowing && !showUnfollow && 'border-mariners-teal text-mariners-teal',
        className
      )}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isFollowing ? (
        showUnfollow ? (
          <>
            {showIcon && <UserMinus className="h-4 w-4" />}
            <span>Unfollow</span>
          </>
        ) : (
          <>
            {showIcon && <Check className="h-4 w-4" />}
            <span>Following</span>
          </>
        )
      ) : (
        <>
          {showIcon && <UserPlus className="h-4 w-4" />}
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}
