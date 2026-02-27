-- Migration 004: AI Engine upgrade — add output schema fields to responses table
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS variation_score FLOAT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alternate_versions TEXT[] DEFAULT '{}';

-- Also add owner_name and hipaa_mode to businesses if not present
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hipaa_mode BOOLEAN DEFAULT FALSE;
