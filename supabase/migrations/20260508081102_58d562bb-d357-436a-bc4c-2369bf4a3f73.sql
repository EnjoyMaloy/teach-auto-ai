
-- Enum for team roles
CREATE TYPE public.team_role AS ENUM ('admin', 'member');

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.team_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);

-- Add team_id to courses and articles
ALTER TABLE public.courses ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.articles ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX idx_courses_team ON public.courses(team_id);
CREATE INDEX idx_articles_team ON public.articles(team_id);

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id AND role = 'admin'
  )
$$;

-- Trigger: creator becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view their teams"
  ON public.teams FOR SELECT TO authenticated
  USING (public.is_team_member(id, auth.uid()));

CREATE POLICY "Admins can update team"
  ON public.teams FOR UPDATE TO authenticated
  USING (public.is_team_admin(id, auth.uid()));

CREATE POLICY "Admins can delete team"
  ON public.teams FOR DELETE TO authenticated
  USING (public.is_team_admin(id, auth.uid()));

-- RLS: team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team roster"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Admins can add members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can update members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can remove members or self leave"
  ON public.team_members FOR DELETE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid());

-- Update courses RLS to include team access
DROP POLICY IF EXISTS "Users can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;

CREATE POLICY "Users can view own or team courses"
  ON public.courses FOR SELECT TO authenticated
  USING (auth.uid() = author_id OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE POLICY "Users can insert own or team courses"
  ON public.courses FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (team_id IS NULL OR public.is_team_member(team_id, auth.uid()))
  );

CREATE POLICY "Users can update own or team courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE POLICY "Authors or team admins can delete courses"
  ON public.courses FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id, auth.uid())));

-- Update articles RLS
DROP POLICY IF EXISTS "Users can CRUD own articles" ON public.articles;

CREATE POLICY "Users can view own or team articles"
  ON public.articles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE POLICY "Users can insert own or team articles"
  ON public.articles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (team_id IS NULL OR public.is_team_member(team_id, auth.uid()))
  );

CREATE POLICY "Users can update own or team articles"
  ON public.articles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));

CREATE POLICY "Authors or team admins can delete articles"
  ON public.articles FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (team_id IS NOT NULL AND public.is_team_admin(team_id, auth.uid())));

-- Allow team members to look up profiles by email (for adding members)
CREATE POLICY "Team members can find profiles by email lookup"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
