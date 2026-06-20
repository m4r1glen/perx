
-- ============== 1. profiles.company_status ==============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_status text NOT NULL DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_company_status_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_company_status_chk
      CHECK (company_status IN ('none','pending','active'));
  END IF;
END$$;

-- Backfill: existing employees with a company_id are active
UPDATE public.profiles
   SET company_status = 'active'
 WHERE company_id IS NOT NULL AND company_status = 'none';

-- ============== 2. company_invitations ==============
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','revoked','expired')),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);
CREATE INDEX IF NOT EXISTS company_invitations_company_idx ON public.company_invitations(company_id);
CREATE INDEX IF NOT EXISTS company_invitations_email_idx ON public.company_invitations(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invitations TO authenticated;
GRANT ALL ON public.company_invitations TO service_role;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages invitations" ON public.company_invitations;
CREATE POLICY "Owner manages invitations" ON public.company_invitations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_invitations.company_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_invitations.company_id AND c.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Invitee can read own invitation" ON public.company_invitations;
CREATE POLICY "Invitee can read own invitation" ON public.company_invitations
  FOR SELECT TO authenticated
  USING (lower(email) = lower(COALESCE((SELECT email FROM public.profiles WHERE id = auth.uid()), '')));

-- ============== 3. company_join_requests ==============
CREATE TABLE IF NOT EXISTS public.company_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS join_requests_company_idx ON public.company_join_requests(company_id);
CREATE INDEX IF NOT EXISTS join_requests_employee_idx ON public.company_join_requests(employee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_join_requests TO authenticated;
GRANT ALL ON public.company_join_requests TO service_role;
ALTER TABLE public.company_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employee manages own join requests" ON public.company_join_requests;
CREATE POLICY "Employee manages own join requests" ON public.company_join_requests
  FOR ALL TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "Owner manages company join requests" ON public.company_join_requests;
CREATE POLICY "Owner manages company join requests" ON public.company_join_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_join_requests.company_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_join_requests.company_id AND c.owner_id = auth.uid()));

-- Allow employer admins to read profiles of users who have requested to join
DROP POLICY IF EXISTS "Owners can view applicant profiles" ON public.profiles;
CREATE POLICY "Owners can view applicant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM public.company_join_requests r
      JOIN public.companies c ON c.id = r.company_id
     WHERE r.employee_id = profiles.id
       AND c.owner_id = auth.uid()
  ));

-- Allow listing companies by name for the join-request picker (public-safe fields read by authenticated users only via existing select policy isn't broad). Add a narrow SELECT for authenticated.
DROP POLICY IF EXISTS "Authenticated can browse companies" ON public.companies;
CREATE POLICY "Authenticated can browse companies" ON public.companies
  FOR SELECT TO authenticated USING (true);

-- ============== 4. Helper functions ==============
CREATE OR REPLACE FUNCTION public.request_join_company(_company_id uuid, _message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _req uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Idempotent: if a pending request already exists, return it
  SELECT id INTO _req FROM public.company_join_requests
    WHERE employee_id = _uid AND company_id = _company_id AND status = 'pending'
    LIMIT 1;
  IF _req IS NOT NULL THEN
    RETURN _req;
  END IF;

  INSERT INTO public.company_join_requests(company_id, employee_id, message)
    VALUES (_company_id, _uid, NULLIF(_message, ''))
    RETURNING id INTO _req;

  UPDATE public.profiles SET company_status = 'pending' WHERE id = _uid AND company_id IS NULL;
  RETURN _req;
END$$;

CREATE OR REPLACE FUNCTION public.approve_join_request(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _req record;
BEGIN
  SELECT r.* INTO _req FROM public.company_join_requests r WHERE r.id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _req.company_id AND c.owner_id = _uid) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.company_join_requests
     SET status='approved', decided_at=now(), decided_by=_uid
   WHERE id=_request_id;

  UPDATE public.profiles
     SET company_id=_req.company_id, company_status='active'
   WHERE id=_req.employee_id;
END$$;

CREATE OR REPLACE FUNCTION public.reject_join_request(_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _req record;
BEGIN
  SELECT r.* INTO _req FROM public.company_join_requests r WHERE r.id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _req.company_id AND c.owner_id = _uid) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.company_join_requests SET status='rejected', decided_at=now(), decided_by=_uid WHERE id=_request_id;
  UPDATE public.profiles SET company_status='none'
     WHERE id=_req.employee_id AND company_id IS NULL;
END$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _inv record; _email text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT email INTO _email FROM public.profiles WHERE id=_uid;

  SELECT * INTO _inv FROM public.company_invitations
    WHERE token = _token AND status='pending' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired invitation'; END IF;

  IF lower(_inv.email) <> lower(COALESCE(_email,'')) THEN
    RAISE EXCEPTION 'Invitation is for a different email';
  END IF;

  UPDATE public.company_invitations SET status='accepted' WHERE id=_inv.id;
  UPDATE public.profiles
     SET company_id=_inv.company_id, company_status='active'
   WHERE id=_uid;
  RETURN _inv.company_id;
END$$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_invitation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  UPDATE public.company_invitations SET status='revoked'
   WHERE id=_invitation_id
     AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_invitations.company_id AND c.owner_id = _uid);
END$$;

CREATE OR REPLACE FUNCTION public.remove_employee(_employee_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _employee_id AND c.owner_id = _uid
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;

  UPDATE public.profiles
     SET company_id = NULL, company_status = 'none'
   WHERE id = _employee_id;
END$$;

GRANT EXECUTE ON FUNCTION public.request_join_company(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_employee(uuid) TO authenticated;

-- ============== 5. Seed: applicants (auth.users + profiles) ==============
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  -- DigitalNova applicants
  ('00000000-0000-0000-0000-000000000000','aaa11111-0000-0000-0000-000000000001','authenticated','authenticated','jona.b@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Jona Berisha","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaa11111-0000-0000-0000-000000000002','authenticated','authenticated','andi.k@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Andi Kola","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaa11111-0000-0000-0000-000000000003','authenticated','authenticated','vesa.s@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Vesa Shahini","role":"employee"}',now(),now()),
  -- Adriatik Bank applicants
  ('00000000-0000-0000-0000-000000000000','aaa22222-0000-0000-0000-000000000001','authenticated','authenticated','blerim.p@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Blerim Prifti","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaa22222-0000-0000-0000-000000000002','authenticated','authenticated','enkela.t@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Enkela Tafa","role":"employee"}',now(),now()),
  -- Kafe Flora applicants
  ('00000000-0000-0000-0000-000000000000','aaa33333-0000-0000-0000-000000000001','authenticated','authenticated','redon.l@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Redon Lleshi","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','aaa33333-0000-0000-0000-000000000002','authenticated','authenticated','arta.gj@gmail.com',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Arta Gjoka","role":"employee"}',now(),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, job_title, department, interests, onboarding_complete, company_status)
VALUES
  ('aaa11111-0000-0000-0000-000000000001','jona.b@gmail.com','Jona Berisha','employee','Frontend Engineer','engineering',ARRAY['fitness','learning'],true,'pending'),
  ('aaa11111-0000-0000-0000-000000000002','andi.k@gmail.com','Andi Kola','employee','Sales Lead','sales',ARRAY['food','travel'],true,'pending'),
  ('aaa11111-0000-0000-0000-000000000003','vesa.s@gmail.com','Vesa Shahini','employee','Data Analyst','engineering',ARRAY['wellness','food'],true,'pending'),
  ('aaa22222-0000-0000-0000-000000000001','blerim.p@gmail.com','Blerim Prifti','employee','Credit Analyst','operations',ARRAY['fitness','health'],true,'pending'),
  ('aaa22222-0000-0000-0000-000000000002','enkela.t@gmail.com','Enkela Tafa','employee','Branch Manager','operations',ARRAY['travel','wellness'],true,'pending'),
  ('aaa33333-0000-0000-0000-000000000001','redon.l@gmail.com','Redon Lleshi','employee','Barista','operations',ARRAY['food','learning'],true,'pending'),
  ('aaa33333-0000-0000-0000-000000000002','arta.gj@gmail.com','Arta Gjoka','employee','Shift Supervisor','operations',ARRAY['food','wellness'],true,'pending')
ON CONFLICT (id) DO NOTHING;

-- Pending join requests
INSERT INTO public.company_join_requests (id, company_id, employee_id, status, message, created_at)
VALUES
  ('11aa1111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','aaa11111-0000-0000-0000-000000000001','pending','Sapo nisa punën në DigitalNova — më shtoni te ekipi, ju lutem!', now() - interval '2 days'),
  ('11aa1111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','aaa11111-0000-0000-0000-000000000002','pending','Punoj në shitje, do doja akses te benefitet.', now() - interval '1 days'),
  ('11aa1111-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','aaa11111-0000-0000-0000-000000000003','pending',NULL, now() - interval '6 hours'),
  ('11aa2222-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','aaa22222-0000-0000-0000-000000000001','pending','HR më tha të aplikoja këtu.', now() - interval '3 days'),
  ('11aa2222-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','aaa22222-0000-0000-0000-000000000002','pending','Drejtoj degën në Vlorë.', now() - interval '12 hours'),
  ('11aa3333-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003','aaa33333-0000-0000-0000-000000000001','pending','Punoj te lokali i ri.', now() - interval '4 hours'),
  ('11aa3333-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000003','aaa33333-0000-0000-0000-000000000002','pending',NULL, now() - interval '20 hours')
ON CONFLICT (id) DO NOTHING;

-- Pending invitations
INSERT INTO public.company_invitations (id, company_id, email, invited_by, status, token, created_at, expires_at)
VALUES
  ('22bb1111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','marsida.h@gmail.com','11111111-1111-1111-1111-111111111111','pending','demoinvitedna01marsida', now() - interval '3 days', now() + interval '11 days'),
  ('22bb1111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','genti.r@gmail.com','11111111-1111-1111-1111-111111111111','pending','demoinvitedna02genti', now() - interval '1 days', now() + interval '13 days'),
  ('22bb2222-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002','luan.b@gmail.com','11111111-1111-1111-1111-111111111112','pending','demoinviteab01luan', now() - interval '2 days', now() + interval '12 days'),
  ('22bb2222-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002','enxhi.k@gmail.com','11111111-1111-1111-1111-111111111112','pending','demoinviteab02enxhi', now() - interval '5 hours', now() + interval '14 days'),
  ('22bb3333-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000003','sara.m@gmail.com','11111111-1111-1111-1111-111111111113','pending','demoinvitekf01sara', now() - interval '1 days', now() + interval '13 days'),
  ('22bb3333-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000003','blendi.k@gmail.com','11111111-1111-1111-1111-111111111113','pending','demoinvitekf02blendi', now() - interval '6 hours', now() + interval '14 days')
ON CONFLICT (id) DO NOTHING;
