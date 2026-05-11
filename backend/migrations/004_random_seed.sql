-- One-off seeding: assign random skill levels to every resource EXCEPT Steven Johnston.
-- Each resource gets a rating on ~45% of sub-skills, levels 1-5 weighted toward 2-3.
-- Steven (eng-020) is left untouched.

-- First, clear ratings for everyone except Steven (so we don't double up where data exists).
DELETE FROM resource_sub_skills
WHERE resource_id <> 'eng-020';

-- Insert random ratings. WHERE RANDOM() < 0.45 gives ~45% coverage.
-- Level distribution: 1 (15%) / 2 (30%) / 3 (30%) / 4 (20%) / 5 (5%).
INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level, last_assessed_at)
SELECT r.id, ss.id,
    CASE
        WHEN RANDOM() < 0.15 THEN 1
        WHEN RANDOM() < 0.45 THEN 2
        WHEN RANDOM() < 0.75 THEN 3
        WHEN RANDOM() < 0.95 THEN 4
        ELSE 5
    END,
    CURRENT_TIMESTAMP - ((RANDOM() * 500)::int || ' days')::interval
FROM resources r
CROSS JOIN sub_skills ss
WHERE r.id <> 'eng-020'
  AND RANDOM() < 0.45
ON CONFLICT (resource_id, sub_skill_id) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillsuser;
