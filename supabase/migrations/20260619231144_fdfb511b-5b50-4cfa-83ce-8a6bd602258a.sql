
REVOKE ALL ON FUNCTION public.generate_voucher_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_voucher(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_voucher_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(uuid, uuid) TO service_role;
