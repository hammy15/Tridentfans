// User & Profile Types
export interface NotificationPreferences {
  email_game_reminders: boolean;
  email_prediction_results: boolean;
  email_weekly_digest: boolean;
  email_mentions: boolean;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  role: 'user' | 'moderator' | 'admin';
  email?: string;
  notification_preferences?: NotificationPreferences;
  title?: string | null;
  follower_count?: number;
  following_count?: number;
  total_points?: number;
  prediction_accuracy?: number;
}

// Bot Types
export type BotId = 'moose' | 'captain_hammy' | 'spartan';

export interface BotTraits {
  humor: number; // 1-10
  edginess: number; // 1-10
  formality: number; // 1-10
  debate_style: 'collaborative' | 'argumentative' | 'socratic';
  confidence: number; // 1-10
}

export interface BotConfiguration {
  id: string;
  bot_id: BotId;
  display_name: string;
  avatar_emoji: string;
  color: string;
  system_prompt: string;
  traits: BotTraits;
  knowledge_focus: string[];
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface BotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BotConversation {
  id: string;
  user_id: string;
  bot_id: BotId;
  messages: BotMessage[];
  created_at: string;
  ended_at: string | null;
}

// Forum Types
export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface ForumPost {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  upvotes: number;
  created_at: string;
  // Joined fields
  author?: Profile;
  category?: ForumCategory;
  comment_count?: number;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  // Joined fields
  author?: Profile;
}

// Prediction Types
export type GameStatus = 'scheduled' | 'in_progress' | 'final' | 'postponed';

export interface GameResult {
  mariners_runs: number;
  opponent_runs: number;
  winning_pitcher?: string;
  save?: string;
  home_runs?: string[];
}

export interface PredictionGame {
  id: string;
  game_date: string;
  opponent: string;
  opponent_abbr: string;
  game_time: string;
  is_home: boolean;
  status: GameStatus;
  actual_result: GameResult | null;
  mlb_game_id?: number;
}

export interface UserPredictionData {
  winner: 'mariners' | 'opponent';
  mariners_runs: number;
  opponent_runs: number;
  mariners_hits?: number;
  mariners_home_runs?: number;
  total_strikeouts?: number;
  first_to_score?: 'mariners' | 'opponent';
}

export interface UserPrediction {
  id: string;
  user_id: string;
  game_id: string;
  predictions: UserPredictionData;
  submitted_at: string;
  score: number | null;
  // Joined
  game?: PredictionGame;
  user?: Profile;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  accuracy: number;
  rank: number;
  season: number;
  // Joined
  user?: Profile;
}

// MLB Data Types
export interface PlayerStats {
  games: number;
  at_bats?: number;
  runs?: number;
  hits?: number;
  home_runs?: number;
  rbi?: number;
  avg?: string;
  obp?: string;
  slg?: string;
  // Pitcher stats
  wins?: number;
  losses?: number;
  era?: string;
  innings_pitched?: number;
  strikeouts?: number;
  whip?: string;
}

export interface MarinersPlayer {
  player_id: number;
  name: string;
  position: string;
  number: number;
  stats: PlayerStats;
  image_url?: string;
  updated_at: string;
}

export interface ScheduleGame {
  game_id: number;
  date: string;
  time: string;
  opponent: string;
  opponent_abbr: string;
  is_home: boolean;
  result?: {
    mariners: number;
    opponent: number;
    win: boolean;
  };
}

export interface TeamStanding {
  team: string;
  wins: number;
  losses: number;
  pct: string;
  gb: string;
  streak: string;
  last_10: string;
}

// News Types
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  image_url?: string;
  published_at: string;
  category: 'news' | 'trade' | 'game' | 'analysis';
}

// Tournament Types
export type TournamentType = 'weekly' | 'monthly' | 'special';
export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  tournament_type: TournamentType;
  start_date: string;
  end_date: string;
  prize_description: string | null;
  status: TournamentStatus;
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  joined_at: string;
  final_score: number | null;
  final_rank: number | null;
  // Joined
  user?: Profile;
  tournament?: Tournament;
}

// Challenge Types
export type ChallengeStatus = 'pending' | 'active' | 'declined' | 'completed';
export type WagerType = 'points' | 'badges' | 'bragging_rights';

export interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  game_id: string;
  status: ChallengeStatus;
  wager_amount: number;
  wager_type: WagerType;
  message: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  winner_id: string | null;
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
  // Joined
  challenger?: Profile;
  opponent?: Profile;
  game?: PredictionGame;
}

// Notification Types
export type NotificationType =
  | 'badge_earned'
  | 'prediction_result'
  | 'mention'
  | 'follow'
  | 'comment_reply'
  | 'tournament_update'
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_result'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Follow Types
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  // Joined
  follower?: Profile;
  following?: Profile;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
