REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, job_title, department, interests, streak_count, last_active_date, onboarding_complete, email, updated_at) ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.provider_contacts (
  provider_id uuid PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.provider_contacts (provider_id, contact_email)
SELECT id, contact_email FROM public.providers WHERE contact_email IS NOT NULL
ON CONFLICT (provider_id) DO NOTHING;

ALTER TABLE public.providers DROP COLUMN IF EXISTS contact_email;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_contacts TO authenticated;
GRANT ALL ON public.provider_contacts TO service_role;
ALTER TABLE public.provider_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages provider contact" ON public.provider_contacts;
CREATE POLICY "Owner manages provider contact" ON public.provider_contacts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_contacts.provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_contacts.provider_id AND p.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Recipient can mark claimed" ON public.transfers;
REVOKE UPDATE ON public.transfers FROM authenticated;
GRANT UPDATE (status) ON public.transfers TO authenticated;
CREATE POLICY "Recipient can mark claimed" ON public.transfers
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_colleagues() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_colleagues() TO authenticated;