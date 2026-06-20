
REVOKE EXECUTE ON FUNCTION public.is_employer_of(uuid) FROM PUBLIC, anon, authenticated;
-- Function is invoked from RLS policies which run as the policy owner (postgres), so no direct EXECUTE grant is needed.
