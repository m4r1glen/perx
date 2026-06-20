-- Harden benefit approval/payment for the hackathon demo.
-- Clients may create selections, but status/payment transitions happen here.

DROP POLICY IF EXISTS "Employee updates own selections" ON public.selections;
REVOKE UPDATE ON public.selections FROM authenticated;

CREATE OR REPLACE FUNCTION public.approve_and_pay_selection(
  _selection_id uuid,
  _simulate_payment boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _company_id uuid;
  _per_employee_budget integer;
  _employee_count integer;
  _selection record;
  _company_monthly_cap bigint;
  _company_paid_this_month bigint;
  _reward integer;
  _points_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT c.id, c.monthly_budget_per_employee_lek, c.employee_count
    INTO _company_id, _per_employee_budget, _employee_count
    FROM public.companies c
   WHERE c.owner_id = _uid
   LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Only an employer admin can approve selections';
  END IF;

  SELECT
    s.id,
    s.employee_id,
    s.offer_ids,
    s.total_l,
    s.status,
    p.company_id
    INTO _selection
    FROM public.selections s
    JOIN public.profiles p ON p.id = s.employee_id
   WHERE s.id = _selection_id
   FOR UPDATE OF s;

  IF _selection.id IS NULL THEN
    RAISE EXCEPTION 'Selection not found';
  END IF;

  IF _selection.company_id IS NULL OR _selection.company_id <> _company_id THEN
    RAISE EXCEPTION 'Selection does not belong to your company';
  END IF;

  IF _selection.status = 'paid' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'selection_id', _selection.id,
      'status', 'paid',
      'already_paid', true
    );
  END IF;

  IF _selection.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Selection cannot be approved from status %', _selection.status;
  END IF;

  IF _selection.total_l IS NULL OR _selection.total_l <= 0 THEN
    RAISE EXCEPTION 'Selection total must be positive';
  END IF;

  IF _selection.offer_ids IS NULL OR array_length(_selection.offer_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Selection must contain at least one offer';
  END IF;

  IF _per_employee_budget IS NOT NULL AND _per_employee_budget > 0
     AND _selection.total_l > _per_employee_budget THEN
    RAISE EXCEPTION 'Selection exceeds the employee monthly allowance';
  END IF;

  IF _per_employee_budget IS NOT NULL AND _per_employee_budget > 0 THEN
    IF _employee_count IS NULL OR _employee_count <= 0 THEN
      SELECT count(*)::integer
        INTO _employee_count
        FROM public.profiles
       WHERE company_id = _company_id
         AND company_status = 'active';
    END IF;

    _company_monthly_cap := _per_employee_budget::bigint * COALESCE(_employee_count, 0);

    SELECT COALESCE(SUM(s.total_l), 0)::bigint
      INTO _company_paid_this_month
      FROM public.selections s
      JOIN public.profiles p ON p.id = s.employee_id
     WHERE p.company_id = _company_id
       AND s.status = 'paid'
       AND s.created_at >= date_trunc('month', now());

    IF _company_monthly_cap > 0
       AND _company_paid_this_month + _selection.total_l > _company_monthly_cap THEN
      RAISE EXCEPTION 'Company monthly benefit budget exceeded';
    END IF;
  END IF;

  UPDATE public.selections
     SET status = 'paid',
         updated_at = now()
   WHERE id = _selection.id;

  _reward := GREATEST(200, ROUND(_selection.total_l * 0.05)::integer);

  INSERT INTO public.points_ledger(employee_id, delta, reason, granted_by, company_id)
  VALUES (_selection.employee_id, _reward, 'Engagement bonus', _uid, _company_id)
  RETURNING id INTO _points_id;

  RETURN jsonb_build_object(
    'ok', true,
    'selection_id', _selection.id,
    'status', 'paid',
    'simulated_payment', _simulate_payment,
    'reward_points', _reward,
    'points_ledger_id', _points_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_and_pay_selection(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_and_pay_selection(uuid, boolean) TO authenticated;

-- Builder-local asset URLs do not exist on a normal Vercel/GitHub deploy.
-- Clear them so the UI uses the built-in provider initials fallback.
UPDATE public.providers
   SET logo_url = NULL
 WHERE logo_url LIKE '/' || 'assets' || '/%';
