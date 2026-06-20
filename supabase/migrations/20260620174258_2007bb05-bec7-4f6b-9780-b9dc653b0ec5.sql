
-- 1. Stop exposing the email column to employer-side SELECT policies on profiles.
-- These broad policies allowed the email column to be read by any employer who
-- owned the company. Replace with SECURITY DEFINER RPCs that return only
-- non-sensitive columns.

DROP POLICY IF EXISTS "Employers can view company employee profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view applicant profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.list_company_employees()
RETURNS TABLE (
  id uuid,
  full_name text,
  job_title text,
  department text,
  role public.user_role,
  company_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.job_title, p.department, p.role, p.company_status::text
    FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
   WHERE c.owner_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.list_company_applicants()
RETURNS TABLE (
  request_id uuid,
  company_id uuid,
  employee_id uuid,
  status text,
  message text,
  request_created_at timestamptz,
  decided_at timestamptz,
  full_name text,
  job_title text,
  department text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.company_id, r.employee_id, r.status::text, r.message,
         r.created_at, r.decided_at,
         p.full_name, p.job_title, p.department
    FROM public.company_join_requests r
    JOIN public.companies c ON c.id = r.company_id
    LEFT JOIN public.profiles p ON p.id = r.employee_id
   WHERE c.owner_id = auth.uid()
   ORDER BY r.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_company_employees() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_company_applicants() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.list_company_employees() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.list_company_applicants() TO authenticated;

-- 2. Enforce server-side budget on point grants. Remove the broad employer
-- INSERT policy so all positive grants flow through grant_points (SECURITY
-- DEFINER), which now enforces a monthly cap derived from the company's
-- monthly_budget_per_employee_lek × employee_count.

DROP POLICY IF EXISTS "Employer grants points" ON public.points_ledger;

CREATE OR REPLACE FUNCTION public.grant_points(_employee_id uuid, _amount integer, _reason text)
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
  _per_emp int;
  _emp_count int;
  _budget bigint;
  _spent bigint;
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

  SELECT c.id, c.monthly_budget_per_employee_lek, c.employee_count
    INTO _company, _per_emp, _emp_count
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

  -- Monthly budget enforcement (only when a per-employee budget is configured).
  IF _per_emp IS NOT NULL AND _per_emp > 0 THEN
    -- Use stored employee_count, falling back to actual active profile count.
    IF _emp_count IS NULL OR _emp_count <= 0 THEN
      SELECT count(*)::int INTO _emp_count
        FROM public.profiles
       WHERE company_id = _company AND company_status = 'active';
    END IF;

    _budget := (_per_emp::bigint) * COALESCE(_emp_count, 0);

    SELECT COALESCE(SUM(delta), 0)::bigint INTO _spent
      FROM public.points_ledger
     WHERE company_id = _company
       AND delta > 0
       AND created_at >= date_trunc('month', now());

    IF _spent + _amount > _budget THEN
      RAISE EXCEPTION 'Monthly budget exceeded (cap %, already granted %, requested %)',
        _budget, _spent, _amount;
    END IF;
  END IF;

  INSERT INTO public.points_ledger(employee_id, delta, reason, granted_by, company_id)
  VALUES (_employee_id, _amount, btrim(_reason), _uid, _company)
  RETURNING id INTO _row_id;

  RETURN _row_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.grant_points(uuid, integer, text) TO authenticated;
