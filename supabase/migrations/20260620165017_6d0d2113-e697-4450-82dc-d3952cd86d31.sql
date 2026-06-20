
ALTER TABLE public.points_ledger
  ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS points_ledger_employee_idx ON public.points_ledger(employee_id);
CREATE INDEX IF NOT EXISTS points_ledger_company_idx ON public.points_ledger(company_id);

-- Tighten insert policy: employer can only insert POSITIVE deltas for employees of their own company.
-- Negative deltas (spending, gifting) go through SECURITY DEFINER functions that bypass RLS.
DROP POLICY IF EXISTS "Employer grants points" ON public.points_ledger;
CREATE POLICY "Employer grants points" ON public.points_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    delta > 0
    AND public.is_employer_of(employee_id)
  );

-- Secure RPC for granting points from the employer dashboard.
CREATE OR REPLACE FUNCTION public.grant_points(
  _employee_id uuid,
  _amount integer,
  _reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _company uuid;
  _target_company uuid;
  _row_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive integer';
  END IF;
  IF _amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds the maximum allowed (1,000,000)';
  END IF;
  IF _reason IS NULL OR length(btrim(_reason)) = 0 THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  -- Caller must own a company; target must belong to that company.
  SELECT c.id INTO _company
    FROM public.companies c
   WHERE c.owner_id = _uid
   LIMIT 1;
  IF _company IS NULL THEN
    RAISE EXCEPTION 'Only an employer admin can grant points';
  END IF;

  SELECT p.company_id INTO _target_company
    FROM public.profiles p
   WHERE p.id = _employee_id;
  IF _target_company IS NULL OR _target_company <> _company THEN
    RAISE EXCEPTION 'Employee is not part of your company';
  END IF;

  INSERT INTO public.points_ledger(employee_id, delta, reason, granted_by, company_id)
  VALUES (_employee_id, _amount, btrim(_reason), _uid, _company)
  RETURNING id INTO _row_id;

  RETURN _row_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) TO authenticated;
