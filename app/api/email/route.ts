import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendEmail,
  welcomeEmail,
  gameReminderEmail,
  predictionResultsEmail,
  weeklyDigestEmail,
  mentionNotificationEmail,
} from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, data } = body;

    if (!type || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user profile and email preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, display_name, email, notification_preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || profile.email;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Check notification preferences
    const prefs = profile.notification_preferences || {
      email_game_reminders: true,
      email_prediction_results: true,
      email_weekly_digest: true,
      email_mentions: true,
    };

    const username = profile.display_name || profile.username || 'Fan';
    let emailOptions;

    switch (type) {
      case 'welcome':
        emailOptions = welcomeEmail(username);
        break;

      case 'game_reminder':
        if (!prefs.email_game_reminders) {
          return NextResponse.json({ message: 'Notification disabled by user' }, { status: 200 });
        }
        if (!data?.opponent || !data?.gameTime) {
          return NextResponse.json({ error: 'Missing game data' }, { status: 400 });
        }
        emailOptions = gameReminderEmail(
          username,
          data.opponent,
          data.gameTime,
          data.isHome ?? true
        );
        break;

      case 'prediction_results':
        if (!prefs.email_prediction_results) {
          return NextResponse.json({ message: 'Notification disabled by user' }, { status: 200 });
        }
        if (!data?.opponent || data?.marinersScore === undefined) {
          return NextResponse.json({ error: 'Missing prediction data' }, { status: 400 });
        }
        emailOptions = predictionResultsEmail(
          username,
          data.opponent,
          data.marinersScore,
          data.opponentScore,
          data.pointsEarned ?? 0,
          data.isCorrect ?? false
        );
        break;

      case 'weekly_digest':
        if (!prefs.email_weekly_digest) {
          return NextResponse.json({ message: 'Notification disabled by user' }, { status: 200 });
        }
        if (!data?.stats) {
          return NextResponse.json({ error: 'Missing digest stats' }, { status: 400 });
        }
        emailOptions = weeklyDigestEmail(username, data.stats);
        break;

      case 'mention':
        if (!prefs.email_mentions) {
          return NextResponse.json({ message: 'Notification disabled by user' }, { status: 200 });
        }
        if (!data?.mentionedBy || !data?.postTitle || !data?.postId) {
          return NextResponse.json({ error: 'Missing mention data' }, { status: 400 });
        }
        emailOptions = mentionNotificationEmail(
          username,
          data.mentionedBy,
          data.postTitle,
          data.postId,
          data.snippet || ''
        );
        break;

      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
    }

    // Send the email
    emailOptions.to = email;
    const result = await sendEmail(emailOptions);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Batch send game reminders to all users who have predictions
 * This can be called by a cron job
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // Verify cron secret for automated calls
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET && action !== 'test') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'test') {
    // Test email sending
    const testEmail = searchParams.get('email');
    if (!testEmail) {
      return NextResponse.json({ error: 'Email required for test' }, { status: 400 });
    }

    const emailOptions = welcomeEmail('Test User');
    emailOptions.to = testEmail;
    const result = await sendEmail(emailOptions);

    return NextResponse.json(result);
  }

  // Default: send game reminders for today's games
  try {
    // Fetch today's games
    const today = new Date().toISOString().split('T')[0];
    const { data: games } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('game_date', today)
      .eq('status', 'scheduled');

    if (!games || games.length === 0) {
      return NextResponse.json({ message: 'No games today' });
    }

    // Fetch users who have enabled game reminders
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, display_name, email, notification_preferences')
      .not('notification_preferences->email_game_reminders', 'is', false);

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to notify' });
    }

    let sent = 0;
    let failed = 0;

    for (const game of games) {
      for (const user of users) {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
        const email = authUser?.user?.email || user.email;

        if (!email) continue;

        const username = user.display_name || user.username || 'Fan';
        const emailOptions = gameReminderEmail(
          username,
          game.opponent,
          `${game.game_date} at ${game.game_time}`,
          game.is_home
        );
        emailOptions.to = email;

        const result = await sendEmail(emailOptions);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return NextResponse.json({ sent, failed, games: games.length });
  } catch (error) {
    console.error('[Email Cron] Error:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
