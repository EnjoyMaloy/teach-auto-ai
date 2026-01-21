-- Create function to find course by short ID (first 8 chars of UUID)
CREATE OR REPLACE FUNCTION public.find_course_by_short_id(short_id TEXT)
RETURNS TABLE (
  id UUID,
  is_link_accessible BOOLEAN,
  is_published BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.is_link_accessible, c.is_published
  FROM courses c
  WHERE c.id::text LIKE short_id || '%'
  LIMIT 1;
END;
$$;