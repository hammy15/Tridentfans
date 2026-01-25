import { NextRequest, NextResponse } from 'next/server';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushPreferences,
  updatePushPreferences,
  hasActivePushSubscription,
  getVapidPublicKey,
} from '@/lib/push-notifications';

// GET - Get push notification status and preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Return VAPID public key for client
    if (action === 'vapid-key') {
      const publicKey = getVapidPublicKey();
      if (!publicKey) {
        return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
      }
      return NextResponse.json({ publicKey });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get subscription status and preferences
    const [isSubscribed, preferences] = await Promise.all([
      hasActivePushSubscription(userId),
      getPushPreferences(userId),
    ]);

    return NextResponse.json({
      isSubscribed,
      preferences: preferences || {
        user_id: userId,
        game_reminders: true,
        prediction_closing: true,
        challenge_updates: true,
        follower_activity: false,
        achievements: true,
        weekly_digest: false,
      },
    });
  } catch (error) {
    console.error('Push GET error:', error);
    return NextResponse.json({ error: 'Failed to get push status' }, { status: 500 });
  }
}

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Valid subscription object is required' }, { status: 400 });
    }

    const result = await subscribeToPush(userId, {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: result.subscriptionId,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    console.error('Push POST error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, endpoint } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = await unsubscribeFromPush(userId, endpoint);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('Push DELETE error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'preferences object is required' }, { status: 400 });
    }

    // Validate preference keys
    const validKeys = [
      'game_reminders',
      'prediction_closing',
      'challenge_updates',
      'follower_activity',
      'achievements',
      'weekly_digest',
    ];

    const filteredPreferences: Record<string, boolean> = {};
    for (const key of validKeys) {
      if (typeof preferences[key] === 'boolean') {
        filteredPreferences[key] = preferences[key];
      }
    }

    const result = await updatePushPreferences(userId, filteredPreferences);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return updated preferences
    const updatedPreferences = await getPushPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Push PUT error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
