-- Moderation system for TridentFans
-- Mark monitors for bad actors, spammers, advertisers

-- Add moderation fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Moderation actions log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'suspend', 'ban', 'unban', 'remove_content')),
  reason TEXT NOT NULL,
  moderator TEXT NOT NULL DEFAULT 'mark',
  content_id UUID,
  content_type TEXT CHECK (content_type IN ('post', 'reply', 'chat', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reported content
CREATE TABLE IF NOT EXISTS reported_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'reply', 'chat')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts table for Mark's content marketing
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[] DEFAULT '{}',
  author TEXT NOT NULL DEFAULT 'mark',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON moderation_actions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reported_content_status ON reported_content(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- RLS policies
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published blog posts
CREATE POLICY "Public can read published blog posts" ON blog_posts
  FOR SELECT USING (is_published = true);

-- Authenticated users can report content
CREATE POLICY "Authenticated users can report content" ON reported_content
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can see own reports" ON reported_content
  FOR SELECT USING (auth.uid() = reporter_id);
