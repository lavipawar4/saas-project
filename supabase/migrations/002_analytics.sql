-- Migration 002: Analytics columns on responses table
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS original_ai_text TEXT,
  ADD COLUMN IF NOT EXISTS edit_distance_pct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_without_edit BOOLEAN DEFAULT FALSE;
