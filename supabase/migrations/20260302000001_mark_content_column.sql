-- Add is_mark_content column to track Mark's auto-generated content
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS is_mark_content BOOLEAN DEFAULT false;

-- Index for quickly finding Mark's content
CREATE INDEX IF NOT EXISTS idx_forum_posts_mark_content ON forum_posts(is_mark_content, created_at DESC) WHERE is_mark_content = true;

-- Allow system (null user_id) posts for Mark's content
-- Update RLS to allow inserts with null user_id from server
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'System can create posts' AND tablename = 'forum_posts'
  ) THEN
    CREATE POLICY "System can create posts" ON forum_posts
      FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
  END IF;
END $$;
