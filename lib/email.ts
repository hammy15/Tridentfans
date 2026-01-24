import { Resend } from 'resend';

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
