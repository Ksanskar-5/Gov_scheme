-- ============================================
-- Vector Search Migration for Supabase
-- ============================================
-- Run this in your Supabase SQL Editor
-- This is SAFE for live database - only adds new columns/functions

-- Step 1: Enable pgvector extension
-- (Supabase has this built-in, just enable it)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column to schemes table
-- Using 768 dimensions (Gemini embedding size)
ALTER TABLE public.schemes 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Step 3: Create index for fast similarity search
-- Using IVFFlat for better performance on larger datasets
CREATE INDEX IF NOT EXISTS schemes_embedding_idx 
ON public.schemes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Create the semantic search function
CREATE OR REPLACE FUNCTION search_schemes_by_vector(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_state text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  filter_level text DEFAULT NULL
)
RETURNS TABLE (
  id int,
  name text,
  slug text,
  details text,
  benefits text,
  eligibility text,
  application text,
  documents text,
  category text,
  state text,
  level text,
  tags text,
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
    s.category,
    s.state,
    s.level,
    s.tags,
    (1 - (s.embedding <=> query_embedding))::float as similarity
  FROM public.schemes s
  WHERE 
    s.embedding IS NOT NULL
    AND (filter_state IS NULL OR s.state = filter_state OR s.level = 'Central')
    AND (filter_category IS NULL OR s.category ILIKE '%' || filter_category || '%')
    AND (filter_level IS NULL OR s.level = filter_level)
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Step 5: Create helper function to check if embeddings exist
CREATE OR REPLACE FUNCTION get_schemes_without_embeddings()
RETURNS TABLE (id int, name text)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name 
  FROM public.schemes 
  WHERE embedding IS NULL
  ORDER BY id;
$$;

-- Step 6: Grant permissions (adjust role name if needed)
GRANT EXECUTE ON FUNCTION search_schemes_by_vector TO authenticated;
GRANT EXECUTE ON FUNCTION search_schemes_by_vector TO anon;
GRANT EXECUTE ON FUNCTION get_schemes_without_embeddings TO authenticated;

-- ============================================
-- Verification Query (run after migration)
-- ============================================
-- SELECT 
--   (SELECT COUNT(*) FROM public.schemes) as total_schemes,
--   (SELECT COUNT(*) FROM public.schemes WHERE embedding IS NOT NULL) as with_embeddings;
