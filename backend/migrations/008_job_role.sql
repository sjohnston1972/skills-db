-- Add a job_role column to resources for display + filtering.
-- Free-text-ish but the UI presents a fixed dropdown.

ALTER TABLE resources
    ADD COLUMN IF NOT EXISTS job_role VARCHAR(60);

CREATE INDEX IF NOT EXISTS idx_resources_role ON resources(job_role);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
