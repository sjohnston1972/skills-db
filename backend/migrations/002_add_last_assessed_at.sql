-- Migration 002: Add last_assessed_at to resource_sub_skills for skill freshness tracking.
-- Safe to re-run (uses IF NOT EXISTS).

ALTER TABLE resource_sub_skills
    ADD COLUMN IF NOT EXISTS last_assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill any NULLs (shouldn't be needed because of DEFAULT, but be defensive)
UPDATE resource_sub_skills SET last_assessed_at = CURRENT_TIMESTAMP WHERE last_assessed_at IS NULL;

-- Add an index for "stale skills" queries
CREATE INDEX IF NOT EXISTS idx_rss_last_assessed ON resource_sub_skills(last_assessed_at);
