-- Referral codes for member growth tracking
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  referred_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referred_by ON referral_codes(referred_by);

-- RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
CREATE POLICY "Users read own referral" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for cron/API)
CREATE POLICY "Service role full access referrals" ON referral_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Allow inserts for new referrals
CREATE POLICY "Allow insert referrals" ON referral_codes
  FOR INSERT WITH CHECK (true);

-- Add recruiter badge to badges table if it doesn't exist
INSERT INTO badges (name, description, icon, category)
VALUES ('Recruiter', 'Referred 3+ friends to TridentFans', '📣', 'special')
ON CONFLICT DO NOTHING;
