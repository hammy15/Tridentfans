import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get followers/following list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers'; // 'followers' | 'following'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (type !== 'followers' && type !== 'following') {
      return NextResponse.json({ error: 'type must be "followers" or "following"' }, { status: 400 });
    }

    let query;
    if (type === 'followers') {
      // Get users who follow this user
      query = supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          follower:profiles!user_follows_follower_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    } else {
      // Get users this user follows
      query = supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          following:profiles!user_follows_following_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get counts
    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Transform data based on type
    const users = data?.map(item => {
      const profile = 'follower' in item ? item.follower : item.following;
      return {
        ...profile,
        followedAt: item.created_at,
      };
    }) || [];

    return NextResponse.json({
      users,
      counts: {
        followers: followersCount || 0,
        following: followingCount || 0,
      },
    });
  } catch (error) {
    console.error('Follows GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }
}

// POST - Follow a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, followingId } = body;

    if (!userId || !followingId) {
      return NextResponse.json({ error: 'userId and followingId required' }, { status: 400 });
    }

    if (userId === followingId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
    }

    // Create follow
    const { data: follow, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: userId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for the followed user
    await supabase
      .from('notifications')
      .insert({
        user_id: followingId,
        type: 'follow',
        title: 'New Follower',
        message: 'Someone started following you',
        link: `/profile/${userId}`,
        metadata: { followerId: userId },
      });

    // Update follower/following counts if we have a cache table
    // (This would be handled by triggers in a real implementation)

    return NextResponse.json({ success: true, follow });
  } catch (error) {
    console.error('Follows POST error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, followingId } = body;

    if (!userId || !followingId) {
      return NextResponse.json({ error: 'userId and followingId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', followingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follows DELETE error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}

// Helper endpoint to check if user is following another user
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetId = searchParams.get('targetId');

    if (!userId || !targetId) {
      return new NextResponse(null, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', targetId)
      .single();

    if (existing) {
      return new NextResponse(null, { status: 200 }); // Is following
    } else {
      return new NextResponse(null, { status: 404 }); // Not following
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
