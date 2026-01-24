// User & Profile Types
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  role: 'user' | 'moderator' | 'admin';
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

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
