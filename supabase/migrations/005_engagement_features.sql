-- ============================================
-- ACHIEVEMENT BADGES SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('predictions', 'streaks', 'social', 'special')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  points INTEGER DEFAULT 10,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Insert default badges (ignore if exists)
INSERT INTO badges (slug, name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('first_prediction', 'First Pick', 'Made your first prediction', '🎯', 'predictions', 'count', 1, 10, 'common'),
('prediction_10', 'Getting Started', 'Made 10 predictions', '📊', 'predictions', 'count', 10, 25, 'common'),
('prediction_50', 'Regular Predictor', 'Made 50 predictions', '🔮', 'predictions', 'count', 50, 50, 'uncommon'),
('prediction_100', 'Prediction Pro', 'Made 100 predictions', '🏆', 'predictions', 'count', 100, 100, 'rare'),
('prediction_500', 'Oracle', 'Made 500 predictions', '👁️', 'predictions', 'count', 500, 250, 'epic'),
('perfect_game', 'Perfect Game', 'Got all 10 predictions right in one game', '💯', 'predictions', 'achievement', 1, 500, 'legendary'),
('accuracy_60', 'Sharp Eye', 'Maintain 60% accuracy over 20+ games', '🎯', 'predictions', 'achievement', 1, 100, 'uncommon'),
('accuracy_70', 'Precision Master', 'Maintain 70% accuracy over 20+ games', '🔥', 'predictions', 'achievement', 1, 200, 'rare'),
('streak_3', 'Hot Streak', '3-day prediction streak', '🔥', 'streaks', 'streak', 3, 30, 'common'),
('streak_7', 'Week Warrior', '7-day prediction streak', '⚡', 'streaks', 'streak', 7, 75, 'uncommon'),
('streak_14', 'Fortnight Fighter', '14-day prediction streak', '💪', 'streaks', 'streak', 14, 150, 'rare'),
('streak_30', 'Monthly Master', '30-day prediction streak', '👑', 'streaks', 'streak', 30, 300, 'epic'),
('streak_100', 'Century Club', '100-day prediction streak', '🏅', 'streaks', 'streak', 100, 1000, 'legendary'),
('first_post', 'Voice Heard', 'Created your first forum post', '📝', 'social', 'count', 1, 10, 'common'),
('post_10', 'Regular Contributor', 'Created 10 forum posts', '💬', 'social', 'count', 10, 50, 'uncommon'),
('first_follower', 'Rising Star', 'Got your first follower', '⭐', 'social', 'count', 1, 25, 'common'),
('followers_10', 'Influencer', 'Got 10 followers', '🌟', 'social', 'count', 10, 100, 'uncommon'),
('followers_50', 'Community Leader', 'Got 50 followers', '👥', 'social', 'count', 50, 250, 'rare'),
('founding_member', 'Founding Member', 'Joined during launch', '🔱', 'special', 'achievement', 1, 500, 'legendary'),
('beat_the_bot', 'Bot Beater', 'Beat Moose in weekly predictions', '🤖', 'special', 'achievement', 1, 200, 'rare'),
('tournament_winner', 'Champion', 'Won a prediction tournament', '🏆', 'special', 'achievement', 1, 500, 'epic')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges viewable by everyone" ON badges;
DROP POLICY IF EXISTS "User badges viewable by everyone" ON user_badges;
DROP POLICY IF EXISTS "System can grant badges" ON user_badges;

CREATE POLICY "Badges viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable by everyone" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can grant badges" ON user_badges FOR INSERT WITH CHECK (true);

-- ============================================
-- DAILY STREAKS
-- ============================================

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_prediction_date DATE,
  total_prediction_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Streaks viewable by everyone" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert own streak" ON user_streaks;
CREATE POLICY "Streaks viewable by everyone" ON user_streaks FOR SELECT USING (true);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEASON PASS / REWARDS TIERS
-- ============================================

CREATE TABLE IF NOT EXISTS season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INTEGER NOT NULL,
  tier INTEGER NOT NULL,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE(season, tier)
);

CREATE TABLE IF NOT EXISTS user_season_progress (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_tier INTEGER DEFAULT 0,
  rewards_claimed JSONB DEFAULT '[]',
  PRIMARY KEY (user_id, season)
);

INSERT INTO season_rewards (season, tier, points_required, reward_type, reward_value, description) VALUES
(2026, 1, 100, 'title', 'Rookie', 'Unlock "Rookie" title'),
(2026, 2, 250, 'badge', 'season_bronze', 'Bronze Season Badge'),
(2026, 3, 500, 'title', 'Contender', 'Unlock "Contender" title'),
(2026, 4, 1000, 'badge', 'season_silver', 'Silver Season Badge'),
(2026, 5, 2000, 'title', 'All-Star', 'Unlock "All-Star" title'),
(2026, 6, 3500, 'badge', 'season_gold', 'Gold Season Badge'),
(2026, 7, 5000, 'title', 'MVP Candidate', 'Unlock "MVP Candidate" title'),
(2026, 8, 7500, 'badge', 'season_platinum', 'Platinum Season Badge'),
(2026, 9, 10000, 'title', 'Hall of Famer', 'Unlock "Hall of Famer" title'),
(2026, 10, 15000, 'badge', 'season_champion', 'Champion Season Badge')
ON CONFLICT (season, tier) DO NOTHING;

ALTER TABLE season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_season_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Season rewards viewable by all" ON season_rewards;
DROP POLICY IF EXISTS "Season progress viewable by all" ON user_season_progress;
DROP POLICY IF EXISTS "Users update own progress" ON user_season_progress;
CREATE POLICY "Season rewards viewable by all" ON season_rewards FOR SELECT USING (true);
CREATE POLICY "Season progress viewable by all" ON user_season_progress FOR SELECT USING (true);
CREATE POLICY "Users update own progress" ON user_season_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- HEAD-TO-HEAD CHALLENGES
-- ============================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES prediction_games(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  challenger_score INTEGER,
  opponent_score INTEGER,
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Challenges viewable by participants" ON challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Participants can update challenges" ON challenges;
CREATE POLICY "Challenges viewable by participants" ON challenges FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update challenges" ON challenges FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- ============================================
-- BOT PREDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS bot_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL CHECK (bot_id IN ('moose', 'captain_hammy', 'spartan')),
  game_id UUID REFERENCES prediction_games(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL,
  reasoning TEXT,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bot_id, game_id)
);

ALTER TABLE bot_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bot predictions viewable by all" ON bot_predictions;
CREATE POLICY "Bot predictions viewable by all" ON bot_predictions FOR SELECT USING (true);

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('weekly', 'monthly', 'special')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize_description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tournament_id, user_id)
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tournaments viewable by all" ON tournaments;
DROP POLICY IF EXISTS "Tournament participants viewable by all" ON tournament_participants;
DROP POLICY IF EXISTS "Users can join tournaments" ON tournament_participants;
CREATE POLICY "Tournaments viewable by all" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Tournament participants viewable by all" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can join tournaments" ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FOLLOW SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows viewable by all" ON follows;
DROP POLICY IF EXISTS "Users can follow" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Follows viewable by all" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "System creates notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System creates notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- USER SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own settings" ON user_settings;
DROP POLICY IF EXISTS "Users update own settings" ON user_settings;
CREATE POLICY "Users see own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- LIVE GAME CHAT
-- ============================================

CREATE TABLE IF NOT EXISTS game_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES prediction_games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_chat_game ON game_chat_messages(game_id, created_at DESC);

ALTER TABLE game_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat messages viewable by all" ON game_chat_messages;
DROP POLICY IF EXISTS "Auth users can send messages" ON game_chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON game_chat_messages;
CREATE POLICY "Chat messages viewable by all" ON game_chat_messages FOR SELECT USING (true);
CREATE POLICY "Auth users can send messages" ON game_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON game_chat_messages FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EXTEND PROFILES
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Fan';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prediction_accuracy DECIMAL(5,2) DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_follow_counts ON follows;
CREATE TRIGGER trigger_follow_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE game_chat_messages;
