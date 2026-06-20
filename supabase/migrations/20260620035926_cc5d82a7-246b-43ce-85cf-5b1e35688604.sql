
-- 1) Companies: drop blanket SELECT; expose only safe public columns via a view
DROP POLICY IF EXISTS "Authenticated can browse companies" ON public.companies;

CREATE OR REPLACE VIEW public.public_companies
WITH (security_invoker = false) AS
SELECT id, name, industry, brand_primary
FROM public.companies;

REVOKE ALL ON public.public_companies FROM PUBLIC;
GRANT SELECT ON public.public_companies TO authenticated, anon;

-- 2) Providers: hide contact_email via column-level revoke (other reads unaffected)
REVOKE SELECT (contact_email) ON public.providers FROM authenticated, anon, PUBLIC;

-- 3) points_ledger: only employers may insert; employees cannot self-credit
DROP POLICY IF EXISTS "Employer grants points" ON public.points_ledger;
CREATE POLICY "Employer grants points" ON public.points_ledger
  FOR INSERT TO authenticated
  WITH CHECK (public.is_employer_of(employee_id));

-- 4) vouchers: explicit deny for UPDATE/DELETE from clients (issued by SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "Deny voucher update" ON public.vouchers;
DROP POLICY IF EXISTS "Deny voucher delete" ON public.vouchers;
CREATE POLICY "Deny voucher update" ON public.vouchers
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny voucher delete" ON public.vouchers
  FOR DELETE TO authenticated, anon USING (false);

-- 5) Lock down SECURITY DEFINER functions: revoke from anon/PUBLIC, grant only where needed
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_join_request(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_join_request(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_join_company(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_invitation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_employee(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, public.transfer_type, integer, uuid[], text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_employer_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.my_company_id() FROM PUBLIC, anon;

-- Internal-only functions: not callable by any client role
REVOKE EXECUTE ON FUNCTION public.generate_voucher_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.issue_vouchers_for_selection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Ensure authenticated still has access to user-facing RPCs
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_join_company(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_employee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, public.transfer_type, integer, uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employer_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_company_id() TO authenticated;
