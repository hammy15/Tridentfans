-- Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    source TEXT DEFAULT 'website',
    preferences JSONB DEFAULT '{"weekly_digest": true, "breaking_news": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Subscriptions Table  
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, cancelled, past_due
    plan_type TEXT NOT NULL DEFAULT 'premium', -- premium, annual
    price_cents INTEGER NOT NULL DEFAULT 499, -- $4.99/month
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Tracking Table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    affiliate_partner TEXT NOT NULL, -- 'draftkings', 'stubhub', 'mlbshop'
    click_url TEXT NOT NULL,
    referrer_page TEXT,
    user_agent TEXT,
    ip_address INET,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    conversion_tracked BOOLEAN DEFAULT false,
    conversion_value_cents INTEGER DEFAULT 0
);

-- Revenue Tracking Table
CREATE TABLE IF NOT EXISTS revenue_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL, -- 'premium', 'affiliate', 'sponsor'
    amount_cents INTEGER NOT NULL,
    description TEXT,
    reference_id TEXT, -- subscription_id, click_id, etc.
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    month_year TEXT GENERATED ALWAYS AS (to_char(recorded_at, 'YYYY-MM')) STORED
);

-- User Profiles Extension (for premium features)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS correct_predictions INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS prediction_streak INTEGER DEFAULT 0;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(active);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_partner ON affiliate_clicks(affiliate_partner);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_month_year ON revenue_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_source ON revenue_tracking(source);

-- Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Newsletter subscribers - anyone can insert (for signup), admins can read/update
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage newsletter subscribers" ON newsletter_subscribers
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
    ));

-- Premium subscriptions - users can read their own, admins can manage all
CREATE POLICY "Users can read own premium subscription" ON premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage premium subscriptions" ON premium_subscriptions
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
    ));

-- Affiliate clicks - anyone can insert, admins can read all
CREATE POLICY "Anyone can track affiliate clicks" ON affiliate_clicks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read affiliate clicks" ON affiliate_clicks
    FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
    ));

-- Revenue tracking - admins only
CREATE POLICY "Admins can manage revenue tracking" ON revenue_tracking
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
    ));

-- Functions for automated updates
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile when premium subscription changes
    UPDATE user_profiles 
    SET 
        is_premium = (NEW.status = 'active'),
        premium_since = CASE 
            WHEN NEW.status = 'active' AND OLD.status != 'active' THEN NOW()
            WHEN NEW.status != 'active' THEN NULL
            ELSE premium_since
        END
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update premium status
DROP TRIGGER IF EXISTS trigger_update_premium_status ON premium_subscriptions;
CREATE TRIGGER trigger_update_premium_status
    AFTER INSERT OR UPDATE ON premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_premium_status();

-- Function to track revenue automatically
CREATE OR REPLACE FUNCTION track_premium_revenue()
RETURNS TRIGGER AS $$
BEGIN
    -- Track revenue when premium subscription becomes active
    IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
        INSERT INTO revenue_tracking (source, amount_cents, description, reference_id)
        VALUES ('premium', NEW.price_cents, 'Premium subscription activation', NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track premium revenue
DROP TRIGGER IF EXISTS trigger_track_premium_revenue ON premium_subscriptions;
CREATE TRIGGER trigger_track_premium_revenue
    AFTER INSERT OR UPDATE ON premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION track_premium_revenue();

-- Views for analytics
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    month_year,
    source,
    SUM(amount_cents) as total_cents,
    COUNT(*) as transaction_count
FROM revenue_tracking
GROUP BY month_year, source
ORDER BY month_year DESC, source;

CREATE OR REPLACE VIEW premium_subscription_metrics AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscribers,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
    AVG(price_cents) as avg_price_cents
FROM premium_subscriptions;

CREATE OR REPLACE VIEW newsletter_metrics AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE active = true) as active_subscribers,
    COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM newsletter_subscribers;