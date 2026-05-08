-- Ensure created_by is always set from current auth user (prevents RLS false negatives)
CREATE OR REPLACE FUNCTION public.set_team_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_team_created_by_trigger ON public.teams;
CREATE TRIGGER set_team_created_by_trigger
  BEFORE INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_team_created_by();

-- Auto-add creator as admin in team_members (function already exists)
DROP TRIGGER IF EXISTS teams_after_insert_add_admin ON public.teams;
CREATE TRIGGER teams_after_insert_add_admin
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_team();