-- Migration 003: Auto-respond mode and response length preference
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS auto_respond BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS response_length TEXT DEFAULT 'medium' CHECK (response_length IN ('short', 'medium', 'long'));
