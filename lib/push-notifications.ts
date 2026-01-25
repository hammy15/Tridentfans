import webpush, { PushSubscription as WebPushSubscription, SendResult } from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type {
  PushSubscription,
  PushNotificationPayload,
  PushNotificationPreferences,
} from '@/types';

// Initialize VAPID details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@tridentfans.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Get Supabase client with service role for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Default notification preferences
export const DEFAULT_PUSH_PREFERENCES: Omit<PushNotificationPreferences, 'user_id'> = {
  game_reminders: true,
  prediction_closing: true,
  challenge_updates: true,
  follower_activity: false,
  achievements: true,
  weekly_digest: false,
};

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPush(
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
  const supabase = getSupabase();

  try {
    // Check if subscription already exists for this endpoint
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Reactivate if exists
      await supabase.from('push_subscriptions').update({ is_active: true }).eq('id', existing.id);

      return { success: true, subscriptionId: existing.id };
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Ensure user has notification preferences
    const { data: prefs } = await supabase
      .from('push_notification_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!prefs) {
      await supabase.from('push_notification_preferences').insert({
        user_id: userId,
        ...DEFAULT_PUSH_PREFERENCES,
      });
    }

    return { success: true, subscriptionId: data.id };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: 'Failed to save subscription' };
  }
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeFromPush(
  userId: string,
  endpoint?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  try {
    let query = supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { error } = await query;

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return { success: false, error: 'Failed to unsubscribe' };
  }
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
  notificationType?: keyof Omit<PushNotificationPreferences, 'user_id'>
): Promise<{ success: boolean; sent: number; failed: number; errors?: string[] }> {
  const supabase = getSupabase();
  const errors: string[] = [];

  try {
    // Check user preferences if notification type is specified
    if (notificationType) {
      const { data: prefs } = await supabase
        .from('push_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefs && !prefs[notificationType]) {
        return { success: true, sent: 0, failed: 0 }; // User opted out
      }
    }

    // Get active subscriptions for user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/badge-72.png',
    });

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub: PushSubscription) => {
      const pushSubscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys,
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        sent++;
      } catch (err: unknown) {
        failed++;
        const error = err as { statusCode?: number; message?: string };

        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
          errors.push(`Subscription expired for ${sub.id}`);
        } else {
          errors.push(`Failed to send to ${sub.id}: ${error.message || 'Unknown error'}`);
        }
      }
    });

    await Promise.all(sendPromises);

    return { success: true, sent, failed, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, sent: 0, failed: 1, errors: ['Failed to send notifications'] };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  payload: PushNotificationPayload,
  notificationType?: keyof Omit<PushNotificationPreferences, 'user_id'>
): Promise<{
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Record<string, SendResult | { error: string }>;
}> {
  const results: Record<string, SendResult | { error: string }> = {};
  let totalSent = 0;
  let totalFailed = 0;

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async userId => {
      const result = await sendPushNotification(userId, payload, notificationType);
      results[userId] = result as unknown as SendResult | { error: string };
      totalSent += result.sent;
      totalFailed += result.failed;
    });

    await Promise.all(batchPromises);
  }

  return { success: true, totalSent, totalFailed, results };
}

/**
 * Send notification to all active subscribers
 */
export async function sendBroadcastNotification(
  payload: PushNotificationPayload
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  const supabase = getSupabase();

  try {
    // Get all unique user IDs with active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, totalSent: 0, totalFailed: 0 };
    }

    const uniqueUserIds = [...new Set(subscriptions.map((s: { user_id: string }) => s.user_id))];

    return await sendBulkNotification(uniqueUserIds, payload);
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    return { success: false, totalSent: 0, totalFailed: 0 };
  }
}

/**
 * Get user's push notification preferences
 */
export async function getPushPreferences(
  userId: string
): Promise<PushNotificationPreferences | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('push_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return data as PushNotificationPreferences;
}

/**
 * Update user's push notification preferences
 */
export async function updatePushPreferences(
  userId: string,
  preferences: Partial<Omit<PushNotificationPreferences, 'user_id'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  try {
    const { error } = await supabase.from('push_notification_preferences').upsert({
      user_id: userId,
      ...preferences,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating push preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

/**
 * Check if user has any active push subscriptions
 */
export async function hasActivePushSubscription(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  return (count || 0) > 0;
}

/**
 * Get VAPID public key for client-side
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Generate VAPID keys (run once to get keys for .env)
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}

// Notification templates for common use cases
export const NotificationTemplates = {
  gameReminder: (opponent: string, time: string) => ({
    title: 'Game Starting Soon!',
    body: `Mariners vs ${opponent} starts in 30 minutes. Make your predictions now!`,
    tag: 'game-reminder',
    data: { type: 'game_reminder', time },
    actions: [
      { action: 'predict', title: 'Make Prediction' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  predictionClosing: (opponent: string, minutesLeft: number) => ({
    title: 'Predictions Closing Soon!',
    body: `Only ${minutesLeft} minutes left to predict Mariners vs ${opponent}!`,
    tag: 'prediction-closing',
    data: { type: 'prediction_closing' },
    actions: [{ action: 'predict', title: 'Predict Now' }],
  }),

  challengeReceived: (challengerName: string, gameName: string) => ({
    title: 'New Challenge!',
    body: `${challengerName} has challenged you for ${gameName}`,
    tag: 'challenge',
    data: { type: 'challenge_received' },
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'decline', title: 'Decline' },
    ],
  }),

  challengeAccepted: (opponentName: string, gameName: string) => ({
    title: 'Challenge Accepted!',
    body: `${opponentName} accepted your challenge for ${gameName}`,
    tag: 'challenge',
    data: { type: 'challenge_accepted' },
  }),

  badgeUnlocked: (badgeName: string) => ({
    title: 'Badge Unlocked!',
    body: `You earned the "${badgeName}" badge!`,
    tag: 'achievement',
    data: { type: 'badge_earned' },
  }),

  followerPrediction: (followerName: string, gameName: string) => ({
    title: 'Prediction Update',
    body: `${followerName} just made a prediction for ${gameName}`,
    tag: 'social',
    data: { type: 'follower_activity' },
  }),

  weeklyDigest: (summary: string) => ({
    title: 'Your Weekly TridentFans Digest',
    body: summary,
    tag: 'digest',
    data: { type: 'weekly_digest' },
  }),

  systemAnnouncement: (title: string, message: string) => ({
    title,
    body: message,
    tag: 'system',
    data: { type: 'system' },
  }),
};
