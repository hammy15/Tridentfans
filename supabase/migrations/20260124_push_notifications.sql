-- Push Notifications Schema
-- Migration for push notification support in TridentFans

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh: string, auth: string }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  -- Prevent duplicate subscriptions per endpoint per user
  UNIQUE (user_id, endpoint)
);

-- Indexes for push_subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for backend operations)
CREATE POLICY "Service role can manage all push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- PUSH NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE push_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  game_reminders BOOLEAN DEFAULT true,
  prediction_closing BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  follower_activity BOOLEAN DEFAULT false,
  achievements BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for push_notification_preferences
ALTER TABLE push_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON push_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON push_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON push_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all preferences
CREATE POLICY "Service role can manage all notification preferences" ON push_notification_preferences
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- SCHEDULED NOTIFICATIONS
-- ============================================

CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'custom',
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_ids UUID[],
  broadcast BOOLEAN DEFAULT false,
  payload JSONB NOT NULL, -- { title, body, icon, badge, data, actions }
  notification_type TEXT, -- matches preference key
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for scheduled_notifications
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for)
  WHERE status = 'pending';

-- RLS for scheduled_notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can manage scheduled notifications
CREATE POLICY "Admins can view scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage scheduled notifications" ON scheduled_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage all scheduled notifications" ON scheduled_notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- NOTIFICATION LOGS
-- ============================================

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('single', 'bulk', 'broadcast')),
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  payload JSONB NOT NULL,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Index for notification_logs
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view notification logs" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage notification logs" ON notification_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update timestamp on preference changes
CREATE OR REPLACE FUNCTION update_push_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_notification_preferences_updated
  BEFORE UPDATE ON push_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_push_preferences_timestamp();

-- Function to get users with specific notification preference enabled
CREATE OR REPLACE FUNCTION get_users_with_push_preference(preference_name TEXT)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT pnp.user_id
  FROM push_notification_preferences pnp
  JOIN push_subscriptions ps ON ps.user_id = pnp.user_id AND ps.is_active = true
  WHERE
    CASE preference_name
      WHEN 'game_reminders' THEN pnp.game_reminders
      WHEN 'prediction_closing' THEN pnp.prediction_closing
      WHEN 'challenge_updates' THEN pnp.challenge_updates
      WHEN 'follower_activity' THEN pnp.follower_activity
      WHEN 'achievements' THEN pnp.achievements
      WHEN 'weekly_digest' THEN pnp.weekly_digest
      ELSE true
    END = true
  GROUP BY pnp.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA / DEFAULTS
-- ============================================

-- Create default notification preferences when a user subscribes to push for the first time
CREATE OR REPLACE FUNCTION create_default_push_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO push_notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_push_preferences_on_subscription
  AFTER INSERT ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_default_push_preferences();
