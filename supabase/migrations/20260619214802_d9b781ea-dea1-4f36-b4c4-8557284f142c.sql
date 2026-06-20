
-- 1. Extend providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS brand_color text;

-- 2. Create offer_locations
CREATE TABLE IF NOT EXISTS public.offer_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  city text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_locations TO authenticated;
GRANT ALL ON public.offer_locations TO service_role;

ALTER TABLE public.offer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_locations readable by authenticated"
  ON public.offer_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "offer_locations manageable by provider owner"
  ON public.offer_locations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS offer_locations_offer_id_idx ON public.offer_locations(offer_id);
CREATE INDEX IF NOT EXISTS offer_locations_provider_id_idx ON public.offer_locations(provider_id);

CREATE TRIGGER set_offer_locations_updated_at
  BEFORE UPDATE ON public.offer_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Also ensure providers are readable by authenticated (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='providers' AND policyname='providers readable by authenticated'
  ) THEN
    CREATE POLICY "providers readable by authenticated"
      ON public.providers FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 3. Assign brand colors + coordinates per provider (HQ pin)
UPDATE public.providers SET brand_color = CASE category
  WHEN 'fitness'  THEN '#FF7A33'
  WHEN 'wellness' THEN '#5F9C75'
  WHEN 'travel'   THEN '#C75C3D'
  WHEN 'health'   THEN '#3E7CB1'
  WHEN 'telecom'  THEN '#7B5EA7'
  WHEN 'food'     THEN '#E0A458'
  WHEN 'learning' THEN '#4C9A8E'
  ELSE '#FF7A33'
END WHERE brand_color IS NULL;

UPDATE public.providers SET latitude = 41.3220, longitude = 19.8210 WHERE id = 'b0000000-0000-0000-0000-000000000001';
UPDATE public.providers SET latitude = 41.3300, longitude = 19.8230 WHERE id = 'b0000000-0000-0000-0000-000000000002';
UPDATE public.providers SET latitude = 41.3185, longitude = 19.8240 WHERE id = 'b0000000-0000-0000-0000-000000000003';
UPDATE public.providers SET latitude = 41.3200, longitude = 19.8225 WHERE id = 'b0000000-0000-0000-0000-000000000004';
UPDATE public.providers SET latitude = 41.3155, longitude = 19.8270 WHERE id = 'b0000000-0000-0000-0000-000000000005';
UPDATE public.providers SET latitude = 41.3245, longitude = 19.8195 WHERE id = 'b0000000-0000-0000-0000-000000000006';
UPDATE public.providers SET latitude = 41.3275, longitude = 19.8187 WHERE id = 'b0000000-0000-0000-0000-000000000007';
UPDATE public.providers SET latitude = 41.3290, longitude = 19.8150 WHERE id = 'b0000000-0000-0000-0000-000000000008';
UPDATE public.providers SET latitude = 41.3270, longitude = 19.8190 WHERE id = 'b0000000-0000-0000-0000-000000000009';
UPDATE public.providers SET latitude = 41.3275, longitude = 19.8195 WHERE id = 'b0000000-0000-0000-0000-000000000010';

-- 4. Seed offer_locations
INSERT INTO public.offer_locations (offer_id, provider_id, name, latitude, longitude, city, address) VALUES
  -- Fitness First Tirana (1 location)
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Fitness First Blloku', 41.3220, 19.8210, 'Tiranë', 'Rruga Ismail Qemali, Blloku'),
  -- Serotonin Gym (women-only, 1 location)
  ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','Serotonin Gym Komuna e Parisit', 41.3300, 19.8230, 'Tiranë', 'Komuna e Parisit'),
  -- Ritual Spa & Hammam (2 branches)
  ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','Ritual Spa Blloku', 41.3185, 19.8240, 'Tiranë', 'Rruga Pjetër Bogdani'),
  ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','Ritual Spa Liqeni', 41.3155, 19.8275, 'Tiranë', 'Parku i Liqenit'),
  -- LIFT Rooftop
  ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000004','LIFT Rooftop Tirana', 41.3200, 19.8225, 'Tiranë', 'Rruga Perlat Rexhepi'),
  -- Oda Restaurant
  ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000005','Oda Qendër', 41.3260, 19.8205, 'Tiranë', 'Rruga Luigj Gurakuqi'),
  -- Artigiano
  ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000006','Artigiano Blloku', 41.3245, 19.8195, 'Tiranë', 'Rruga Sami Frashëri'),
  ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000006','Artigiano Pazari i Ri', 41.3290, 19.8235, 'Tiranë', 'Pazari i Ri'),
  -- Vodafone Albania (5 cities)
  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Store Toptani', 41.3275, 19.8187, 'Tiranë', 'Toptani Shopping Center'),
  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Store Durrës', 41.3231, 19.4414, 'Durrës', 'Rruga Tregtare'),
  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Store Vlorë', 40.4667, 19.4897, 'Vlorë', 'Lungomare'),
  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Store Shkodër', 42.0683, 19.5126, 'Shkodër', 'Rruga Kolë Idromeno'),
  ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Store Elbasan', 41.1125, 20.0822, 'Elbasan', 'Bulevardi Qemal Stafa'),
  -- One Albania (4 cities)
  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Store Tiranë Qendër', 41.3290, 19.8150, 'Tiranë', 'Sheshi Skënderbej'),
  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Store Durrës', 41.3180, 19.4450, 'Durrës', 'Bulevardi Epidamn'),
  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Store Fier', 40.7239, 19.5567, 'Fier', 'Bulevardi Jakov Xoxa'),
  ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Store Korçë', 40.6186, 20.7808, 'Korçë', 'Bulevardi Republika'),
  -- Zenith Travel (Amalfi) - Tirana pickup
  ('c0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000009','Zenith Travel — Zyra Tiranë (pikë rezervimi)', 41.3270, 19.8190, 'Tiranë', 'Rruga e Durrësit'),
  -- Elite Travel (Istanbul) - Tirana pickup
  ('c0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000010','Elite Travel — Zyra Tiranë (pikë rezervimi)', 41.3275, 19.8195, 'Tiranë', 'Rruga Ibrahim Rugova');
