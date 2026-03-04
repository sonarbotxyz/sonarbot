-- 001_data_foundation.sql
-- Sonarbot v2: Data foundation for analytics pipeline
-- Creates users, snapshots, social_snapshots, whale_wallets, health_scores, follows, alerts_log
-- Adds new columns to projects table

-- ============================================================
-- 1. Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  telegram_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'proplus')),
  plan_expires_at TIMESTAMPTZ,
  wallet_address TEXT,
  privy_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. Alter projects table — add analytics columns
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'base';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS x_user_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS farcaster_handle TEXT;

-- ============================================================
-- 3. Snapshots — on-chain data snapshots (hourly)
-- ============================================================
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  holders INTEGER,
  marketcap NUMERIC,
  volume_24h NUMERIC,
  liquidity NUMERIC,
  active_users INTEGER,
  tx_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snapshots_project_time
  ON snapshots (project_id, timestamp DESC);

-- ============================================================
-- 4. Social snapshots — social data (every 6h)
-- ============================================================
CREATE TABLE IF NOT EXISTS social_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  x_followers INTEGER,
  x_engagement_rate NUMERIC,
  github_commits_7d INTEGER,
  github_last_push TIMESTAMPTZ,
  farcaster_followers INTEGER
);

CREATE INDEX IF NOT EXISTS idx_social_snapshots_project_time
  ON social_snapshots (project_id, timestamp DESC);

-- ============================================================
-- 5. Whale wallets — top holders per project
-- ============================================================
CREATE TABLE IF NOT EXISTS whale_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  balance NUMERIC,
  pct_supply NUMERIC,
  last_tx_at TIMESTAMPTZ,
  last_tx_type TEXT,
  UNIQUE(project_id, address)
);

-- ============================================================
-- 6. Health scores — composite health rating
-- ============================================================
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  score INTEGER,
  holder_sub INTEGER,
  dev_sub INTEGER,
  liquidity_sub INTEGER,
  social_sub INTEGER,
  volume_sub INTEGER
);

CREATE INDEX IF NOT EXISTS idx_health_scores_project_time
  ON health_scores (project_id, timestamp DESC);

-- ============================================================
-- 7. Follows — user watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  custom_thresholds_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- ============================================================
-- 8. Alerts log
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  alert_type TEXT,
  metric TEXT,
  old_value NUMERIC,
  new_value NUMERIC,
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. Enable Row Level Security
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS Policies
-- ============================================================

-- Users: users can read their own row
CREATE POLICY users_select_own ON users
  FOR SELECT USING (true);

CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (true);

-- Snapshots: public read, service role insert
CREATE POLICY snapshots_select ON snapshots
  FOR SELECT USING (true);

CREATE POLICY snapshots_insert ON snapshots
  FOR INSERT WITH CHECK (true);

-- Social snapshots: public read, service role insert
CREATE POLICY social_snapshots_select ON social_snapshots
  FOR SELECT USING (true);

CREATE POLICY social_snapshots_insert ON social_snapshots
  FOR INSERT WITH CHECK (true);

-- Whale wallets: public read, service role insert/update
CREATE POLICY whale_wallets_select ON whale_wallets
  FOR SELECT USING (true);

CREATE POLICY whale_wallets_insert ON whale_wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY whale_wallets_update ON whale_wallets
  FOR UPDATE USING (true);

-- Health scores: public read, service role insert
CREATE POLICY health_scores_select ON health_scores
  FOR SELECT USING (true);

CREATE POLICY health_scores_insert ON health_scores
  FOR INSERT WITH CHECK (true);

-- Follows: public read, authenticated insert/delete
CREATE POLICY follows_select ON follows
  FOR SELECT USING (true);

CREATE POLICY follows_insert ON follows
  FOR INSERT WITH CHECK (true);

CREATE POLICY follows_delete ON follows
  FOR DELETE USING (true);

-- Alerts log: public read, service role insert
CREATE POLICY alerts_log_select ON alerts_log
  FOR SELECT USING (true);

CREATE POLICY alerts_log_insert ON alerts_log
  FOR INSERT WITH CHECK (true);
