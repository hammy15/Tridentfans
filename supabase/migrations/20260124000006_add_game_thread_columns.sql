-- Add game thread columns to forum_posts
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_game_thread BOOLEAN DEFAULT false;
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS mlb_game_id INTEGER;

-- Create index for efficient game thread lookups
CREATE INDEX IF NOT EXISTS idx_forum_posts_game_thread ON forum_posts(is_game_thread) WHERE is_game_thread = true;
CREATE INDEX IF NOT EXISTS idx_forum_posts_mlb_game_id ON forum_posts(mlb_game_id) WHERE mlb_game_id IS NOT NULL;
