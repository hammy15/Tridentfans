import { createClient } from '@supabase/supabase-js';
import type {
  Profile,
  BotConfiguration,
  BotConversation,
  ForumCategory,
  ForumPost,
  ForumComment,
  PredictionGame,
  UserPrediction,
  LeaderboardEntry,
  MarinersPlayer,
  ScheduleGame,
  Poll,
  PollOption,
  PollVote,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      bot_configurations: {
        Row: BotConfiguration;
        Insert: Omit<BotConfiguration, 'id' | 'updated_at'>;
        Update: Partial<Omit<BotConfiguration, 'id'>>;
      };
      bot_conversations: {
        Row: BotConversation;
        Insert: Omit<BotConversation, 'id' | 'created_at'>;
        Update: Partial<Omit<BotConversation, 'id' | 'created_at'>>;
      };
      forum_categories: {
        Row: ForumCategory;
        Insert: Omit<ForumCategory, 'id'>;
        Update: Partial<Omit<ForumCategory, 'id'>>;
      };
      forum_posts: {
        Row: ForumPost;
        Insert: Omit<ForumPost, 'id' | 'upvotes' | 'created_at'>;
        Update: Partial<Omit<ForumPost, 'id' | 'created_at'>>;
      };
      forum_comments: {
        Row: ForumComment;
        Insert: Omit<ForumComment, 'id' | 'upvotes' | 'created_at'>;
        Update: Partial<Omit<ForumComment, 'id' | 'created_at'>>;
      };
      prediction_games: {
        Row: PredictionGame;
        Insert: Omit<PredictionGame, 'id'>;
        Update: Partial<Omit<PredictionGame, 'id'>>;
      };
      user_predictions: {
        Row: UserPrediction;
        Insert: Omit<UserPrediction, 'id' | 'submitted_at' | 'score'>;
        Update: Partial<Omit<UserPrediction, 'id' | 'submitted_at'>>;
      };
      prediction_leaderboard: {
        Row: LeaderboardEntry;
        Insert: Omit<LeaderboardEntry, 'rank'>;
        Update: Partial<Omit<LeaderboardEntry, 'user_id' | 'season'>>;
      };
      mariners_roster: {
        Row: MarinersPlayer;
        Insert: MarinersPlayer;
        Update: Partial<MarinersPlayer>;
      };
      mariners_schedule: {
        Row: ScheduleGame & { updated_at: string };
        Insert: ScheduleGame;
        Update: Partial<ScheduleGame>;
      };
      polls: {
        Row: Omit<Poll, 'options' | 'total_votes'>;
        Insert: Omit<Poll, 'id' | 'options' | 'total_votes' | 'created_at'>;
        Update: Partial<Omit<Poll, 'id' | 'options' | 'total_votes' | 'created_at'>>;
      };
      poll_options: {
        Row: PollOption;
        Insert: Omit<PollOption, 'id'>;
        Update: Partial<Omit<PollOption, 'id' | 'poll_id'>>;
      };
      poll_votes: {
        Row: PollVote;
        Insert: Omit<PollVote, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};

// Helper functions for common database operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return { data, error };
}

export async function getBotConfigurations() {
  const { data, error } = await supabase
    .from('bot_configurations')
    .select('*')
    .eq('is_active', true);
  return { data, error };
}

export async function getBotConfiguration(botId: string) {
  const { data, error } = await supabase
    .from('bot_configurations')
    .select('*')
    .eq('bot_id', botId)
    .single();
  return { data, error };
}

export async function updateBotConfiguration(id: string, updates: Partial<BotConfiguration>) {
  const { data, error } = await supabase
    .from('bot_configurations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function getForumCategories() {
  const { data, error } = await supabase.from('forum_categories').select('*').order('sort_order');
  return { data, error };
}

export async function getForumPosts(categoryId?: string, limit = 20) {
  let query = supabase
    .from('forum_posts')
    .select(
      `
      *,
      author:profiles(*),
      category:forum_categories(*)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getForumPost(postId: string) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(
      `
      *,
      author:profiles(*),
      category:forum_categories(*),
      comments:forum_comments(*, author:profiles(*))
    `
    )
    .eq('id', postId)
    .single();
  return { data, error };
}

export async function createForumPost(post: Omit<ForumPost, 'id' | 'upvotes' | 'created_at'>) {
  // Moderate user-created content (skip Mark's system posts)
  if (post.user_id) {
    const { moderateContent } = await import('@/lib/moderation');
    const titleCheck = moderateContent(post.title);
    if (!titleCheck.clean) {
      return { data: null, error: { message: titleCheck.reason } };
    }
    const contentCheck = moderateContent(post.content);
    if (!contentCheck.clean) {
      return { data: null, error: { message: contentCheck.reason } };
    }
  }
  const { data, error } = await supabase.from('forum_posts').insert(post).select().single();
  return { data, error };
}

export async function getUpcomingGames(limit = 5) {
  const { data, error } = await supabase
    .from('prediction_games')
    .select('*')
    .gte('game_date', new Date().toISOString().split('T')[0])
    .order('game_date')
    .limit(limit);
  return { data, error };
}

export async function getUserPredictions(userId: string, gameId?: string) {
  let query = supabase
    .from('user_predictions')
    .select('*, game:prediction_games(*)')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (gameId) {
    query = query.eq('game_id', gameId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function submitPrediction(
  prediction: Omit<UserPrediction, 'id' | 'submitted_at' | 'score'>
) {
  const { data, error } = await supabase
    .from('user_predictions')
    .insert(prediction)
    .select()
    .single();
  return { data, error };
}

export async function getLeaderboard(
  season: number,
  period: 'daily' | 'weekly' | 'season' = 'season',
  limit = 10
) {
  const { data, error } = await supabase
    .from('prediction_leaderboard')
    .select('*, user:profiles(*)')
    .eq('season', season)
    .order('rank')
    .limit(limit);
  return { data, error };
}

export async function getRoster() {
  const { data, error } = await supabase.from('mariners_roster').select('*').order('number');
  return { data, error };
}

export async function getSchedule(startDate?: string, endDate?: string, limit = 10) {
  let query = supabase.from('mariners_schedule').select('*').limit(limit);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query.order('date');
  return { data, error };
}
