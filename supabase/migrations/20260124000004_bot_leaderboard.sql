-- Bot Leaderboard Table
-- Tracks bot prediction performance

CREATE TABLE IF NOT EXISTS bot_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL UNIQUE CHECK (bot_id IN ('moose', 'captain_hammy', 'spartan')),
  total_points INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  correct_winners INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bot_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot leaderboard viewable by everyone" ON bot_leaderboard
  FOR SELECT USING (true);

-- Initialize the three bots
INSERT INTO bot_leaderboard (bot_id, total_points, total_predictions, accuracy)
VALUES
  ('moose', 0, 0, 0),
  ('captain_hammy', 0, 0, 0),
  ('spartan', 0, 0, 0)
ON CONFLICT (bot_id) DO NOTHING;
