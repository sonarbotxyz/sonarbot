-- 002_watch_subscribe.sql
-- Phase 3: Watch & Subscribe system
-- Creates watches, alert_preferences, signals, notifications, telegram_links

-- ============================================================
-- 1. Watches — user watches a project
-- ============================================================
CREATE TABLE IF NOT EXISTS watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_watches_user ON watches (user_id);
CREATE INDEX IF NOT EXISTS idx_watches_project ON watches (project_id);

-- ============================================================
-- 2. Alert preferences — per-project per-user alert settings
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metrics_milestones BOOLEAN DEFAULT true,
  new_features_launches BOOLEAN DEFAULT true,
  partnerships_integrations BOOLEAN DEFAULT false,
  all_updates BOOLEAN DEFAULT false,
  token_events BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- ============================================================
-- 3. Signals — unified signal storage
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('metrics_milestones','new_features_launches','partnerships_integrations','all_updates','token_events')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  metric_previous NUMERIC,
  confidence TEXT DEFAULT 'high',
  is_published BOOLEAN DEFAULT true,
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_project_time ON signals (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_type_time ON signals (type, created_at DESC);

-- ============================================================
-- 4. Notifications — per-user notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sent_via TEXT DEFAULT 'in_app',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_time ON notifications (user_id, created_at DESC);

-- ============================================================
-- 5. Telegram links — link telegram chat to user account
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL UNIQUE,
  linked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Trigger: Auto-update projects.watchers on watch insert/delete
-- ============================================================
CREATE OR REPLACE FUNCTION update_project_watchers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET watchers = COALESCE(watchers, 0) + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET watchers = GREATEST(COALESCE(watchers, 0) - 1, 0) WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_watchers
  AFTER INSERT OR DELETE ON watches
  FOR EACH ROW
  EXECUTE FUNCTION update_project_watchers_count();

-- ============================================================
-- 7. Enable RLS
-- ============================================================
ALTER TABLE watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_links ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- Watches: public read, service role insert/delete
CREATE POLICY watches_select ON watches FOR SELECT USING (true);
CREATE POLICY watches_insert ON watches FOR INSERT WITH CHECK (true);
CREATE POLICY watches_delete ON watches FOR DELETE USING (true);

-- Alert preferences: public read, service role insert/update
CREATE POLICY alert_preferences_select ON alert_preferences FOR SELECT USING (true);
CREATE POLICY alert_preferences_insert ON alert_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY alert_preferences_update ON alert_preferences FOR UPDATE USING (true);

-- Signals: public read, service role insert
CREATE POLICY signals_select ON signals FOR SELECT USING (true);
CREATE POLICY signals_insert ON signals FOR INSERT WITH CHECK (true);

-- Notifications: public read, service role insert/update
CREATE POLICY notifications_select ON notifications FOR SELECT USING (true);
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (true);

-- Telegram links: public read, service role insert/delete
CREATE POLICY telegram_links_select ON telegram_links FOR SELECT USING (true);
CREATE POLICY telegram_links_insert ON telegram_links FOR INSERT WITH CHECK (true);
CREATE POLICY telegram_links_delete ON telegram_links FOR DELETE USING (true);
