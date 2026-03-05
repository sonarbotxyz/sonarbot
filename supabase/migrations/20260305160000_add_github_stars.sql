-- Add github_stars column to social_snapshots
-- Tracks GitHub star count per snapshot for trend analysis

ALTER TABLE social_snapshots
  ADD COLUMN IF NOT EXISTS github_stars INTEGER DEFAULT 0;
