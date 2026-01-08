-- RecruitOS Enhanced Scoring & Persona Migration
-- This migration adds support for:
-- 1. Enhanced score reasoning (confidence, drivers, drags)
-- 2. Persona data
-- 3. Company match analysis
-- 4. Raw profile text storage

-- Run this SQL in your Supabase SQL Editor to add the new columns

-- Add enhanced scoring fields
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS score_confidence TEXT CHECK (score_confidence IN ('high', 'moderate', 'low')),
ADD COLUMN IF NOT EXISTS score_drivers TEXT[],
ADD COLUMN IF NOT EXISTS score_drags TEXT[];

-- Add persona JSON field
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS persona JSONB;

-- Add company match JSON field
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS company_match JSONB;

-- Add raw profile text for reference
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS raw_profile_text TEXT;

-- Add comments for documentation
COMMENT ON COLUMN candidates.score_confidence IS 'Confidence level of the AI scoring based on data completeness: high, moderate, or low';
COMMENT ON COLUMN candidates.score_drivers IS 'Array of top factors boosting the candidate score (e.g., ["skills", "experience"])';
COMMENT ON COLUMN candidates.score_drags IS 'Array of factors pulling the candidate score down (e.g., ["location", "industry"])';
COMMENT ON COLUMN candidates.persona IS 'Psychometric persona analysis including archetype, communication style, motivations, flags';
COMMENT ON COLUMN candidates.company_match IS 'Company culture fit analysis with score, strengths, and friction points';
COMMENT ON COLUMN candidates.raw_profile_text IS 'Original profile text from LinkedIn or resume for reference';

-- Example persona structure:
-- {
--   "archetype": "The Strategic Scaler",
--   "psychometric": {
--     "communicationStyle": "Data-driven and direct",
--     "primaryMotivator": "Impact and growth",
--     "riskTolerance": "High",
--     "leadershipPotential": "Strong"
--   },
--   "softSkills": ["Strategic thinking", "Cross-functional leadership"],
--   "redFlags": ["Job hopping pattern"],
--   "greenFlags": ["Consistent promotion trajectory", "Mentorship experience"],
--   "reasoning": "Evidence shows..."
-- }

-- Example company_match structure:
-- {
--   "score": 85,
--   "analysis": "Strong cultural alignment with startup environment...",
--   "strengths": ["Thrives in fast-paced environments", "Collaborative mindset"],
--   "potentialFriction": ["Used to large corporate budgets"]
-- }

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'candidates'
AND column_name IN ('score_confidence', 'score_drivers', 'score_drags', 'persona', 'company_match', 'raw_profile_text');
