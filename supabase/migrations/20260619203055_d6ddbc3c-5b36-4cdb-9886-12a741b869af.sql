DROP POLICY IF EXISTS "Employers can view company employee profiles" ON public.profiles;
CREATE POLICY "Employers can view company employee profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = profiles.company_id
        AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Providers can read selections for own offers" ON public.selections;
CREATE POLICY "Providers can read selections for own offers" ON public.selections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.offers o
      JOIN public.providers p ON p.id = o.provider_id
      WHERE p.owner_id = auth.uid()
        AND o.id = ANY(selections.offer_ids)
    )
  );

UPDATE public.profiles
SET onboarding_complete = true
WHERE role = 'provider'
  AND id IN (SELECT owner_id FROM public.providers);