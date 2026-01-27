-- Create admin_settings table for storing AI models and prompts configuration
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy: only trupcgames@gmail.com can access
CREATE POLICY "Only admin can access settings"
  ON public.admin_settings
  FOR ALL
  USING (
    auth.jwt() ->> 'email' = 'trupcgames@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'trupcgames@gmail.com'
  );

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial models configuration
INSERT INTO public.admin_settings (key, value) VALUES
  ('models', '{
    "generate_course": "gemini-2.5-pro",
    "generate_image": "gemini-3-pro-image-preview",
    "subblock_ai_text": "gemini-2.5-flash",
    "subblock_ai_image": "gemini-3-pro-image-preview"
  }'::jsonb);