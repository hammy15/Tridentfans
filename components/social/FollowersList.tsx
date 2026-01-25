'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { FollowButton } from './FollowButton';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  showCount?: boolean;
  initialCount?: number;
  className?: string;
}

interface FollowUser extends Profile {
  isFollowing?: boolean;
}

export function FollowersList({
  userId,
  type,
  showCount = true,
  initialCount,
  className,
}: FollowersListProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createClient();

  // Fetch count
  const fetchCount = useCallback(async () => {
    const column = type === 'followers' ? 'following_id' : 'follower_id';
    const { count: totalCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq(column, userId);

    setCount(totalCount ?? 0);
  }, [userId, type, supabase]);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);

    // Build query based on type
    const foreignColumn = type === 'followers' ? 'follower_id' : 'following_id';
    const targetColumn = type === 'followers' ? 'following_id' : 'follower_id';

    const { data: follows, error } = await supabase
      .from('follows')
      .select(`${foreignColumn}`)
      .eq(targetColumn, userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !follows) {
      setLoading(false);
      return;
    }

    // Get user IDs
    const userIds = follows.map((f) => f[foreignColumn as keyof typeof f] as string);

    if (userIds.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (!profiles) {
      setLoading(false);
      return;
    }

    // Check follow status for current user
    let followedByCurrentUser: Set<string> = new Set();
    if (currentUser) {
      const { data: currentUserFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)
        .in('following_id', userIds);

      if (currentUserFollows) {
        followedByCurrentUser = new Set(currentUserFollows.map((f) => f.following_id));
      }
    }

    // Merge data
    const usersWithFollowStatus: FollowUser[] = (profiles as Profile[]).map((profile) => ({
      ...profile,
      isFollowing: followedByCurrentUser.has(profile.id),
    }));

    // Sort to match original order
    usersWithFollowStatus.sort(
      (a, b) => userIds.indexOf(a.id) - userIds.indexOf(b.id)
    );

    setUsers(usersWithFollowStatus);
    setLoading(false);
  }, [userId, type, currentUser, isOpen, supabase]);

  useEffect(() => {
    if (initialCount === undefined) {
      fetchCount();
    }
  }, [fetchCount, initialCount]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, isFollowing } : u))
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-auto p-0 hover:bg-transparent"
      >
        <span className="font-semibold">{count.toLocaleString()}</span>
        {showCount && (
          <span className="ml-1 text-muted-foreground">
            {type === 'followers' ? 'Followers' : 'Following'}
          </span>
        )}
      </Button>

      {/* Modal/Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">
                {type === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-mariners-teal border-t-transparent" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="mb-2 h-12 w-12 opacity-50" />
                  <p>
                    {type === 'followers'
                      ? 'No followers yet'
                      : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
                    >
                      <a
                        href={`/profile/${user.username}`}
                        className="flex flex-1 items-center gap-3"
                      >
                        <Avatar
                          src={user.avatar_url}
                          alt={user.display_name || user.username}
                          fallback={user.username.charAt(0).toUpperCase()}
                          className="h-10 w-10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">
                            {user.display_name || user.username}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </a>
                      <FollowButton
                        userId={user.id}
                        initialFollowing={user.isFollowing}
                        size="sm"
                        showIcon={false}
                        onFollowChange={(isFollowing) =>
                          handleFollowChange(user.id, isFollowing)
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
