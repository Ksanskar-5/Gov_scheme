-- =============================================
-- Supabase PostgreSQL Schema for Bharat Scheme Guide
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Schemes Table
-- =============================================
CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    details TEXT,
    benefits TEXT,
    eligibility TEXT,
    application TEXT,
    documents TEXT,
    level TEXT CHECK (level IN ('Central', 'State')),
    category TEXT,
    tags TEXT,
    state TEXT,
    -- Full-text search vector
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for schemes
CREATE INDEX IF NOT EXISTS idx_schemes_slug ON schemes(slug);
CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_state ON schemes(state);
CREATE INDEX IF NOT EXISTS idx_schemes_search ON schemes USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_schemes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.tags, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.benefits, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.eligibility, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.details, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS schemes_search_update ON schemes;
CREATE TRIGGER schemes_search_update
    BEFORE INSERT OR UPDATE ON schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_schemes_search_vector();

-- =============================================
-- User Profiles Table
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT,
    age INTEGER,
    gender TEXT,
    state TEXT,
    district TEXT,
    income_range TEXT,
    profession TEXT,
    category TEXT,
    is_disabled BOOLEAN DEFAULT FALSE,
    is_minority BOOLEAN DEFAULT FALSE,
    is_bpl BOOLEAN DEFAULT FALSE,
    is_student BOOLEAN DEFAULT FALSE,
    is_farmer BOOLEAN DEFAULT FALSE,
    is_business_owner BOOLEAN DEFAULT FALSE,
    is_worker BOOLEAN DEFAULT FALSE,
    is_widow BOOLEAN DEFAULT FALSE,
    is_senior_citizen BOOLEAN DEFAULT FALSE,
    family_size INTEGER,
    education_level TEXT,
    employment_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- User Saved Schemes Table
-- =============================================
CREATE TABLE IF NOT EXISTS user_schemes (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'completed', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_user_schemes_user ON user_schemes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_schemes_scheme ON user_schemes(scheme_id);

-- =============================================
-- Scheme Keywords Table (for weighted search)
-- =============================================
CREATE TABLE IF NOT EXISTS scheme_keywords (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    UNIQUE(scheme_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_scheme_keywords_keyword ON scheme_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_scheme_keywords_scheme ON scheme_keywords(scheme_id);

-- =============================================
-- Helper function for updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
CREATE TRIGGER update_schemes_updated_at
    BEFORE UPDATE ON schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_schemes_updated_at
    BEFORE UPDATE ON user_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
