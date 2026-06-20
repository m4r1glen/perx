-- 1) Security-definer view -> security-invoker
DROP VIEW IF EXISTS public.public_companies;
CREATE VIEW public.public_companies
  WITH (security_invoker = on) AS
  SELECT id, name, industry, brand_primary FROM public.companies;
GRANT SELECT ON public.public_companies TO anon, authenticated;

-- 2) Transfers: no direct INSERT; gifts must go through send_gift() RPC
DROP POLICY IF EXISTS "Send only as self" ON public.transfers;

-- 3) Hide colleague emails: drop the same-company SELECT policy and
--    expose a safe-columns RPC instead. Own-profile, employer, and
--    owner-applicant policies remain unchanged.
DROP POLICY IF EXISTS "Colleagues can view same-company profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.list_colleagues()
RETURNS TABLE (
  id uuid,
  full_name text,
  job_title text,
  department text,
  company_id uuid,
  role public.user_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.job_title, p.department, p.company_id, p.role
  FROM public.profiles p
  WHERE p.company_id IS NOT NULL
    AND p.company_id = public.my_company_id()
    AND p.id <> auth.uid();
$$;

REVOKE ALL ON FUNCTION public.list_colleagues() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_colleagues() TO authenticated;