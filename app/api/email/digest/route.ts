import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendDigest,
  sendBulkDigest,
  generateDigestContent,
  getUsersForDigestDay,
} from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Preview digest for a user
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate digest content
    const content = await generateDigestContent(userId);

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate digest content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: profile,
      content,
    });
  } catch (error) {
    console.error('[Digest API] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Trigger digest send
 * Can be called by cron job or manually from admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userIds, day } = body;

    // Verify authorization
    const cronSecret = request.headers.get('x-cron-secret');
    const isAuthorized = cronSecret === process.env.CRON_SECRET;

    // For non-cron requests, check admin auth
    if (!isAuthorized) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Verify the user is an admin
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Handle different actions
    switch (action) {
      case 'send_single': {
        // Send digest to a single user
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const result = await sendDigest(userId);
        return NextResponse.json(result);
      }

      case 'send_bulk': {
        // Send digest to multiple users
        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: 'userIds array is required' },
            { status: 400 }
          );
        }

        const result = await sendBulkDigest(userIds);
        return NextResponse.json(result);
      }

      case 'send_scheduled': {
        // Send to all users scheduled for a specific day
        const targetDay = day || getDayOfWeek();

        if (!['monday', 'friday', 'sunday'].includes(targetDay)) {
          return NextResponse.json(
            { error: 'Invalid day. Must be monday, friday, or sunday' },
            { status: 400 }
          );
        }

        const users = await getUsersForDigestDay(targetDay as 'monday' | 'friday' | 'sunday');

        if (users.length === 0) {
          return NextResponse.json({
            message: `No users scheduled for ${targetDay}`,
            sent: 0,
            failed: 0,
          });
        }

        const result = await sendBulkDigest(users);
        return NextResponse.json({
          ...result,
          day: targetDay,
          totalUsers: users.length,
        });
      }

      case 'send_all': {
        // Send to all users with weekly digest enabled (admin only, for testing)
        const { data: allPrefs } = await supabase
          .from('email_preferences')
          .select('user_id')
          .eq('weekly_digest', true)
          .eq('email_verified', true);

        const allUserIds = allPrefs?.map(p => p.user_id) || [];

        if (allUserIds.length === 0) {
          return NextResponse.json({
            message: 'No users with digest enabled',
            sent: 0,
            failed: 0,
          });
        }

        const result = await sendBulkDigest(allUserIds);
        return NextResponse.json({
          ...result,
          totalUsers: allUserIds.length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use send_single, send_bulk, send_scheduled, or send_all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Digest API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get current day of week
 */
function getDayOfWeek(): 'monday' | 'friday' | 'sunday' {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];

  // Map to valid digest days
  if (today === 'monday') return 'monday';
  if (today === 'friday') return 'friday';
  if (today === 'sunday') return 'sunday';

  // Default to the closest day (for testing)
  return 'sunday';
}
