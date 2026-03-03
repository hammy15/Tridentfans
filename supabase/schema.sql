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

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- BOT CONFIGURATIONS
-- ============================================

CREATE TABLE bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT UNIQUE NOT NULL CHECK (bot_id IN ('mark', 'captain_hammy', 'spartan')),
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
  bot_id TEXT NOT NULL CHECK (bot_id IN ('mark', 'captain_hammy', 'spartan')),
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

-- ============================================
-- POLLS
-- ============================================

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('game', 'trade', 'roster', 'general', 'fun')),
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Indexes for polls
CREATE INDEX idx_polls_active ON polls(is_active, ends_at DESC);
CREATE INDEX idx_polls_featured ON polls(is_featured) WHERE is_featured = true;
CREATE INDEX idx_polls_category ON polls(category);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- RLS for polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by everyone" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Poll options are viewable by everyone" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll votes are viewable by everyone" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment poll option votes (atomic)
CREATE OR REPLACE FUNCTION increment_poll_option_votes(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for poll updates
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;

-- ============================================
-- PLAYER COMPARISON SYSTEM
-- ============================================

-- Featured comparisons (admin-curated quick picks)
CREATE TABLE featured_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id INTEGER NOT NULL,
  player1_name TEXT NOT NULL,
  player2_id INTEGER NOT NULL,
  player2_name TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparison analytics (track popular comparisons)
CREATE TABLE comparison_analytics (
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  count INTEGER DEFAULT 1,
  last_compared_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (player1_id, player2_id),
  CONSTRAINT ordered_players CHECK (player1_id < player2_id)
);

-- Player stats cache (to reduce MLB API calls)
CREATE TABLE player_stats_cache (
  player_id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player search cache
CREATE TABLE player_search_cache (
  query TEXT PRIMARY KEY,
  results JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for player comparison
CREATE INDEX idx_featured_comparisons_active ON featured_comparisons(is_active, sort_order);
CREATE INDEX idx_comparison_analytics_count ON comparison_analytics(count DESC);
CREATE INDEX idx_player_stats_cache_expires ON player_stats_cache(expires_at);
CREATE INDEX idx_player_search_cache_expires ON player_search_cache(expires_at);

-- RLS for player comparison tables
ALTER TABLE featured_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured comparisons are viewable by everyone" ON featured_comparisons
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify featured comparisons" ON featured_comparisons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Comparison analytics are viewable by everyone" ON comparison_analytics
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert/update comparison analytics" ON comparison_analytics
  FOR ALL USING (true);

CREATE POLICY "Player stats cache is viewable by everyone" ON player_stats_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert/update player stats cache" ON player_stats_cache
  FOR ALL USING (true);

CREATE POLICY "Player search cache is viewable by everyone" ON player_search_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert/update player search cache" ON player_search_cache
  FOR ALL USING (true);

-- Function to increment comparison count (upsert)
CREATE OR REPLACE FUNCTION increment_comparison_count(p_player1_id INTEGER, p_player2_id INTEGER)
RETURNS void AS $$
DECLARE
  v_id1 INTEGER;
  v_id2 INTEGER;
BEGIN
  -- Ensure consistent ordering (smaller ID first)
  IF p_player1_id < p_player2_id THEN
    v_id1 := p_player1_id;
    v_id2 := p_player2_id;
  ELSE
    v_id1 := p_player2_id;
    v_id2 := p_player1_id;
  END IF;

  INSERT INTO comparison_analytics (player1_id, player2_id, count, last_compared_at)
  VALUES (v_id1, v_id2, 1, NOW())
  ON CONFLICT (player1_id, player2_id)
  DO UPDATE SET
    count = comparison_analytics.count + 1,
    last_compared_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_player_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM player_stats_cache WHERE expires_at < NOW();
  DELETE FROM player_search_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HISTORICAL MOMENTS (On This Day Feature)
-- ============================================

CREATE TABLE historical_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_month INTEGER NOT NULL CHECK (date_month >= 1 AND date_month <= 12),
  date_day INTEGER NOT NULL CHECK (date_day >= 1 AND date_day <= 31),
  year INTEGER NOT NULL CHECK (year >= 1977),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('game', 'trade', 'milestone', 'draft', 'record', 'other')),
  player_names TEXT[] DEFAULT '{}',
  image_url TEXT,
  source_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_historical_moments_date ON historical_moments(date_month, date_day);
CREATE INDEX idx_historical_moments_category ON historical_moments(category);
CREATE INDEX idx_historical_moments_featured ON historical_moments(is_featured) WHERE is_featured = true;
CREATE INDEX idx_historical_moments_year ON historical_moments(year DESC);

-- RLS for historical_moments
ALTER TABLE historical_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historical moments are viewable by everyone" ON historical_moments
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert historical moments" ON historical_moments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR current_setting('request.headers', true)::json->>'x-admin-key' IS NOT NULL
  );

CREATE POLICY "Only admins can update historical moments" ON historical_moments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete historical moments" ON historical_moments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- EMAIL PREFERENCES & DIGEST SYSTEM
-- ============================================

CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  weekly_digest BOOLEAN DEFAULT true,
  digest_day TEXT DEFAULT 'sunday' CHECK (digest_day IN ('monday', 'friday', 'sunday')),
  include_predictions BOOLEAN DEFAULT true,
  include_leaderboard BOOLEAN DEFAULT true,
  include_forum BOOLEAN DEFAULT true,
  include_news BOOLEAN DEFAULT true,
  include_upcoming_games BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE digest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('weekly_digest', 'game_reminder', 'prediction_result')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for email tables
CREATE INDEX idx_email_preferences_digest_day ON email_preferences(digest_day) WHERE weekly_digest = true;
CREATE INDEX idx_email_preferences_verified ON email_preferences(email_verified) WHERE weekly_digest = true;
CREATE INDEX idx_digest_logs_user ON digest_logs(user_id, sent_at DESC);
CREATE INDEX idx_digest_logs_type ON digest_logs(email_type, sent_at DESC);
CREATE INDEX idx_email_preferences_unsubscribe ON email_preferences(unsubscribe_token);

-- RLS for email_preferences
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email preferences" ON email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" ON email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" ON email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email preferences" ON email_preferences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view own digest logs" ON digest_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all digest logs" ON digest_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert digest logs" ON digest_logs
  FOR INSERT WITH CHECK (true);

-- Trigger to auto-update timestamps
CREATE TRIGGER trigger_email_preferences_updated
BEFORE UPDATE ON email_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to generate random unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id, unsubscribe_token)
  VALUES (NEW.id, generate_unsubscribe_token())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_email_preferences
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_email_preferences();
