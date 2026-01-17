-- Drop the existing check constraint and add new one with moderator role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('creator', 'learner', 'admin', 'moderator'));