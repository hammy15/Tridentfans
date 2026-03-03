/**
 * Content moderation for TridentFans
 * Mark keeps things clean — no profanity, no spam, no bad actors
 */

// Common profanity and slurs (kept comprehensive but not exhaustive)
const PROFANITY_LIST = [
  // Major profanity
  'fuck', 'shit', 'ass', 'damn', 'hell', 'bitch', 'bastard', 'crap',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'piss',
  // Variations
  'f*ck', 'f**k', 'fck', 'fuk', 'fuq', 'sh*t', 'sh1t', 'sht',
  'a$$', 'a**', 'b*tch', 'b1tch', 'stfu', 'gtfo', 'lmfao',
  // Slurs (abbreviated for sensitivity)
  'retard', 'retarded', 'faggot', 'fag', 'dyke', 'tranny',
  'nigger', 'nigga', 'spic', 'chink', 'kike', 'wetback',
  // Drug references
  'meth', 'cocaine', 'heroin',
];

// Spam patterns
const SPAM_PATTERNS = [
  /\b(buy|sell|discount|promo|coupon|deal)\b.*\b(now|today|click|visit|link)\b/i,
  /\b(free|win|winner|prize|lottery|jackpot)\b.*\b(claim|click|visit)\b/i,
  /(https?:\/\/\S+){3,}/i, // 3+ URLs in one message
  /\b(telegram|whatsapp|signal)\b.*\b(group|channel|join)\b/i,
  /\b(crypto|bitcoin|eth|nft|token)\b.*\b(invest|buy|profit|earn)\b/i,
  /\b(onlyfans|cam|webcam|adult)\b/i,
  /(.)\1{5,}/i, // Repeated characters (spammy)
  /\b(dm me|message me|contact me)\b.*\b(deal|offer|price)\b/i,
];

// Advertising patterns
const AD_PATTERNS = [
  /\b(check out my|visit my|follow my|subscribe to)\b/i,
  /\b(use code|promo code|discount code|referral)\b/i,
  /\b(selling|for sale|buy from me)\b/i,
];

export interface ModerationResult {
  clean: boolean;
  reason?: string;
  type?: 'profanity' | 'spam' | 'advertising' | 'illegal';
  flaggedWords?: string[];
}

/**
 * Check content for profanity, spam, and other violations
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { clean: true };
  }

  const lowerText = text.toLowerCase();

  // Check profanity
  const foundProfanity: string[] = [];
  for (const word of PROFANITY_LIST) {
    // Match whole words or common letter substitutions
    const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    if (pattern.test(lowerText)) {
      foundProfanity.push(word);
    }
  }

  if (foundProfanity.length > 0) {
    return {
      clean: false,
      reason: 'Content contains inappropriate language. Please keep it clean.',
      type: 'profanity',
      flaggedWords: foundProfanity,
    };
  }

  // Check spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        clean: false,
        reason: 'This looks like spam. If this is a mistake, please rephrase.',
        type: 'spam',
      };
    }
  }

  // Check advertising
  for (const pattern of AD_PATTERNS) {
    if (pattern.test(text)) {
      return {
        clean: false,
        reason: 'Advertising is not allowed on TridentFans.',
        type: 'advertising',
      };
    }
  }

  return { clean: true };
}

/**
 * Clean profanity from bot-generated content (extra safety layer)
 */
export function cleanBotResponse(text: string): string {
  let cleaned = text;
  for (const word of PROFANITY_LIST) {
    const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    cleaned = cleaned.replace(pattern, '***');
  }
  return cleaned;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
