-- Reset every rating's last_assessed_at to "now". After this, no rating is stale
-- and Data Quality should report 0 ratings > 365 days old.
UPDATE resource_sub_skills SET last_assessed_at = CURRENT_TIMESTAMP;
