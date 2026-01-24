-- TridentFans Donations Migration
-- Adds donation tracking and supporter badges

-- ============================================
-- DONATIONS TABLE
-- ============================================

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze_slugger', 'silver_slugger', 'gold_slugger', 'custom')),
  stripe_payment_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donations viewable by owner" ON donations
  FOR SELECT USING (user_id = auth.uid() OR is_anonymous = false);

CREATE POLICY "Anyone can create donations" ON donations
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_donations_user ON donations(user_id);
CREATE INDEX idx_donations_stripe ON donations(stripe_payment_id);

-- ============================================
-- DONATION LEADERBOARD VIEW
-- ============================================

CREATE OR REPLACE VIEW donation_leaderboard AS
SELECT
  d.user_id,
  p.username,
  p.display_name,
  SUM(d.amount_cents) as total_donated_cents,
  COUNT(*) as donation_count,
  MAX(d.created_at) as last_donation
FROM donations d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.status = 'completed' AND d.is_anonymous = false
GROUP BY d.user_id, p.username, p.display_name
ORDER BY total_donated_cents DESC;

-- ============================================
-- ADD SUPPORTER BADGES TO BADGE TYPES
-- ============================================

-- These badges are awarded automatically on donation:
-- bronze_slugger: $1+ donation
-- silver_slugger: $5+ donation
-- gold_slugger: $10+ donation
-- superfan_supporter: $50+ total donations
-- legend_supporter: $100+ total donations
