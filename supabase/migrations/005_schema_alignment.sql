-- ============================================
-- Migration 005: Schema alignment with spec
-- Bridges gaps between initial schema and the
-- definitive database spec document.
-- ============================================

-- ─────────────────────────────────────────────
-- BUSINESSES
-- ─────────────────────────────────────────────

-- owner_name and hipaa_mode added in 004; ensure they exist
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hipaa_mode BOOLEAN DEFAULT FALSE;

-- Spec uses google_account_token JSONB for OAuth tokens.
-- We currently have 3 separate TEXT fields. Add the JSONB column
-- and migrate the existing token data into it.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS google_account_token JSONB;

UPDATE businesses
SET google_account_token = jsonb_build_object(
  'access_token',  google_access_token,
  'refresh_token', google_refresh_token,
  'expiry',        google_token_expiry
)
WHERE google_account_token IS NULL
  AND (google_access_token IS NOT NULL OR google_refresh_token IS NOT NULL);

-- Keep the legacy columns in place for backwards compatibility
-- (the app reads from them today). Drop only after full cutover.

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────

-- Spec calls the date column 'review_date'; we use 'google_created_at'.
-- Add review_date as a generated column that mirrors google_created_at.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS review_date TIMESTAMPTZ
  GENERATED ALWAYS AS (google_created_at) STORED;

-- Spec statuses: unanswered | draft | published | skipped
-- Current CHECK allows: pending | draft | published | skipped
-- Add 'unanswered' and 'needs_review' as valid statuses.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('pending', 'unanswered', 'draft', 'needs_review', 'published', 'skipped', 'auto_published'));

-- ─────────────────────────────────────────────
-- RESPONSES
-- ─────────────────────────────────────────────

-- Spec column name: generated_text (initial AI output).
-- We use draft_text. Add generated_text as a mirror column.
-- 'draft_text' remains the write target for now.
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS generated_text TEXT;

UPDATE responses SET generated_text = draft_text WHERE generated_text IS NULL;

-- Spec column name: generation_model. We use ai_model. Add alias.
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS generation_model TEXT;

UPDATE responses SET generation_model = ai_model WHERE generation_model IS NULL;

-- Spec includes business_id directly on responses for efficient queries.
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- Backfill business_id from the linked review
UPDATE responses r
SET business_id = (
  SELECT rv.business_id FROM reviews rv WHERE rv.id = r.review_id LIMIT 1
)
WHERE r.business_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_responses_business_id ON responses(business_id);

-- Track whether the user edited the AI draft before publishing
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS was_edited BOOLEAN DEFAULT FALSE;

-- confidence_score, variation_score, flags, alternate_versions added in 004
-- Ensure they all exist
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
  ADD COLUMN IF NOT EXISTS variation_score FLOAT,
  ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alternate_versions TEXT[] DEFAULT '{}';

-- Expand status check to include 'needs_review'
ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_status_check;
ALTER TABLE responses
  ADD CONSTRAINT responses_status_check
  CHECK (status IN ('draft', 'editing', 'needs_review', 'published'));

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────

-- Spec uses 'responses_this_month'; we use 'responses_used_this_month'.
-- Add spec column as alias (kept in sync by app logic).
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS responses_this_month INTEGER
  GENERATED ALWAYS AS (responses_used_this_month) STORED;

-- Spec uses 'current_period_end'; we use 'period_end'. Add alias.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ
  GENERATED ALWAYS AS (period_end) STORED;

-- ─────────────────────────────────────────────
-- TRIGGER: auto-set was_edited when final_text differs from draft_text
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_response_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as edited when final_text is set and differs from the AI draft
  IF NEW.final_text IS NOT NULL AND NEW.final_text IS DISTINCT FROM NEW.draft_text THEN
    NEW.was_edited = TRUE;
  END IF;

  -- Mirror draft_text → generated_text on every write (keep in sync)
  IF NEW.generated_text IS NULL OR NEW.generated_text = '' THEN
    NEW.generated_text = NEW.draft_text;
  END IF;

  -- Mirror ai_model → generation_model
  IF NEW.generation_model IS NULL OR NEW.generation_model = '' THEN
    NEW.generation_model = NEW.ai_model;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS responses_edit_tracking ON responses;
CREATE TRIGGER responses_edit_tracking
  BEFORE INSERT OR UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_response_edit();

-- ─────────────────────────────────────────────
-- Additional performance indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_star_rating  ON reviews(star_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date  ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_responses_status     ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_published  ON responses(published_at) WHERE published_at IS NOT NULL;
