
-- Enums
DO $$ BEGIN
  CREATE TYPE public.transfer_type AS ENUM ('points','package');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transfer_status AS ENUM ('sent','claimed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: my company id (avoids recursive RLS on profiles)
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.my_company_id() TO authenticated;

-- Let colleagues see each other (needed for the "pick a colleague" picker)
DROP POLICY IF EXISTS "Colleagues can view same-company profiles" ON public.profiles;
CREATE POLICY "Colleagues can view same-company profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.my_company_id());

-- Transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transfer_type NOT NULL,
  points_amount integer NOT NULL DEFAULT 0,
  offer_ids uuid[] NOT NULL DEFAULT '{}',
  gift_message text,
  status public.transfer_status NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own transfers" ON public.transfers;
CREATE POLICY "Read own transfers" ON public.transfers
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Send only as self" ON public.transfers;
CREATE POLICY "Send only as self" ON public.transfers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Recipient can mark claimed" ON public.transfers;
CREATE POLICY "Recipient can mark claimed" ON public.transfers
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS transfers_sender_idx ON public.transfers(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transfers_recipient_idx ON public.transfers(recipient_id, created_at DESC);

-- Atomic gifting RPC
CREATE OR REPLACE FUNCTION public.send_gift(
  _recipient uuid,
  _type public.transfer_type,
  _points integer,
  _offer_ids uuid[],
  _message text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _sender uuid := auth.uid();
  _sender_company uuid;
  _recipient_company uuid;
  _sender_name text;
  _balance integer;
  _total integer := 0;
  _transfer_id uuid;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _sender = _recipient THEN RAISE EXCEPTION 'Cannot gift yourself'; END IF;

  SELECT company_id, COALESCE(full_name, email)
    INTO _sender_company, _sender_name
    FROM public.profiles WHERE id = _sender;
  SELECT company_id INTO _recipient_company
    FROM public.profiles WHERE id = _recipient;

  IF _sender_company IS NULL OR _sender_company IS DISTINCT FROM _recipient_company THEN
    RAISE EXCEPTION 'Recipient must be a colleague at your company';
  END IF;

  IF _type = 'points' THEN
    IF _points IS NULL OR _points <= 0 THEN RAISE EXCEPTION 'Invalid points amount'; END IF;
    _total := _points;
  ELSE
    IF _offer_ids IS NULL OR array_length(_offer_ids, 1) IS NULL THEN
      RAISE EXCEPTION 'No offers in package';
    END IF;
    SELECT COALESCE(SUM(price_l), 0)::int INTO _total
      FROM public.offers WHERE id = ANY(_offer_ids);
    IF _total <= 0 THEN RAISE EXCEPTION 'Invalid package'; END IF;
  END IF;

  SELECT COALESCE(SUM(delta), 0)::int INTO _balance
    FROM public.points_ledger WHERE employee_id = _sender;
  IF _balance < _total THEN
    RAISE EXCEPTION 'Insufficient points balance (have %, need %)', _balance, _total;
  END IF;

  INSERT INTO public.transfers(sender_id, recipient_id, type, points_amount, offer_ids, gift_message, status)
  VALUES (_sender, _recipient, _type, _total, COALESCE(_offer_ids, '{}'::uuid[]), NULLIF(_message, ''), 'sent')
  RETURNING id INTO _transfer_id;

  INSERT INTO public.points_ledger(employee_id, delta, reason)
  VALUES (_sender, -_total, 'Dhuratë te koleg/e');

  IF _type = 'points' THEN
    INSERT INTO public.points_ledger(employee_id, delta, reason)
    VALUES (_recipient, _total, 'Dhuratë nga ' || COALESCE(_sender_name, 'koleg/e'));
  ELSE
    INSERT INTO public.selections(employee_id, offer_ids, total_l, status)
    VALUES (_recipient, _offer_ids, _total, 'approved');
  END IF;

  RETURN _transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_gift(uuid, public.transfer_type, integer, uuid[], text) TO authenticated;
