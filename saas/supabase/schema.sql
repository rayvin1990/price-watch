-- PriceWatch Supabase Schema
-- Run this in your Supabase SQL Editor

-- ====================
-- Core Tables
-- ====================

-- API tokens for extension sync
CREATE TABLE IF NOT EXISTS api_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT 'default',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  current_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT '$',
  interval TEXT DEFAULT 'month',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT '$',
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_price_history_sub_id ON price_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- 付费计划表
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL,
  max_subscriptions INTEGER,
  features JSONB,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 用户订阅计划表
CREATE TABLE IF NOT EXISTS user_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id);

-- ====================
-- Views
-- ====================

CREATE OR REPLACE VIEW subscription_price_changes AS
SELECT
  s.id,
  s.name,
  s.current_price,
  s.currency,
  s.interval,
  ph.price AS previous_price,
  ph.recorded_at AS previous_price_date,
  (s.current_price - ph.price) AS price_difference,
  CASE WHEN ph.price > 0
    THEN ((s.current_price - ph.price) / ph.price * 100)
    ELSE 0
  END AS price_change_percent
FROM subscriptions s
JOIN LATERAL (
  SELECT price, recorded_at
  FROM price_history
  WHERE subscription_id = s.id
    AND price != s.current_price
  ORDER BY recorded_at DESC
  LIMIT 1
) ph ON true;

-- ====================
-- Row Level Security
-- ====================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON subscriptions;
CREATE POLICY "Users can manage their own subscriptions"
  ON subscriptions FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own price history" ON subscriptions;
CREATE POLICY "Users can view their own price history"
  ON price_history FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own notifications" ON subscriptions;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- ====================
-- Seed Data
-- ====================

INSERT INTO plans (id, name, price, interval, max_subscriptions, features, is_active) VALUES
  ('free', 'Free', 0, 'month', 3, '{"browser_notifications": true, "price_history": "7 days"}', true),
  ('pro', 'Pro', 5, 'month', 50, '{"browser_notifications": true, "email_notifications": true, "price_history": "1 year", "export": true}', true),
  ('pro_yearly', 'Pro Yearly', 49, 'year', 50, '{"browser_notifications": true, "email_notifications": true, "price_history": "1 year", "export": true}', true)
ON CONFLICT (id) DO NOTHING;
