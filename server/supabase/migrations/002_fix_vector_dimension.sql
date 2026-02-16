-- ================================================
-- Vector Search Setup - NO INDEX (for any dimension)
-- Works with Supabase's pgvector without index limits
-- ================================================

-- Drop old column if exists
ALTER TABLE public.schemes DROP COLUMN IF EXISTS embedding;

-- Add column with 2000 dimensions (no index = no limit enforced)
ALTER TABLE public.schemes ADD COLUMN embedding vector(2000);

-- Drop any existing index (we'll skip indexing for now)
DROP INDEX IF EXISTS schemes_embedding_idx;

-- Search function using exact search (fast enough for <10k records)
CREATE OR REPLACE FUNCTION search_schemes_by_vector(
    query_embedding vector(2000),
    match_count integer DEFAULT 10,
    filter_state text DEFAULT NULL,
    filter_category text DEFAULT NULL,
    filter_level text DEFAULT NULL
)
RETURNS TABLE (
    id integer,
    name text,
    slug text,
    details text,
    benefits text,
    eligibility text,
    application text,
    documents text,
    level text,
    category text,
    tags text,
    state text,
    created_at timestamptz,
    updated_at timestamptz,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.slug,
        s.details,
        s.benefits,
        s.eligibility,
        s.application,
        s.documents,
        s.level,
        s.category,
        s.tags,
        s.state,
        s.created_at,
        s.updated_at,
        1 - (s.embedding <=> query_embedding) as similarity
    FROM public.schemes s
    WHERE s.embedding IS NOT NULL
        AND (filter_state IS NULL OR s.state = filter_state)
        AND (filter_category IS NULL OR s.category = filter_category)
        AND (filter_level IS NULL OR s.level = filter_level)
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

SELECT 'Vector column created (2000 dims, no index - exact search)' as status;
