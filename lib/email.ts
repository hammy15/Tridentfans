import { Resend } from 'resend';
import { render } from '@react-email/components';
import { createClient } from '@supabase/supabase-js';
import { WeeklyDigestEmail } from './email-templates/weekly-digest';
import type { DigestContent, EmailPreferences, Profile } from '@/types';

const FROM_EMAIL = 'TridentFans <notifications@tridentfans.com>';

// Lazy initialize Resend to avoid build errors when API key is not present
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}
const SITE_URL = 'https://tridentfans.com';

/**
 * Email templates for TridentFans notifications
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  if (!client) {
    console.warn('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('[Email] Error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Common email wrapper with TridentFans branding
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TridentFans</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0C2C56 0%, #005C5C 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <span style="font-size: 32px;">🔱</span>
              <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">TridentFans</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Seattle Mariners Fan Community
              </p>
              <p style="margin: 0;">
                <a href="${SITE_URL}" style="color: #005C5C; text-decoration: none; font-size: 14px;">tridentfans.com</a>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
                <a href="${SITE_URL}/profile" style="color: #9ca3af;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Welcome email for new users
 */
export function welcomeEmail(username: string): EmailOptions {
  const content = `
    <h2 style="color: #0C2C56; margin: 0 0 20px 0; font-size: 22px;">Welcome to TridentFans, ${username}!</h2>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      You've joined the ultimate Seattle Mariners fan community. We're thrilled to have you!
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Here's what you can do:
    </p>

    <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 24px;">
      <li><strong>Make Predictions</strong> - Compete for the top of the leaderboard</li>
      <li><strong>Join Forums</strong> - Discuss with fellow Mariners fans</li>
      <li><strong>Chat with AI Bots</strong> - Meet Moose, our Mariners expert</li>
    </ul>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #005C5C; border-radius: 8px;">
          <a href="${SITE_URL}/predictions" style="display: inline-block; padding: 14px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Make Your First Prediction
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
      Go Mariners! 🔱
    </p>
  `;

  return {
    to: '',
    subject: 'Welcome to TridentFans! 🔱',
    html: emailWrapper(content),
    text: `Welcome to TridentFans, ${username}! You've joined the ultimate Seattle Mariners fan community. Make predictions, join forums, and chat with our AI bots. Visit ${SITE_URL} to get started!`,
  };
}

/**
 * Game reminder email
 */
export function gameReminderEmail(
  username: string,
  opponent: string,
  gameTime: string,
  isHome: boolean
): EmailOptions {
  const matchup = isHome ? `Mariners vs ${opponent}` : `Mariners @ ${opponent}`;

  const content = `
    <h2 style="color: #0C2C56; margin: 0 0 20px 0; font-size: 22px;">Game Day Reminder!</h2>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
      Hey ${username},
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      The Mariners are playing today! Don't forget to make your prediction before the game starts.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 12px; margin: 0 0 30px 0;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="color: #0C2C56; font-size: 20px; font-weight: bold; margin: 0 0 8px 0;">
            ${matchup}
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            ${gameTime}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #005C5C; border-radius: 8px;">
          <a href="${SITE_URL}/predictions" style="display: inline-block; padding: 14px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Make Your Prediction
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    to: '',
    subject: `Game Day! ${matchup} ⚾`,
    html: emailWrapper(content),
    text: `Game Day! ${matchup} at ${gameTime}. Make your prediction at ${SITE_URL}/predictions before the game starts!`,
  };
}

/**
 * Prediction results email
 */
export function predictionResultsEmail(
  username: string,
  opponent: string,
  marinersScore: number,
  opponentScore: number,
  pointsEarned: number,
  isCorrect: boolean
): EmailOptions {
  const result = marinersScore > opponentScore ? 'Won' : 'Lost';
  const resultEmoji = isCorrect ? '🎉' : '😔';

  const content = `
    <h2 style="color: #0C2C56; margin: 0 0 20px 0; font-size: 22px;">Your Prediction Results ${resultEmoji}</h2>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Hey ${username}, the game against ${opponent} is over!
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 12px; margin: 0 0 30px 0;">
      <tr>
        <td style="padding: 24px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">Final Score</p>
          <p style="color: #0C2C56; font-size: 28px; font-weight: bold; margin: 0;">
            Mariners ${marinersScore} - ${opponentScore} ${opponent}
          </p>
          <p style="color: ${marinersScore > opponentScore ? '#10b981' : '#ef4444'}; font-size: 16px; font-weight: 600; margin: 8px 0 0 0;">
            ${result}!
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${isCorrect ? '#ecfdf5' : '#fef2f2'}; border-radius: 12px; margin: 0 0 30px 0;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="color: ${isCorrect ? '#10b981' : '#ef4444'}; font-size: 24px; font-weight: bold; margin: 0;">
            ${isCorrect ? '+' : ''}${pointsEarned} points
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
            ${isCorrect ? 'Great prediction!' : 'Better luck next time!'}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #005C5C; border-radius: 8px;">
          <a href="${SITE_URL}/predictions" style="display: inline-block; padding: 14px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Leaderboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    to: '',
    subject: `Prediction Results: ${isCorrect ? 'You got it right!' : 'Game Over'} ${resultEmoji}`,
    html: emailWrapper(content),
    text: `Your prediction for Mariners vs ${opponent}: Final score ${marinersScore}-${opponentScore}. You earned ${pointsEarned} points! View the leaderboard at ${SITE_URL}/predictions`,
  };
}

/**
 * Weekly digest email
 */
export function weeklyDigestEmail(
  username: string,
  stats: {
    predictionsCount: number;
    correctPredictions: number;
    totalPoints: number;
    rank: number;
    upcomingGames: Array<{ opponent: string; date: string }>;
  }
): EmailOptions {
  const accuracy =
    stats.predictionsCount > 0
      ? Math.round((stats.correctPredictions / stats.predictionsCount) * 100)
      : 0;

  const upcomingGamesHtml = stats.upcomingGames
    .map(
      game => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #374151;">${game.opponent}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <span style="color: #6b7280;">${game.date}</span>
          </td>
        </tr>
      `
    )
    .join('');

  const content = `
    <h2 style="color: #0C2C56; margin: 0 0 20px 0; font-size: 22px;">Your Weekly Roundup</h2>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Hey ${username}, here's how you did this week!
    </p>

    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px 0;">
      <tr>
        <td style="background-color: #0C2C56; border-radius: 12px 0 0 12px; padding: 20px; text-align: center; width: 50%;">
          <p style="color: white; font-size: 28px; font-weight: bold; margin: 0;">${stats.totalPoints}</p>
          <p style="color: #C4CED4; font-size: 12px; margin: 4px 0 0 0;">POINTS</p>
        </td>
        <td style="background-color: #005C5C; border-radius: 0 12px 12px 0; padding: 20px; text-align: center; width: 50%;">
          <p style="color: white; font-size: 28px; font-weight: bold; margin: 0;">#${stats.rank}</p>
          <p style="color: #C4CED4; font-size: 12px; margin: 4px 0 0 0;">RANK</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 12px; margin: 0 0 30px 0;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="text-align: center; width: 50%;">
                <p style="color: #0C2C56; font-size: 24px; font-weight: bold; margin: 0;">${stats.predictionsCount}</p>
                <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Predictions</p>
              </td>
              <td style="text-align: center; width: 50%;">
                <p style="color: #0C2C56; font-size: 24px; font-weight: bold; margin: 0;">${accuracy}%</p>
                <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Accuracy</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      stats.upcomingGames.length > 0
        ? `
      <h3 style="color: #0C2C56; margin: 0 0 16px 0; font-size: 18px;">Upcoming Games</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 30px 0;">
        ${upcomingGamesHtml}
      </table>
    `
        : ''
    }

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #005C5C; border-radius: 8px;">
          <a href="${SITE_URL}/predictions" style="display: inline-block; padding: 14px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            Make Predictions
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    to: '',
    subject: `Your TridentFans Weekly Roundup 📊`,
    html: emailWrapper(content),
    text: `Your TridentFans Weekly Roundup: ${stats.predictionsCount} predictions, ${accuracy}% accuracy, ${stats.totalPoints} points, Rank #${stats.rank}. Visit ${SITE_URL} to keep competing!`,
  };
}

/**
 * Forum mention notification email
 */
export function mentionNotificationEmail(
  username: string,
  mentionedBy: string,
  postTitle: string,
  postId: string,
  snippet: string
): EmailOptions {
  const content = `
    <h2 style="color: #0C2C56; margin: 0 0 20px 0; font-size: 22px;">You were mentioned!</h2>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Hey ${username}, <strong>${mentionedBy}</strong> mentioned you in a forum post.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 12px; margin: 0 0 30px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #0C2C56; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
            ${postTitle}
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
            "${snippet}..."
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #005C5C; border-radius: 8px;">
          <a href="${SITE_URL}/forum/post/${postId}" style="display: inline-block; padding: 14px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Post
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    to: '',
    subject: `${mentionedBy} mentioned you in "${postTitle}"`,
    html: emailWrapper(content),
    text: `${mentionedBy} mentioned you in "${postTitle}": "${snippet}..." View the post at ${SITE_URL}/forum/post/${postId}`,
  };
}

// ============================================
// WEEKLY DIGEST SYSTEM
// ============================================

/**
 * Get Supabase client for server-side operations
 */
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Generate personalized digest content for a user
 */
export async function generateDigestContent(userId: string): Promise<DigestContent | null> {
  const supabase = getSupabaseClient();

  try {
    // Get date range for this week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Fetch user's predictions this week
    const { data: predictions } = await supabase
      .from('user_predictions')
      .select('*, game:prediction_games(*)')
      .eq('user_id', userId)
      .gte('submitted_at', weekAgoStr);

    const predictionsThisWeek = predictions?.length || 0;
    const correctPredictions =
      predictions?.filter(p => p.score !== null && p.score > 0).length || 0;
    const pointsEarnedThisWeek =
      predictions?.reduce((sum, p) => sum + (p.score || 0), 0) || 0;

    // Get current leaderboard position
    const currentSeason = new Date().getFullYear();
    const { data: leaderboardEntry } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .eq('user_id', userId)
      .eq('season', currentSeason)
      .single();

    const currentRank = leaderboardEntry?.rank || 999;
    const totalPoints = leaderboardEntry?.total_points || 0;

    // TODO: Get previous rank for comparison (would need historical data)
    const rankChange = 0;

    // Get hot forum topics (most commented this week)
    const { data: hotPosts } = await supabase
      .from('forum_posts')
      .select('id, title, user_id, author:profiles(username)')
      .gte('created_at', weekAgoStr)
      .order('upvotes', { ascending: false })
      .limit(5);

    // Get comment counts for posts
    const hotTopics = await Promise.all(
      (hotPosts || []).map(async post => {
        const { count } = await supabase
          .from('forum_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const authorData = post.author as unknown;
        const authorUsername = Array.isArray(authorData)
          ? (authorData[0] as { username?: string })?.username
          : (authorData as { username?: string } | null)?.username;

        return {
          id: post.id,
          title: post.title,
          commentCount: count || 0,
          author: authorUsername || 'Unknown',
        };
      })
    );

    // Get upcoming games (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data: upcomingGames } = await supabase
      .from('prediction_games')
      .select('*')
      .gte('game_date', todayStr)
      .lte('game_date', nextWeekStr)
      .eq('status', 'scheduled')
      .order('game_date')
      .limit(5);

    // Get "On This Day" moment
    const today = new Date();
    const { data: historicalMoment } = await supabase
      .from('historical_moments')
      .select('*')
      .eq('date_month', today.getMonth() + 1)
      .eq('date_day', today.getDate())
      .limit(1)
      .single();

    return {
      predictionsThisWeek,
      correctPredictions,
      accuracyThisWeek:
        predictionsThisWeek > 0
          ? Math.round((correctPredictions / predictionsThisWeek) * 100)
          : 0,
      pointsEarnedThisWeek,
      currentRank,
      rankChange,
      totalPoints,
      hotTopics: hotTopics.slice(0, 3),
      upcomingGames:
        upcomingGames?.map(game => ({
          id: game.id,
          opponent: game.opponent,
          gameDate: game.game_date,
          gameTime: game.game_time,
          isHome: game.is_home,
        })) || [],
      onThisDay: historicalMoment
        ? {
            year: historicalMoment.year,
            title: historicalMoment.title,
            description: historicalMoment.description,
          }
        : undefined,
    };
  } catch (error) {
    console.error('[Email] Failed to generate digest content:', error);
    return null;
  }
}

/**
 * Send weekly digest email to a single user
 */
export async function sendDigest(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  try {
    // Get user profile and email preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    // Get email preferences
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!emailPrefs?.weekly_digest) {
      return { success: false, error: 'User has disabled weekly digest' };
    }

    if (!emailPrefs.email_verified) {
      return { success: false, error: 'Email not verified' };
    }

    // Get user's email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    if (!email) {
      return { success: false, error: 'User email not found' };
    }

    // Generate digest content
    const content = await generateDigestContent(userId);

    if (!content) {
      return { success: false, error: 'Failed to generate digest content' };
    }

    // Render the email template
    const emailHtml = await render(
      WeeklyDigestEmail({
        user: {
          username: profile.username,
          display_name: profile.display_name,
        },
        content,
        unsubscribeToken: emailPrefs.unsubscribe_token,
        siteUrl: SITE_URL,
      })
    );

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: 'Your TridentFans Weekly Digest',
      html: emailHtml,
      text: `Your TridentFans Weekly Digest - ${content.predictionsThisWeek} predictions this week, ${content.accuracyThisWeek}% accuracy. View at ${SITE_URL}`,
    });

    if (result.success) {
      // Log the sent digest
      await supabase.from('digest_logs').insert({
        user_id: userId,
        email_type: 'weekly_digest',
        sent_at: new Date().toISOString(),
        metadata: { predictions: content.predictionsThisWeek, rank: content.currentRank },
      });
    }

    return result;
  } catch (error) {
    console.error('[Email] Failed to send digest:', error);
    return { success: false, error: 'Failed to send digest' };
  }
}

/**
 * Send weekly digest to multiple users (batch)
 */
export async function sendBulkDigest(
  userIds: string[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async userId => {
        const result = await sendDigest(userId);
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`${userId}: ${result.error}`);
          }
        }
      })
    );

    // Small delay between batches to respect rate limits
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get users who should receive digest on a specific day
 */
export async function getUsersForDigestDay(
  day: 'monday' | 'friday' | 'sunday'
): Promise<string[]> {
  const supabase = getSupabaseClient();

  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('user_id')
    .eq('weekly_digest', true)
    .eq('email_verified', true)
    .eq('digest_day', day);

  return prefs?.map(p => p.user_id) || [];
}

/**
 * Generate a unique unsubscribe token
 */
export function generateUnsubscribeToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create default email preferences for a new user
 */
export async function createDefaultEmailPreferences(
  userId: string
): Promise<EmailPreferences | null> {
  const supabase = getSupabaseClient();

  const defaults: Omit<EmailPreferences, 'created_at' | 'updated_at'> = {
    user_id: userId,
    weekly_digest: true,
    digest_day: 'sunday',
    include_predictions: true,
    include_leaderboard: true,
    include_forum: true,
    include_news: true,
    include_upcoming_games: true,
    email_verified: false,
    unsubscribe_token: generateUnsubscribeToken(),
  };

  const { data, error } = await supabase
    .from('email_preferences')
    .insert(defaults)
    .select()
    .single();

  if (error) {
    console.error('[Email] Failed to create default preferences:', error);
    return null;
  }

  return data;
}

/**
 * Get email statistics for admin dashboard
 */
export async function getEmailStats(): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  recentDigests: Array<{ date: string; sent: number; opened: number }>;
}> {
  const supabase = getSupabaseClient();

  // Get all digest logs
  const { data: logs } = await supabase
    .from('digest_logs')
    .select('*')
    .eq('email_type', 'weekly_digest')
    .order('sent_at', { ascending: false });

  const totalSent = logs?.length || 0;
  const totalOpened = logs?.filter(l => l.opened_at).length || 0;
  const totalClicked = logs?.filter(l => l.clicked_at).length || 0;

  // Group by date for chart
  const byDate = new Map<string, { sent: number; opened: number }>();
  logs?.forEach(log => {
    const date = log.sent_at.split('T')[0];
    const existing = byDate.get(date) || { sent: 0, opened: 0 };
    existing.sent++;
    if (log.opened_at) existing.opened++;
    byDate.set(date, existing);
  });

  const recentDigests = Array.from(byDate.entries())
    .slice(0, 7)
    .map(([date, stats]) => ({ date, ...stats }));

  return {
    totalSent,
    totalOpened,
    totalClicked,
    openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    recentDigests,
  };
}
