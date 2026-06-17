
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE UNIQUE INDEX team_invitations_unique_pending
  ON public.team_invitations (team_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX team_invitations_email_idx ON public.team_invitations (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Team admins can see invitations for their team
CREATE POLICY "Admins see team invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- Invitee can see their own invitations
CREATE POLICY "Invitee sees own invitations"
  ON public.team_invitations FOR SELECT TO authenticated
  USING (lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid())));

-- Admins create invitations
CREATE POLICY "Admins create invitations"
  ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_team_admin(team_id, auth.uid()) AND invited_by = auth.uid());

-- Admins can cancel/delete invitations for their team
CREATE POLICY "Admins delete invitations"
  ON public.team_invitations FOR DELETE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- Invitee can update (accept/decline) their own pending invitation
CREATE POLICY "Invitee responds to invitation"
  ON public.team_invitations FOR UPDATE TO authenticated
  USING (lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid())));

CREATE TRIGGER team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: accept invitation (atomically creates team_member and marks accepted)
CREATE OR REPLACE FUNCTION public.accept_team_invitation(_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_invitation public.team_invitations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();

  SELECT * INTO v_invitation FROM public.team_invitations
    WHERE id = _invitation_id AND status = 'pending'
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Приглашение не найдено или уже обработано';
  END IF;

  IF lower(v_invitation.email) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'Это приглашение адресовано другому пользователю';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_invitation.team_id, auth.uid(), v_invitation.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.team_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = _invitation_id;

  RETURN v_invitation.team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_team_invitation(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM public.profiles WHERE id = auth.uid();

  UPDATE public.team_invitations
    SET status = 'declined', responded_at = now()
    WHERE id = _invitation_id
      AND status = 'pending'
      AND lower(email) = lower(v_user_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Приглашение не найдено';
  END IF;
END;
$$;
