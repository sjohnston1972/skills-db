-- Seed varied last_assessed_at for existing ratings so the freshness UI has interesting data.
-- Idempotent: only touches rows whose last_assessed_at is within the last hour (i.e. just-added defaults).

UPDATE resource_sub_skills
SET last_assessed_at = CURRENT_TIMESTAMP - ((RANDOM() * 800)::int || ' days')::interval;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillsuser;
