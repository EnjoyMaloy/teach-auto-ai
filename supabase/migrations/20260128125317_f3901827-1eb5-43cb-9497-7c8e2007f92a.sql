-- Create table for user-specific design systems (personal themes)
CREATE TABLE public.user_design_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_design_systems ENABLE ROW LEVEL SECURITY;

-- Users can only view their own themes
CREATE POLICY "Users can view their own themes"
ON public.user_design_systems
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own themes
CREATE POLICY "Users can create their own themes"
ON public.user_design_systems
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own themes
CREATE POLICY "Users can update their own themes"
ON public.user_design_systems
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own themes
CREATE POLICY "Users can delete their own themes"
ON public.user_design_systems
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_design_systems_updated_at
BEFORE UPDATE ON public.user_design_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();