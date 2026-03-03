-- Prediction Games 2.0 - Comprehensive Prediction System
-- Transforms TridentFans into the ultimate Mariners prediction platform

-- Prediction categories with difficulty tiers and point values
CREATE TABLE prediction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('exact_number', 'range', 'boolean', 'choice', 'player_pick')),
    points_base INTEGER NOT NULL DEFAULT 10,
    difficulty_tier TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty_tier IN ('easy', 'medium', 'hard', 'expert', 'bonus')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    options JSONB DEFAULT '[]', -- For choice type predictions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User predictions with comprehensive tracking
CREATE TABLE user_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    game_id UUID NOT NULL, -- References prediction_games.id
    category_id UUID REFERENCES prediction_categories(id),
    prediction_value TEXT NOT NULL,
    prediction_data JSONB DEFAULT '{}', -- Store complex predictions (ranges, multiple values)
    points_earned INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_at TIMESTAMP WITH TIME ZONE, -- When prediction gets locked (game start)
    
    UNIQUE(user_id, game_id, category_id)
);

-- AI persona predictions
CREATE TABLE ai_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL,
    persona TEXT NOT NULL CHECK (persona IN ('mark', 'hammy', 'spartan')),
    category_id UUID REFERENCES prediction_categories(id),
    prediction_value TEXT NOT NULL,
    prediction_data JSONB DEFAULT '{}',
    reasoning TEXT, -- Why they made this prediction (for users to read)
    confidence_level INTEGER DEFAULT 5 CHECK (confidence_level BETWEEN 1 AND 10),
    points_earned INTEGER DEFAULT 0,
    is_correct BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(game_id, persona, category_id)
);

-- User achievements and badges
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    badge_icon TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Store achievement details
    
    UNIQUE(user_id, achievement_type, achievement_name)
);

-- Prediction streaks tracking
CREATE TABLE prediction_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    streak_type TEXT NOT NULL CHECK (streak_type IN ('correct_predictions', 'beat_mark', 'beat_hammy', 'beat_spartan', 'beat_all_ai')),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_game_id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    broken_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, streak_type)
);

-- Leaderboards with different time periods
CREATE TABLE leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('daily', 'weekly', 'monthly', 'season', 'alltime')),
    period_start DATE,
    period_end DATE,
    total_points INTEGER DEFAULT 0,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
    ai_wins INTEGER DEFAULT 0, -- Times user beat all AI predictors
    rank_position INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, leaderboard_type, period_start)
);

-- Affiliate tracking for revenue
CREATE TABLE affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    affiliate_partner TEXT NOT NULL, -- 'draftkings', 'fanduel', 'stubhub', etc.
    source_page TEXT NOT NULL, -- Where the click came from
    prediction_context JSONB DEFAULT '{}', -- What predictions led to this click
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE, -- If we get conversion tracking
    commission_earned DECIMAL(10,2) DEFAULT 0.00
);

-- Donations and contributions
CREATE TABLE user_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    contribution_type TEXT NOT NULL CHECK (contribution_type IN ('one_time', 'monthly', 'annual')),
    payment_method TEXT, -- 'stripe', 'paypal', etc.
    payment_id TEXT, -- External payment reference
    message TEXT, -- Optional message from contributor
    is_anonymous BOOLEAN DEFAULT false,
    contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Premium subscriptions
CREATE TABLE premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'champion')),
    monthly_price DECIMAL(10,2) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    payment_method TEXT,
    subscription_id TEXT, -- External subscription reference
    
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_predictions_user_game ON user_predictions(user_id, game_id);
CREATE INDEX idx_user_predictions_category ON user_predictions(category_id);
CREATE INDEX idx_user_predictions_points ON user_predictions(points_earned DESC);
CREATE INDEX idx_user_predictions_submitted ON user_predictions(submitted_at DESC);

CREATE INDEX idx_ai_predictions_game_persona ON ai_predictions(game_id, persona);
CREATE INDEX idx_ai_predictions_category ON ai_predictions(category_id);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);

CREATE INDEX idx_prediction_streaks_user ON prediction_streaks(user_id);
CREATE INDEX idx_prediction_streaks_type ON prediction_streaks(streak_type);

CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period_start, rank_position);
CREATE INDEX idx_leaderboards_points ON leaderboards(total_points DESC);

CREATE INDEX idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_partner ON affiliate_clicks(affiliate_partner);
CREATE INDEX idx_affiliate_clicks_date ON affiliate_clicks(clicked_at DESC);

-- Insert default prediction categories
INSERT INTO prediction_categories (name, description, type, points_base, difficulty_tier, display_order, options) VALUES
-- Easy predictions (10-15 points)
('Game Winner', 'Which team will win?', 'choice', 10, 'easy', 1, '["Mariners", "Opponent"]'),
('Total Runs Over/Under', 'Will total runs be over or under 8.5?', 'choice', 15, 'easy', 2, '["Over 8.5", "Under 8.5"]'),
('Mariners Score First', 'Will the Mariners score the first run?', 'boolean', 15, 'easy', 3, '[]'),

-- Medium predictions (20-35 points)  
('Mariners Total Runs', 'How many runs will the Mariners score?', 'exact_number', 25, 'medium', 10, '[]'),
('Total Game Runs', 'Total runs scored by both teams', 'exact_number', 25, 'medium', 11, '[]'),
('Mariners Total Hits', 'Total hits by the Mariners', 'exact_number', 25, 'medium', 12, '[]'),
('Home Runs Hit', 'Total home runs in the game (both teams)', 'exact_number', 30, 'medium', 13, '[]'),
('Winning Margin', 'Margin of victory', 'choice', 25, 'medium', 14, '["1 run", "2-3 runs", "4-6 runs", "7+ runs"]'),

-- Hard predictions (40-60 points)
('Exact Final Score', 'Predict the exact final score', 'choice', 50, 'hard', 20, '[]'),
('Julio Rodriguez Hits', 'How many hits will Julio get?', 'choice', 40, 'hard', 21, '["0", "1", "2", "3+"]'),
('Cal Raleigh Home Runs', 'How many HRs will Cal hit?', 'choice', 45, 'hard', 22, '["0", "1", "2+"]'),
('Starting Pitcher Innings', 'Innings pitched by Mariners starter', 'choice', 40, 'hard', 23, '["Under 5", "5.0-6.0", "6.1+"]'),
('Game Length', 'How long will the game take?', 'choice', 35, 'hard', 24, '["Under 2:45", "2:45-3:15", "Over 3:15"]'),

-- Expert predictions (75-100 points)
('First Mariners RBI', 'Who gets the first Mariners RBI?', 'player_pick', 75, 'expert', 30, '[]'),
('Game MVP', 'Who will be the game MVP?', 'player_pick', 100, 'expert', 31, '[]'),
('Most Exciting Inning', 'Which inning will be most exciting?', 'choice', 75, 'expert', 32, '["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "Extra"]'),
('Strikeouts by Mariners Pitching', 'Total strikeouts by M''s pitchers', 'exact_number', 85, 'expert', 33, '[]'),

-- Bonus predictions (125-200 points)
('Walk-off Situation', 'Will this game end in a walk-off?', 'boolean', 125, 'bonus', 40, '[]'),
('Perfect Inning', 'Will any inning be pitched perfectly (1-2-3)?', 'boolean', 150, 'bonus', 41, '[]'),
('Ejection/Argument', 'Will there be an ejection or major argument?', 'boolean', 175, 'bonus', 42, '[]'),
('Weather Delay', 'Will weather impact the game?', 'boolean', 200, 'bonus', 43, '[]');

-- Create views for easy querying
CREATE VIEW leaderboard_current_season AS
SELECT 
    l.*,
    u.email,
    COALESCE(p.display_name, SPLIT_PART(u.email, '@', 1)) as display_name,
    CASE 
        WHEN ps.tier IS NOT NULL THEN ps.tier
        ELSE 'free'
    END as subscription_tier
FROM leaderboards l
JOIN auth.users u ON l.user_id = u.id
LEFT JOIN user_profiles p ON l.user_id = p.user_id
LEFT JOIN premium_subscriptions ps ON l.user_id = ps.user_id AND ps.is_active = true
WHERE l.leaderboard_type = 'season' 
ORDER BY l.rank_position ASC;

CREATE VIEW user_prediction_summary AS
SELECT 
    up.user_id,
    up.game_id,
    COUNT(*) as total_predictions,
    SUM(up.points_earned) as total_points,
    AVG(CASE WHEN up.is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
    SUM(CASE WHEN up.is_correct THEN 1 ELSE 0 END) as correct_count
FROM user_predictions up
WHERE up.locked_at IS NOT NULL -- Only count locked predictions
GROUP BY up.user_id, up.game_id;

-- Function to calculate user vs AI performance
CREATE OR REPLACE FUNCTION calculate_ai_wins(user_id_param UUID, game_id_param UUID)
RETURNS TABLE(beat_mark BOOLEAN, beat_hammy BOOLEAN, beat_spartan BOOLEAN, beat_all BOOLEAN) AS $$
DECLARE
    user_points INTEGER;
    mark_points INTEGER;
    hammy_points INTEGER;
    spartan_points INTEGER;
BEGIN
    -- Get user's total points for the game
    SELECT COALESCE(SUM(points_earned), 0) INTO user_points
    FROM user_predictions 
    WHERE user_id = user_id_param AND game_id = game_id_param AND is_correct = true;
    
    -- Get AI points for the game
    SELECT COALESCE(SUM(points_earned), 0) INTO mark_points
    FROM ai_predictions 
    WHERE persona = 'mark' AND game_id = game_id_param AND is_correct = true;
    
    SELECT COALESCE(SUM(points_earned), 0) INTO hammy_points
    FROM ai_predictions 
    WHERE persona = 'hammy' AND game_id = game_id_param AND is_correct = true;
    
    SELECT COALESCE(SUM(points_earned), 0) INTO spartan_points
    FROM ai_predictions 
    WHERE persona = 'spartan' AND game_id = game_id_param AND is_correct = true;
    
    -- Return comparison results
    RETURN QUERY SELECT 
        user_points > mark_points,
        user_points > hammy_points, 
        user_points > spartan_points,
        user_points > mark_points AND user_points > hammy_points AND user_points > spartan_points;
END;
$$ LANGUAGE plpgsql;

-- Update triggers for leaderboards and streaks
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update will be handled by application logic for complex calculations
    -- This trigger just marks that stats need updating
    INSERT INTO background_jobs (job_type, job_data, created_at)
    VALUES ('update_user_stats', json_build_object('user_id', NEW.user_id, 'game_id', NEW.game_id), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_prediction_score 
    AFTER UPDATE OF points_earned, is_correct ON user_predictions
    FOR EACH ROW 
    WHEN (NEW.is_correct IS NOT NULL)
    EXECUTE FUNCTION update_user_stats();

-- Background jobs table for async processing
CREATE TABLE background_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type TEXT NOT NULL,
    job_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_background_jobs_status ON background_jobs(status, created_at);

-- RLS policies
ALTER TABLE prediction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories and AI predictions
CREATE POLICY "Prediction categories are public" ON prediction_categories FOR SELECT USING (true);
CREATE POLICY "AI predictions are public" ON ai_predictions FOR SELECT USING (true);

-- Users can only see their own predictions, achievements, etc.
CREATE POLICY "Users can see their own predictions" ON user_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON user_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions" ON user_predictions FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboards are public for viewing
CREATE POLICY "Leaderboards are public" ON leaderboards FOR SELECT USING (true);

-- Service role can manage everything
CREATE POLICY "Service role full access on prediction_categories" ON prediction_categories FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on user_predictions" ON user_predictions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on ai_predictions" ON ai_predictions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on user_achievements" ON user_achievements FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on prediction_streaks" ON prediction_streaks FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on leaderboards" ON leaderboards FOR ALL TO service_role USING (true);

-- Comments for documentation
COMMENT ON TABLE prediction_categories IS 'Defines all possible prediction types with difficulty and point values';
COMMENT ON TABLE user_predictions IS 'Individual user predictions for each game category';
COMMENT ON TABLE ai_predictions IS 'Predictions made by Mark, Hammy, and Spartan for comparison';
COMMENT ON TABLE user_achievements IS 'Badges and achievements earned by users';
COMMENT ON TABLE prediction_streaks IS 'Tracking various types of user streaks';
COMMENT ON TABLE leaderboards IS 'Rankings for different time periods and metrics';
COMMENT ON TABLE affiliate_clicks IS 'Revenue tracking for affiliate link clicks';
COMMENT ON TABLE user_contributions IS 'Donations and tips from community members';
COMMENT ON TABLE premium_subscriptions IS 'Paid subscription tiers and features';