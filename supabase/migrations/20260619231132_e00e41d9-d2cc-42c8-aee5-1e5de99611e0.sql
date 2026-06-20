
-- Enum
DO $$ BEGIN
  CREATE TYPE public.voucher_status AS ENUM ('valid','redeemed','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Code generator: PERX-XXXX-XXXX (Crockford-ish, no ambiguous chars)
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  part1 text := '';
  part2 text := '';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    part1 := part1 || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    part2 := part2 || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN 'PERX-' || part1 || '-' || part2;
END;
$$;

-- Table
CREATE TABLE public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id uuid NOT NULL REFERENCES public.selections(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE RESTRICT,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  status public.voucher_status NOT NULL DEFAULT 'valid',
  value_l integer NOT NULL CHECK (value_l >= 0),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  redeemed_by_provider_id uuid REFERENCES public.providers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vouchers_employee_id_idx ON public.vouchers(employee_id);
CREATE INDEX vouchers_provider_id_idx ON public.vouchers(provider_id);
CREATE INDEX vouchers_offer_id_idx ON public.vouchers(offer_id);
CREATE INDEX vouchers_status_idx ON public.vouchers(status);

-- GRANTs (read-only for app roles; only service_role mutates)
GRANT SELECT ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;

-- RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Employees can read their own vouchers
CREATE POLICY "Employees can read own vouchers"
ON public.vouchers FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- Providers can read vouchers for offers they own
CREATE POLICY "Providers can read vouchers for their offers"
ON public.vouchers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = vouchers.provider_id
      AND p.owner_id = auth.uid()
  )
);

-- NOTE: No INSERT/UPDATE/DELETE policies for authenticated users.
-- All writes go through the service-role edge functions / SECURITY DEFINER trigger.

-- Auto-issue vouchers when a selection becomes 'paid'
CREATE OR REPLACE FUNCTION public.issue_vouchers_for_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _offer_id uuid;
  _offer record;
  _code text;
  _attempts int;
BEGIN
  -- Only trigger when transitioning into 'paid'
  IF NEW.status <> 'paid' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  FOREACH _offer_id IN ARRAY NEW.offer_ids LOOP
    SELECT id, provider_id, price_l INTO _offer
      FROM public.offers WHERE id = _offer_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    -- Avoid duplicates if trigger somehow fires twice for same selection+offer
    IF EXISTS (
      SELECT 1 FROM public.vouchers
      WHERE selection_id = NEW.id AND offer_id = _offer_id
    ) THEN
      CONTINUE;
    END IF;

    -- Unique code with retry
    _attempts := 0;
    LOOP
      _code := public.generate_voucher_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.vouchers WHERE code = _code);
      _attempts := _attempts + 1;
      IF _attempts > 8 THEN
        RAISE EXCEPTION 'Could not generate unique voucher code';
      END IF;
    END LOOP;

    INSERT INTO public.vouchers(
      selection_id, offer_id, employee_id, provider_id,
      code, status, value_l, expires_at
    ) VALUES (
      NEW.id, _offer.id, NEW.employee_id, _offer.provider_id,
      _code, 'valid', _offer.price_l, now() + interval '90 days'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS selections_issue_vouchers ON public.selections;
CREATE TRIGGER selections_issue_vouchers
AFTER INSERT OR UPDATE OF status ON public.selections
FOR EACH ROW
EXECUTE FUNCTION public.issue_vouchers_for_selection();

-- Atomic redeem RPC used by voucher-verify edge function (service role calls it).
-- Returns the voucher row if it transitioned valid -> redeemed, else NULL.
CREATE OR REPLACE FUNCTION public.redeem_voucher(_voucher_id uuid, _provider_id uuid)
RETURNS public.vouchers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.vouchers;
BEGIN
  UPDATE public.vouchers
     SET status = 'redeemed',
         redeemed_at = now(),
         redeemed_by_provider_id = _provider_id
   WHERE id = _voucher_id
     AND status = 'valid'
     AND expires_at > now()
     AND provider_id = _provider_id
  RETURNING * INTO _row;

  RETURN _row;  -- NULL if no row updated
END;
$$;

-- Backfill: issue vouchers for any existing 'paid' selections that have none
DO $$
DECLARE
  _sel record;
  _offer_id uuid;
  _offer record;
  _code text;
  _attempts int;
BEGIN
  FOR _sel IN
    SELECT s.* FROM public.selections s
    WHERE s.status = 'paid'
      AND NOT EXISTS (SELECT 1 FROM public.vouchers v WHERE v.selection_id = s.id)
  LOOP
    FOREACH _offer_id IN ARRAY _sel.offer_ids LOOP
      SELECT id, provider_id, price_l INTO _offer FROM public.offers WHERE id = _offer_id;
      IF NOT FOUND THEN CONTINUE; END IF;
      _attempts := 0;
      LOOP
        _code := public.generate_voucher_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.vouchers WHERE code = _code);
        _attempts := _attempts + 1;
        EXIT WHEN _attempts > 8;
      END LOOP;
      INSERT INTO public.vouchers(selection_id, offer_id, employee_id, provider_id, code, status, value_l, expires_at)
      VALUES (_sel.id, _offer.id, _sel.employee_id, _offer.provider_id, _code, 'valid', _offer.price_l, now() + interval '90 days');
    END LOOP;
  END LOOP;
END $$;
