-- Skills Matrix Database Schema

-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS resource_sub_skills CASCADE;
DROP TABLE IF EXISTS sub_skills CASCADE;
DROP TABLE IF EXISTS main_skills CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS metadata CASCADE;

-- Resources (Engineers/Team Members)
CREATE TABLE resources (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_name ON resources(name);

-- Main Skills (Categories like "JavaScript", "Project Management", etc.)
CREATE TABLE main_skills (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sub Skills (Detailed skills under each main skill)
CREATE TABLE sub_skills (
    id SERIAL PRIMARY KEY,
    main_skill_id VARCHAR(50) REFERENCES main_skills(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE(main_skill_id, name)
);

CREATE INDEX idx_sub_skills_main ON sub_skills(main_skill_id);

-- Resource Sub-Skill Levels (Junction table with proficiency levels)
CREATE TABLE resource_sub_skills (
    id SERIAL PRIMARY KEY,
    resource_id VARCHAR(50) REFERENCES resources(id) ON DELETE CASCADE,
    sub_skill_id INTEGER REFERENCES sub_skills(id) ON DELETE CASCADE,
    level INTEGER CHECK (level >= 0 AND level <= 5),
    UNIQUE(resource_id, sub_skill_id)
);

CREATE INDEX idx_resource_skills ON resource_sub_skills(resource_id);
CREATE INDEX idx_sub_skill_resources ON resource_sub_skills(sub_skill_id);

-- Metadata (for storing app-level settings, last updated, etc.)
CREATE TABLE metadata (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial metadata
INSERT INTO metadata (key, value, updated_at) VALUES
('last_updated', CURRENT_TIMESTAMP::TEXT, CURRENT_TIMESTAMP),
('version', '1.0', CURRENT_TIMESTAMP);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on resources
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update metadata timestamp
CREATE TRIGGER update_metadata_updated_at BEFORE UPDATE ON metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_main_skills_name ON main_skills(name);
CREATE INDEX idx_sub_skills_name ON sub_skills(name);
