-- Add expiry_date to resource_trainings so achieved certs can record when they lapse.
ALTER TABLE resource_trainings
    ADD COLUMN IF NOT EXISTS expiry_date DATE;

CREATE INDEX IF NOT EXISTS idx_rt_expiry ON resource_trainings(expiry_date);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
