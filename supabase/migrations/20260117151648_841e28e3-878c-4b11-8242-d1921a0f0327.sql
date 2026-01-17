-- Drop all existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create simple non-recursive policies
-- Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- For moderator access to other profiles, we'll handle it in the application layer
-- by using service role or a separate approach