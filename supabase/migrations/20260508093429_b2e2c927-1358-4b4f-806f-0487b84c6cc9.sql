DROP TRIGGER IF EXISTS set_team_created_by_trigger ON public.teams;
DROP TRIGGER IF EXISTS teams_after_insert_add_admin ON public.teams;

CREATE OR REPLACE FUNCTION public.set_team_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'teams'
      AND policyname = 'Creators can view created teams'
  ) THEN
    CREATE POLICY "Creators can view created teams"
    ON public.teams
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);
  END IF;
END $$;

CREATE TRIGGER set_team_created_by_trigger
BEFORE INSERT ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.set_team_created_by();

CREATE TRIGGER teams_after_insert_add_admin
AFTER INSERT ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_team();