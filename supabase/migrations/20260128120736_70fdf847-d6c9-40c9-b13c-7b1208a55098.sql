-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'creator');

-- Create user_roles table (CRITICAL: roles must be in separate table, not in profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create base_design_systems table for admin-managed design systems
CREATE TABLE public.base_design_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on base_design_systems
ALTER TABLE public.base_design_systems ENABLE ROW LEVEL SECURITY;

-- RLS policies for base_design_systems
-- Everyone can view base design systems
CREATE POLICY "Anyone can view base design systems"
ON public.base_design_systems
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert base design systems"
ON public.base_design_systems
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update base design systems"
ON public.base_design_systems
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete base design systems"
ON public.base_design_systems
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_base_design_systems_updated_at
BEFORE UPDATE ON public.base_design_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add base_design_system_id to courses table
ALTER TABLE public.courses
ADD COLUMN base_design_system_id UUID REFERENCES public.base_design_systems(id) ON DELETE SET NULL;

-- Assign admin role to trupcgames@gmail.com (the existing admin)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'trupcgames@gmail.com'
ON CONFLICT DO NOTHING;