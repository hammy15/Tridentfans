-- TridentFans Enhancements Migration
-- Adds: badges, bookmarks, mentions, bot predictions

-- ============================================
-- USER BADGES
-- ============================================

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone" ON user_badges
  FOR SELECT USING (true);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- NEWS BOOKMARKS
-- ============================================

CREATE TABLE news_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  article_url TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_source TEXT,
  article_image TEXT,
  article_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_url)
);

ALTER TABLE news_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON news_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" ON news_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON news_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user ON news_bookmarks(user_id);

-- ============================================
-- BOT PREDICTIONS
-- ============================================

CREATE TABLE bot_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL CHECK (bot_id IN ('moose', 'captain_hammy', 'spartan')),
  game_id UUID REFERENCES prediction_games(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL,
  reasoning TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  UNIQUE(bot_id, game_id)
);

ALTER TABLE bot_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot predictions viewable by everyone" ON bot_predictions
  FOR SELECT USING (true);

CREATE INDEX idx_bot_predictions_game ON bot_predictions(game_id);

-- ============================================
-- ADD MENTIONS TO POSTS & COMMENTS
-- ============================================

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';

-- ============================================
-- ADD GAME THREAD TRACKING
-- ============================================

ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS mlb_game_id INTEGER;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_game_thread BOOLEAN DEFAULT false;

CREATE INDEX idx_posts_game_thread ON forum_posts(mlb_game_id) WHERE is_game_thread = true;

-- ============================================
-- BADGE DEFINITIONS (seed data)
-- ============================================

-- Badge types and their requirements will be handled in application code
-- Example badges:
-- prediction_streak_3: Win 3 predictions in a row
-- prediction_streak_5: Win 5 predictions in a row
-- prediction_perfect: Get 100% on a game prediction
-- forum_first_post: Create your first forum post
-- forum_10_posts: Create 10 forum posts
-- forum_popular: Get 10 upvotes on a single post
-- early_adopter: Join in the first month
-- super_fan: Active for 30 consecutive days
