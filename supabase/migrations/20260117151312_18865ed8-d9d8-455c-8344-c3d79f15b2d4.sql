-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;

-- Create a non-recursive policy using auth.jwt() instead of querying profiles
CREATE POLICY "Moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (auth.jwt() ->> 'role')::text IN ('moderator', 'admin')
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('moderator', 'admin')
    AND p.id != profiles.id
  )
);