import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendPushNotification,
  sendBulkNotification,
  sendBroadcastNotification,
  NotificationTemplates,
} from '@/lib/push-notifications';
import type { PushNotificationPayload, PushNotificationPreferences } from '@/types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify admin or system access
async function verifyAccess(
  request: NextRequest
): Promise<{ authorized: boolean; userId?: string; isAdmin?: boolean }> {
  const authHeader = request.headers.get('authorization');
  const systemKey = request.headers.get('x-system-key');

  // System-level access via secret key
  if (
    systemKey === process.env.CRON_SECRET ||
    systemKey === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { authorized: true, isAdmin: true };
  }

  // User-level access - verify admin role
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = getSupabase();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        return { authorized: true, userId: user.id, isAdmin: true };
      }
    }
  }

  return { authorized: false };
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const access = await verifyAccess(request);

    if (!access.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      userId,
      userIds,
      broadcast,
      payload,
      template,
      templateData,
      notificationType,
      scheduledFor,
    } = body;

    // Build notification payload
    let notificationPayload: PushNotificationPayload;

    if (template && templateData) {
      // Use predefined template
      const templateFn = NotificationTemplates[template as keyof typeof NotificationTemplates];
      if (!templateFn) {
        return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 });
      }

      // Call the template function with the data
      if (Array.isArray(templateData)) {
        notificationPayload = (templateFn as (...args: unknown[]) => PushNotificationPayload)(
          ...templateData
        );
      } else {
        notificationPayload = (templateFn as (data: unknown) => PushNotificationPayload)(
          templateData
        );
      }
    } else if (payload) {
      // Use custom payload
      if (!payload.title || !payload.body) {
        return NextResponse.json({ error: 'Payload must include title and body' }, { status: 400 });
      }
      notificationPayload = payload as PushNotificationPayload;
    } else {
      return NextResponse.json(
        { error: 'Either payload or template+templateData is required' },
        { status: 400 }
      );
    }

    // Handle scheduled notifications
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      if (scheduledTime <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }

      // Store in scheduled_notifications table for later processing
      const supabase = getSupabase();
      const { data: scheduled, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          type: type || 'custom',
          user_id: userId,
          user_ids: userIds,
          broadcast: broadcast || false,
          payload: notificationPayload,
          notification_type: notificationType,
          scheduled_for: scheduledFor,
          status: 'pending',
          created_by: access.userId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error scheduling notification:', error);
        return NextResponse.json({ error: 'Failed to schedule notification' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduledId: scheduled.id,
        scheduledFor,
        message: `Notification scheduled for ${scheduledTime.toISOString()}`,
      });
    }

    // Send immediately
    let result;

    if (broadcast) {
      // Send to all subscribers
      result = await sendBroadcastNotification(notificationPayload);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to multiple users
      result = await sendBulkNotification(
        userIds,
        notificationPayload,
        notificationType as keyof Omit<PushNotificationPreferences, 'user_id'> | undefined
      );
    } else if (userId) {
      // Send to single user
      result = await sendPushNotification(
        userId,
        notificationPayload,
        notificationType as keyof Omit<PushNotificationPreferences, 'user_id'> | undefined
      );
    } else {
      return NextResponse.json(
        { error: 'Must specify userId, userIds, or broadcast: true' },
        { status: 400 }
      );
    }

    // Log the notification
    const supabase = getSupabase();
    const sentCount = 'totalSent' in result ? result.totalSent : result.sent;
    const failedCount = 'totalFailed' in result ? result.totalFailed : result.failed;
    await supabase.from('notification_logs').insert({
      type: type || 'custom',
      target_type: broadcast ? 'broadcast' : userIds ? 'bulk' : 'single',
      target_count: broadcast ? sentCount : userIds?.length || 1,
      sent_count: sentCount,
      failed_count: failedCount,
      payload: notificationPayload,
      created_by: access.userId,
    });

    return NextResponse.json({
      success: true,
      sent: 'totalSent' in result ? result.totalSent : result.sent,
      failed: 'totalFailed' in result ? result.totalFailed : result.failed,
      message: broadcast
        ? 'Broadcast notification sent'
        : userIds
          ? `Bulk notification sent to ${userIds.length} users`
          : 'Notification sent',
    });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

// GET - Get notification stats and scheduled notifications
export async function GET(request: NextRequest) {
  try {
    const access = await verifyAccess(request);

    if (!access.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = getSupabase();

    if (action === 'stats') {
      // Get notification statistics
      const [
        { count: totalSubscribers },
        { count: activeSubscriptions },
        { data: recentLogs },
        { data: scheduledNotifications },
      ] = await Promise.all([
        supabase.from('push_subscriptions').select('user_id', { count: 'exact', head: true }),
        supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('notification_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('scheduled_notifications')
          .select('*')
          .eq('status', 'pending')
          .order('scheduled_for', { ascending: true }),
      ]);

      // Get unique subscriber count
      const { data: uniqueUsers } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('is_active', true);

      const uniqueSubscriberCount = new Set(
        uniqueUsers?.map((u: { user_id: string }) => u.user_id) || []
      ).size;

      return NextResponse.json({
        stats: {
          totalSubscribers: totalSubscribers || 0,
          activeSubscriptions: activeSubscriptions || 0,
          uniqueSubscribers: uniqueSubscriberCount,
        },
        recentLogs: recentLogs || [],
        scheduledNotifications: scheduledNotifications || [],
      });
    }

    if (action === 'scheduled') {
      // Get scheduled notifications
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      return NextResponse.json({ scheduled: data || [] });
    }

    return NextResponse.json({
      availableActions: ['stats', 'scheduled'],
      availableTemplates: Object.keys(NotificationTemplates),
    });
  } catch (error) {
    console.error('Push send GET error:', error);
    return NextResponse.json({ error: 'Failed to get notification data' }, { status: 500 });
  }
}

// DELETE - Cancel scheduled notification
export async function DELETE(request: NextRequest) {
  try {
    const access = await verifyAccess(request);

    if (!access.authorized) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { scheduledId } = body;

    if (!scheduledId) {
      return NextResponse.json({ error: 'scheduledId is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('id', scheduledId)
      .eq('status', 'pending');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Scheduled notification cancelled',
    });
  } catch (error) {
    console.error('Push send DELETE error:', error);
    return NextResponse.json({ error: 'Failed to cancel notification' }, { status: 500 });
  }
}
