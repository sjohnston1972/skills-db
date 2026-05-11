-- Training catalogue + per-resource assignments
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS trainings (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    code          VARCHAR(100),
    vendor        VARCHAR(100),
    category      VARCHAR(100),  -- 'cisco' | 'project-management' | 'cloud' | 'other'
    type          VARCHAR(50) DEFAULT 'certification' CHECK (type IN ('certification', 'course', 'training')),
    description   TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS resource_trainings (
    id              SERIAL PRIMARY KEY,
    resource_id     VARCHAR(50) REFERENCES resources(id) ON DELETE CASCADE,
    training_id     INTEGER     REFERENCES trainings(id) ON DELETE CASCADE,
    status          VARCHAR(20) DEFAULT 'planned'
                    CHECK (status IN ('planned', 'in-progress', 'achieved', 'expired')),
    target_date     DATE,
    completed_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (resource_id, training_id)
);

CREATE INDEX IF NOT EXISTS idx_rt_resource ON resource_trainings(resource_id);
CREATE INDEX IF NOT EXISTS idx_rt_training ON resource_trainings(training_id);
CREATE INDEX IF NOT EXISTS idx_rt_status   ON resource_trainings(status);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillsuser;
