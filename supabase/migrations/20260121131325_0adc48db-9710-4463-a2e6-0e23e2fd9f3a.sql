-- Remove hotspot-related columns from slides table
ALTER TABLE public.slides DROP COLUMN IF EXISTS hotspot_areas;