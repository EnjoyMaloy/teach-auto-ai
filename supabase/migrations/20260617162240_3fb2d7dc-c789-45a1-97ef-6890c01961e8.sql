
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS description_ru text,
  ADD COLUMN IF NOT EXISTS description_en text;

UPDATE public.teams
  SET description_ru = description
  WHERE description_ru IS NULL AND description IS NOT NULL;
