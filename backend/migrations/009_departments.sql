-- Departments: multi-department support. Additive + idempotent.

CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    accent      VARCHAR(20),
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (slug, name, accent, sort_order) VALUES
    ('projects-team', 'Projects Team', '#00a3ff', 0),
    ('sales',         'Sales',         '#f5a524', 1),
    ('cyber',         'Cyber',         '#10b981', 2),
    ('engineering',   'Engineering',   '#7c5cff', 3)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE resources   ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE main_skills ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE trainings   ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);

UPDATE resources   SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;
UPDATE main_skills SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;
UPDATE trainings   SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;

ALTER TABLE main_skills DROP CONSTRAINT IF EXISTS main_skills_name_key;
ALTER TABLE trainings   DROP CONSTRAINT IF EXISTS trainings_name_key;
ALTER TABLE main_skills ADD CONSTRAINT main_skills_dept_name_key UNIQUE (department_id, name);
ALTER TABLE trainings   ADD CONSTRAINT trainings_dept_name_key   UNIQUE (department_id, name);

CREATE INDEX IF NOT EXISTS idx_resources_dept   ON resources(department_id);
CREATE INDEX IF NOT EXISTS idx_main_skills_dept ON main_skills(department_id);
CREATE INDEX IF NOT EXISTS idx_trainings_dept   ON trainings(department_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillsuser;
