
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- The is_employer_of() function is referenced by selections/points_ledger RLS
-- but EXECUTE was never granted to authenticated, causing 403s on legitimate
-- reads by employees of their OWN rows. Grant it.
GRANT EXECUTE ON FUNCTION public.is_employer_of(uuid) TO authenticated, anon;
