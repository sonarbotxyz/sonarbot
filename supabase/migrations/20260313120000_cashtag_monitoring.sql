-- Add cashtag column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cashtag text;

-- Cashtag mention snapshots from X API
CREATE TABLE IF NOT EXISTS cashtag_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cashtag text NOT NULL,
  tweet_count integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashtag_snapshots_project_time
  ON cashtag_snapshots (project_id, snapshot_at DESC);
