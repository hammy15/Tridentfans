-- Add notification preferences to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_game_reminders": true,
  "email_prediction_results": true,
  "email_weekly_digest": true,
  "email_mentions": true
}'::jsonb;

-- Add email column for users who signed up via OAuth
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs
ON profiles USING gin (notification_preferences);

-- Comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'User email notification preferences';
COMMENT ON COLUMN profiles.email IS 'User email for notifications (synced from auth)';
