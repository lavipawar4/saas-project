-- ============================================
-- Review Management SaaS - Initial DB Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BUSINESSES (Google Business Profile accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'general',
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual', 'empathetic')),
  keywords TEXT[] DEFAULT '{}',
  google_account_id TEXT,
  google_location_id TEXT,
  google_location_name TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REVIEWS (synced from Google Business Profile)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  google_review_id TEXT UNIQUE NOT NULL,
  reviewer_name TEXT NOT NULL DEFAULT 'Anonymous',
  reviewer_photo_url TEXT,
  star_rating INTEGER NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'draft', 'published', 'skipped')),
  google_created_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RESPONSES (AI-generated response drafts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL UNIQUE,
  draft_text TEXT NOT NULL,
  final_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'published')),
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  generation_count INTEGER NOT NULL DEFAULT 1,
  similarity_score FLOAT,
  qa_passed BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS (Stripe subscription tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  responses_used_this_month INTEGER NOT NULL DEFAULT 0,
  responses_limit INTEGER NOT NULL DEFAULT 10,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses: users can CRUD their own businesses
CREATE POLICY "Users can manage own businesses" ON public.businesses FOR ALL USING (auth.uid() = user_id);

-- Reviews: users can manage reviews for their businesses
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = reviews.business_id AND businesses.user_id = auth.uid())
);

-- Responses: users can manage responses for their reviews
CREATE POLICY "Users can manage own responses" ON public.responses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.reviews
    JOIN public.businesses ON businesses.id = reviews.business_id
    WHERE reviews.id = responses.review_id AND businesses.user_id = auth.uid()
  )
);

-- Subscriptions: users can view their own
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL USING (TRUE);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  
  INSERT INTO public.subscriptions (user_id, plan, responses_limit)
  VALUES (NEW.id, 'free', 10);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER responses_updated_at BEFORE UPDATE ON public.responses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_responses_review_id ON public.responses(review_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
-- Migration 002: Analytics columns on responses table
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS original_ai_text TEXT,
  ADD COLUMN IF NOT EXISTS edit_distance_pct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_without_edit BOOLEAN DEFAULT FALSE;
-- Migration 003: Auto-respond mode and response length preference
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS auto_respond BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS response_length TEXT DEFAULT 'medium' CHECK (response_length IN ('short', 'medium', 'long'));
-- Migration 004: AI Engine upgrade â€” add output schema fields to responses table
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS variation_score FLOAT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alternate_versions TEXT[] DEFAULT '{}';

-- Also add owner_name and hipaa_mode to businesses if not present
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hipaa_mode BOOLEAN DEFAULT FALSE;
-- ============================================
-- Migration 005: Schema alignment with spec
-- Bridges gaps between initial schema and the
-- definitive database spec document.
-- ============================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- BUSINESSES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- REVIEWS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- RESPONSES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SUBSCRIPTIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Spec uses 'responses_this_month'; we use 'responses_used_this_month'.
-- Add spec column as alias (kept in sync by app logic).
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS responses_this_month INTEGER
  GENERATED ALWAYS AS (responses_used_this_month) STORED;

-- Spec uses 'current_period_end'; we use 'period_end'. Add alias.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ
  GENERATED ALWAYS AS (period_end) STORED;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- TRIGGER: auto-set was_edited when final_text differs from draft_text
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.handle_response_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as edited when final_text is set and differs from the AI draft
  IF NEW.final_text IS NOT NULL AND NEW.final_text IS DISTINCT FROM NEW.draft_text THEN
    NEW.was_edited = TRUE;
  END IF;

  -- Mirror draft_text â†’ generated_text on every write (keep in sync)
  IF NEW.generated_text IS NULL OR NEW.generated_text = '' THEN
    NEW.generated_text = NEW.draft_text;
  END IF;

  -- Mirror ai_model â†’ generation_model
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

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Additional performance indexes
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_reviews_star_rating  ON reviews(star_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date  ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_responses_status     ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_published  ON responses(published_at) WHERE published_at IS NOT NULL;
