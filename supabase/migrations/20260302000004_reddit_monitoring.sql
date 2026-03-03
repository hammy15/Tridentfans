-- Reddit monitoring and content generation tables

-- Store Reddit engagement opportunities
CREATE TABLE reddit_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reddit_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('post', 'comment', 'mention')),
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    url TEXT NOT NULL,
    relevance_score INTEGER NOT NULL DEFAULT 0,
    suggested_persona TEXT NOT NULL CHECK (suggested_persona IN ('mark', 'hammy', 'spartan')),
    suggested_response TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'posted', 'skipped', 'high_priority')),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store trending topics and content ideas
CREATE TABLE content_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL, -- 'reddit_trending', 'manual', 'api_data', etc.
    topic TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    sample_posts JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'used', 'rejected')),
    used_for TEXT, -- 'forum_post', 'blog_post', 'social_media', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store generated content for review/posting
CREATE TABLE generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'reddit_organic', 'twitter', 'forum_post', 'blog_draft'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by TEXT NOT NULL, -- 'mark', 'hammy', 'spartan', 'system'
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'rejected')),
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reddit_opportunities_status ON reddit_opportunities(status);
CREATE INDEX idx_reddit_opportunities_relevance ON reddit_opportunities(relevance_score DESC);
CREATE INDEX idx_reddit_opportunities_created ON reddit_opportunities(created_at DESC);
CREATE INDEX idx_reddit_opportunities_subreddit ON reddit_opportunities(subreddit);

CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_source ON content_ideas(source);
CREATE INDEX idx_content_ideas_frequency ON content_ideas(frequency DESC);
CREATE INDEX idx_content_ideas_created ON content_ideas(created_at DESC);

CREATE INDEX idx_generated_content_status ON generated_content(status);
CREATE INDEX idx_generated_content_type ON generated_content(type);
CREATE INDEX idx_generated_content_created_by ON generated_content(created_by);
CREATE INDEX idx_generated_content_created ON generated_content(created_at DESC);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reddit_opportunities_updated_at BEFORE UPDATE ON reddit_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (Row Level Security)
ALTER TABLE reddit_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users, write access to service role
CREATE POLICY "Reddit opportunities are readable by authenticated users" ON reddit_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Content ideas are readable by authenticated users" ON content_ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Generated content is readable by authenticated users" ON generated_content FOR SELECT TO authenticated USING (true);

-- Insert policy for service role (cron jobs)
CREATE POLICY "Service role can manage reddit opportunities" ON reddit_opportunities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage content ideas" ON content_ideas FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage generated content" ON generated_content FOR ALL TO service_role USING (true);

-- Views for easy querying
CREATE VIEW high_priority_opportunities AS
SELECT 
    id,
    reddit_id,
    type,
    subreddit,
    title,
    url,
    relevance_score,
    suggested_persona,
    suggested_response,
    keywords,
    status,
    created_at
FROM reddit_opportunities 
WHERE status IN ('high_priority', 'approved') 
   OR relevance_score > 15
ORDER BY relevance_score DESC, created_at DESC;

CREATE VIEW trending_content_ideas AS
SELECT 
    topic,
    COUNT(*) as mention_count,
    MAX(frequency) as peak_frequency,
    ARRAY_AGG(DISTINCT source) as sources,
    MAX(created_at) as last_seen
FROM content_ideas 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY topic
HAVING COUNT(*) > 1 OR MAX(frequency) > 3
ORDER BY peak_frequency DESC, mention_count DESC;

-- Function to clean old opportunities (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_reddit_data()
RETURNS void AS $$
BEGIN
    DELETE FROM reddit_opportunities WHERE created_at < NOW() - INTERVAL '30 days' AND status = 'skipped';
    DELETE FROM content_ideas WHERE created_at < NOW() - INTERVAL '60 days' AND status = 'rejected';
    DELETE FROM generated_content WHERE created_at < NOW() - INTERVAL '90 days' AND status = 'rejected';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE reddit_opportunities IS 'Stores Reddit posts/comments that present engagement opportunities for organic growth';
COMMENT ON TABLE content_ideas IS 'Tracks trending topics and content ideas from various sources';
COMMENT ON TABLE generated_content IS 'AI-generated content ready for review and posting';

COMMENT ON COLUMN reddit_opportunities.relevance_score IS 'Calculated score based on engagement, keywords, and subreddit relevance (0-50+ range)';
COMMENT ON COLUMN reddit_opportunities.suggested_persona IS 'Which TridentFans personality should engage (mark/hammy/spartan)';
COMMENT ON COLUMN content_ideas.frequency IS 'How many times this topic appeared in source data';
COMMENT ON COLUMN generated_content.metadata IS 'Additional data like target platform, scheduling info, etc.';