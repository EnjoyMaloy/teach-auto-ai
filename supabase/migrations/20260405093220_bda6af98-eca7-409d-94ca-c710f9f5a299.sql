
-- Add access_type column
ALTER TABLE public.articles
ADD COLUMN access_type text NOT NULL DEFAULT 'private';

-- Allow anyone to view public/link-accessible articles
CREATE POLICY "Anyone can view accessible articles"
ON public.articles
FOR SELECT
USING (access_type IN ('public', 'link'));
