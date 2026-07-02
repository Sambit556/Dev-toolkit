-- DevChrono JSONLab - Database Schema
-- Only needed if user accounts are enabled

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_unit VARCHAR(20) DEFAULT 'seconds',
    use_24_hour BOOLEAN DEFAULT true,
    default_timezone VARCHAR(100) DEFAULT 'UTC',
    default_date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD HH:mm:ss',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved snippets (optional, encrypted)
CREATE TABLE IF NOT EXISTS saved_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool VARCHAR(20) NOT NULL CHECK (tool IN ('epoch', 'json')),
    title VARCHAR(255),
    content_encrypted TEXT NOT NULL, -- AES-256 encrypted at application level
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_snippets_user_id ON saved_snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_snippets_tool ON saved_snippets(tool);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
