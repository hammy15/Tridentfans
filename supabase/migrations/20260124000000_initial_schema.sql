-- TridentFans Database Schema
-- Seattle Mariners Fan Community Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & PROFILES
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'))
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- BOT CONFIGURATIONS
-- ============================================

CREATE TABLE bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT UNIQUE NOT NULL CHECK (bot_id IN ('moose', 'captain_hammy', 'spartan')),
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  traits JSONB NOT NULL DEFAULT '{
    "humor": 5,
    "edginess": 5,
    "formality": 5,
    "debate_style": "collaborative",
    "confidence": 5
  }',
  knowledge_focus TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- RLS for bot_configurations
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot configs are viewable by everyone" ON bot_configurations
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update bot configs" ON bot_configurations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- BOT CONVERSATIONS
-- ============================================

CREATE TABLE bot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bot_id TEXT NOT NULL CHECK (bot_id IN ('moose', 'captain_hammy', 'spartan')),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- RLS for bot_conversations
ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON bot_conversations
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create conversations" ON bot_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own conversations" ON bot_conversations
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- FORUM CATEGORIES
-- ============================================

CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Insert default categories
INSERT INTO forum_categories (name, slug, description, icon, sort_order) VALUES
  ('Game Day', 'game-day', 'Live game discussions and threads', '🏟️', 1),
  ('General Discussion', 'general', 'General Mariners talk', '💬', 2),
  ('Trade Talk', 'trade-talk', 'Trade rumors and analysis', '🔄', 3),
  ('Roster Analysis', 'roster', 'Player performance and roster moves', '📊', 4),
  ('Stadium & Tickets', 'stadium', 'T-Mobile Park and game attendance', '🎟️', 5),
  ('Off Topic', 'off-topic', 'Non-baseball discussions', '🎮', 6);

-- RLS for forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON forum_categories
  FOR SELECT USING (true);

-- ============================================
-- FORUM POSTS
-- ============================================

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FORUM COMMENTS
-- ============================================

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for forum_comments
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON forum_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PREDICTION GAMES
-- ============================================

CREATE TABLE prediction_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date DATE NOT NULL,
  opponent TEXT NOT NULL,
  opponent_abbr TEXT NOT NULL,
  game_time TIME NOT NULL,
  is_home BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'final', 'postponed')),
  actual_result JSONB,
  mlb_game_id INTEGER,
  predictions_close_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for prediction_games
ALTER TABLE prediction_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" ON prediction_games
  FOR SELECT USING (true);

-- ============================================
-- USER PREDICTIONS
-- ============================================

CREATE TABLE user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES prediction_games(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  UNIQUE(user_id, game_id)
);

-- RLS for user_predictions
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are viewable by everyone" ON user_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can create own predictions" ON user_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions before game starts" ON user_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM prediction_games
      WHERE id = game_id AND predictions_close_at > NOW()
    )
  );

-- ============================================
-- PREDICTION LEADERBOARD
-- ============================================

CREATE TABLE prediction_leaderboard (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  predictions_made INTEGER DEFAULT 0,
  rank INTEGER,
  season INTEGER NOT NULL,
  PRIMARY KEY (user_id, season)
);

-- RLS for leaderboard
ALTER TABLE prediction_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is viewable by everyone" ON prediction_leaderboard
  FOR SELECT USING (true);

-- ============================================
-- MARINERS ROSTER CACHE
-- ============================================

CREATE TABLE mariners_roster (
  player_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  number INTEGER,
  stats JSONB DEFAULT '{}',
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for roster
ALTER TABLE mariners_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roster is viewable by everyone" ON mariners_roster
  FOR SELECT USING (true);

-- ============================================
-- MARINERS SCHEDULE CACHE
-- ============================================

CREATE TABLE mariners_schedule (
  game_id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  time TIME,
  opponent TEXT NOT NULL,
  opponent_abbr TEXT NOT NULL,
  is_home BOOLEAN DEFAULT true,
  result JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for schedule
ALTER TABLE mariners_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedule is viewable by everyone" ON mariners_schedule
  FOR SELECT USING (true);

-- ============================================
-- MARINERS HISTORY
-- ============================================

CREATE TABLE mariners_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for history
ALTER TABLE mariners_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "History is viewable by everyone" ON mariners_history
  FOR SELECT USING (true);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX idx_user_predictions_user ON user_predictions(user_id);
CREATE INDEX idx_user_predictions_game ON user_predictions(game_id);
CREATE INDEX idx_prediction_games_date ON prediction_games(game_date);
CREATE INDEX idx_leaderboard_season_rank ON prediction_leaderboard(season, rank);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update leaderboard ranks
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
  WITH ranked AS (
    SELECT
      user_id,
      season,
      ROW_NUMBER() OVER (PARTITION BY season ORDER BY total_points DESC) as new_rank
    FROM prediction_leaderboard
  )
  UPDATE prediction_leaderboard pl
  SET rank = r.new_rank
  FROM ranked r
  WHERE pl.user_id = r.user_id AND pl.season = r.season;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ranks
AFTER INSERT OR UPDATE OF total_points ON prediction_leaderboard
FOR EACH STATEMENT
EXECUTE FUNCTION update_leaderboard_ranks();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_updated
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bot_config_updated
BEFORE UPDATE ON bot_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
