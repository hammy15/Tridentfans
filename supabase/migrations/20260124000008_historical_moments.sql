-- Historical Moments for "On This Day" Feature
-- Seattle Mariners franchise history moments

-- ============================================
-- HISTORICAL MOMENTS TABLE
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

-- Enable realtime for historical moments (optional - for live updates in admin)
-- ALTER PUBLICATION supabase_realtime ADD TABLE historical_moments;
