// Social sharing utilities for TridentFans

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  hashtags?: string[];
}

const BASE_URL = 'https://tridentfans.com';
const DEFAULT_HASHTAGS = ['Mariners', 'SeaUsRise', 'TridentFans'];

/**
 * Build a Twitter/X share URL
 */
export function buildTwitterShareUrl(data: ShareData): string {
  const url = new URL('https://twitter.com/intent/tweet');
  const text = `${data.text}\n\n${data.url || BASE_URL}`;
  url.searchParams.set('text', text);

  const hashtags = data.hashtags || DEFAULT_HASHTAGS;
  if (hashtags.length > 0) {
    url.searchParams.set('hashtags', hashtags.join(','));
  }

  return url.toString();
}

/**
 * Build a Facebook share URL
 */
export function buildFacebookShareUrl(data: ShareData): string {
  const url = new URL('https://www.facebook.com/sharer/sharer.php');
  url.searchParams.set('u', data.url || BASE_URL);
  url.searchParams.set('quote', data.text);
  return url.toString();
}

/**
 * Build a Reddit share URL
 */
export function buildRedditShareUrl(data: ShareData): string {
  const url = new URL('https://www.reddit.com/submit');
  url.searchParams.set('url', data.url || BASE_URL);
  url.searchParams.set('title', data.title);
  return url.toString();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Use native share API if available
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url || BASE_URL,
    });
    return true;
  } catch (error) {
    // User cancelled or error
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Check if native share is supported
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Generate share data for a prediction
 */
export function getPredictionShareData(prediction: {
  winner: string;
  marinersRuns: number;
  opponentRuns: number;
  opponent: string;
  gameDate: string;
}): ShareData {
  const winnerText = prediction.winner === 'mariners' ? 'Mariners' : prediction.opponent;
  const score = `${prediction.marinersRuns}-${prediction.opponentRuns}`;

  return {
    title: 'My Mariners Prediction on TridentFans',
    text: `My prediction for the Mariners vs ${prediction.opponent} (${prediction.gameDate}): ${winnerText} win, ${score}! Make your pick too!`,
    url: `${BASE_URL}/predictions`,
    hashtags: ['Mariners', 'SeaUsRise', 'TridentFans', 'MLB'],
  };
}

/**
 * Generate share data for a forum post
 */
export function getForumPostShareData(post: {
  id: string;
  title: string;
  content: string;
}): ShareData {
  const truncatedContent =
    post.content.length > 100 ? post.content.substring(0, 97) + '...' : post.content;

  return {
    title: post.title,
    text: `${post.title}\n\n${truncatedContent}`,
    url: `${BASE_URL}/forum/post/${post.id}`,
    hashtags: ['Mariners', 'TridentFans'],
  };
}

/**
 * Generate share data for leaderboard position
 */
export function getLeaderboardShareData(data: {
  rank: number;
  points: number;
  accuracy: number;
}): ShareData {
  return {
    title: 'My TridentFans Leaderboard Ranking',
    text: `I'm ranked #${data.rank} on TridentFans predictions with ${data.points} points and ${data.accuracy}% accuracy! Think you can beat me?`,
    url: `${BASE_URL}/predictions`,
    hashtags: ['Mariners', 'SeaUsRise', 'TridentFans'],
  };
}

/**
 * Open share URL in a popup window
 */
export function openShareWindow(url: string, name = 'share'): void {
  const width = 600;
  const height = 400;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  window.open(
    url,
    name,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );
}
