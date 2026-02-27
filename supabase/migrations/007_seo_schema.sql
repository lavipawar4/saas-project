-- Add location_city to businesses for local SEO
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS location_city TEXT DEFAULT '';

-- Update the RLS policy if needed (usually covered by existing business-level policies)
-- No changes needed to RLS if it's already using user_id.
