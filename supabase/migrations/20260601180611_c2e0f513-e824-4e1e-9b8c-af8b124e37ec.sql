
-- Drop the overly permissive policy that allowed any authenticated user to read all profiles
DROP POLICY IF EXISTS "Team members can find profiles by email lookup" ON public.profiles;

-- Allow users to view profiles of people who share a team with them
CREATE POLICY "Users can view teammates profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.id
  )
);

-- Secure function for looking up a user id by email (for team invites)
-- Returns only the id, never the rest of the profile row, and only to authenticated callers.
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE lower(email) = lower(trim(_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;
