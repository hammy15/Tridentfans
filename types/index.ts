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
export type BotId = 'mark' | 'captain_hammy' | 'spartan';

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
  is_pinned?: boolean;
  is_game_thread?: boolean;
  is_mark_content?: boolean;
  mlb_game_id?: number;
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

// Push Notification Types
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: string;
  is_active: boolean;
}

export interface PushNotificationPreferences {
  user_id: string;
  game_reminders: boolean; // 30 min before game
  prediction_closing: boolean; // When predictions close
  challenge_updates: boolean; // Challenge received/accepted
  follower_activity: boolean; // Followed user predictions
  achievements: boolean; // Badges unlocked
  weekly_digest: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Historical Moments Types
export type HistoricalCategory = 'game' | 'trade' | 'milestone' | 'draft' | 'record' | 'other';

export interface HistoricalMoment {
  id: string;
  date_month: number; // 1-12
  date_day: number; // 1-31
  year: number;
  title: string;
  description: string;
  category: HistoricalCategory;
  player_names?: string[];
  image_url?: string;
  source_url?: string;
  is_featured: boolean;
  created_at: string;
}

// Prospect Types (Minor League Tracker)
export type ProspectLevel = 'AAA' | 'AA' | 'A+' | 'A' | 'Rookie' | 'DSL';
export type ProspectUpdateType = 'promotion' | 'stats' | 'injury' | 'trade' | 'signing';

export interface ProspectStats {
  avg?: number;
  hr?: number;
  rbi?: number;
  sb?: number;
  era?: number;
  wins?: number;
  strikeouts?: number;
  whip?: number;
}

export interface ScoutingGrades {
  hit?: number;
  power?: number;
  speed?: number;
  arm?: number;
  field?: number;
  overall?: number;
}

export interface Prospect {
  id: string;
  name: string;
  position: string;
  level: ProspectLevel;
  team_name: string;
  age: number;
  bats: 'L' | 'R' | 'S';
  throws: 'L' | 'R';
  stats: ProspectStats;
  ranking?: number;
  scouting_grades?: ScoutingGrades;
  eta?: string;
  notes?: string;
  photo_url?: string;
  is_featured: boolean;
  last_updated: string;
}

export interface ProspectUpdate {
  id: string;
  prospect_id: string;
  update_type: ProspectUpdateType;
  title: string;
  description: string;
  created_at: string;
}

// Poll Types
export type PollCategory = 'game' | 'trade' | 'roster' | 'general' | 'fun';

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  category: PollCategory;
  created_by: string;
  created_at: string;
  ends_at: string;
  is_active: boolean;
  is_featured: boolean;
  total_votes: number;
  allow_comments: boolean;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
  percentage?: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Email Preferences Types
export type DigestDay = 'monday' | 'friday' | 'sunday';

export interface EmailPreferences {
  user_id: string;
  weekly_digest: boolean;
  digest_day: DigestDay;
  include_predictions: boolean;
  include_leaderboard: boolean;
  include_forum: boolean;
  include_news: boolean;
  include_upcoming_games: boolean;
  email_verified: boolean;
  unsubscribe_token: string;
  created_at?: string;
  updated_at?: string;
}

export interface DigestLog {
  id: string;
  user_id: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  email_type: 'weekly_digest' | 'game_reminder' | 'prediction_result';
  metadata?: Record<string, unknown>;
}

export interface DigestStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

export interface DigestContent {
  // Prediction stats
  predictionsThisWeek: number;
  correctPredictions: number;
  accuracyThisWeek: number;
  pointsEarnedThisWeek: number;

  // Leaderboard
  currentRank: number;
  rankChange: number; // positive = moved up, negative = moved down
  totalPoints: number;

  // Forum
  hotTopics: Array<{
    id: string;
    title: string;
    commentCount: number;
    author: string;
  }>;

  // Upcoming games
  upcomingGames: Array<{
    id: string;
    opponent: string;
    gameDate: string;
    gameTime: string;
    isHome: boolean;
  }>;

  // On This Day
  onThisDay?: {
    year: number;
    title: string;
    description: string;
  };
}
