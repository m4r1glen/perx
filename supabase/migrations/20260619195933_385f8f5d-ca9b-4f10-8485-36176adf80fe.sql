
-- 1. Extend profiles with company link
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- 2. Selection status enum
DO $$ BEGIN
  CREATE TYPE public.selection_status AS ENUM ('pending','approved','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title_sq text NOT NULL,
  title_en text NOT NULL,
  description_sq text,
  description_en text,
  price_l integer NOT NULL CHECK (price_l >= 0),
  category text NOT NULL,
  mood text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read offers" ON public.offers;
CREATE POLICY "Authenticated can read offers" ON public.offers
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Providers manage own offers" ON public.offers;
CREATE POLICY "Providers manage own offers" ON public.offers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = offers.provider_id AND p.owner_id = auth.uid()));
DROP TRIGGER IF EXISTS offers_set_updated_at ON public.offers;
CREATE TRIGGER offers_set_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow any signed-in user to read providers
DROP POLICY IF EXISTS "Authenticated can read providers" ON public.providers;
CREATE POLICY "Authenticated can read providers" ON public.providers
  FOR SELECT TO authenticated USING (true);

-- 4. Employer-of helper
CREATE OR REPLACE FUNCTION public.is_employer_of(_employee uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.companies c ON c.id = p.company_id
    WHERE p.id = _employee AND c.owner_id = auth.uid()
  );
$$;

-- 5. Selections
CREATE TABLE IF NOT EXISTS public.selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_ids uuid[] NOT NULL DEFAULT '{}',
  total_l integer NOT NULL DEFAULT 0,
  status public.selection_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.selections TO authenticated;
GRANT ALL ON public.selections TO service_role;
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employee reads own selections" ON public.selections;
CREATE POLICY "Employee reads own selections" ON public.selections
  FOR SELECT TO authenticated
  USING (auth.uid() = employee_id OR public.is_employer_of(employee_id));
DROP POLICY IF EXISTS "Employee writes own selections" ON public.selections;
CREATE POLICY "Employee writes own selections" ON public.selections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = employee_id);
DROP POLICY IF EXISTS "Employee updates own selections" ON public.selections;
CREATE POLICY "Employee updates own selections" ON public.selections
  FOR UPDATE TO authenticated
  USING (auth.uid() = employee_id OR public.is_employer_of(employee_id))
  WITH CHECK (auth.uid() = employee_id OR public.is_employer_of(employee_id));
DROP TRIGGER IF EXISTS selections_set_updated_at ON public.selections;
CREATE TRIGGER selections_set_updated_at BEFORE UPDATE ON public.selections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Points ledger
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employee reads own points" ON public.points_ledger;
CREATE POLICY "Employee reads own points" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = employee_id OR public.is_employer_of(employee_id));
DROP POLICY IF EXISTS "Employer grants points" ON public.points_ledger;
CREATE POLICY "Employer grants points" ON public.points_ledger
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = employee_id OR public.is_employer_of(employee_id));

-- =========== SEED ===========

-- Seed auth users (employer + 3 employees + 10 provider owners)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
 ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','demo.employer@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo Employer","role":"employer"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','arta.k@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Arta Kola","role":"employee"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333333','authenticated','authenticated','besnik.h@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Besnik Hoxha","role":"employee"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','44444444-4444-4444-4444-444444444444','authenticated','authenticated','eliona.s@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Eliona Shehu","role":"employee"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000001','authenticated','authenticated','prov1@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Fitness First","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000002','authenticated','authenticated','prov2@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Serotonin Gym","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000003','authenticated','authenticated','prov3@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Ritual Spa","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000004','authenticated','authenticated','prov4@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"LIFT","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000005','authenticated','authenticated','prov5@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Oda","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000006','authenticated','authenticated','prov6@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Artigiano","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000007','authenticated','authenticated','prov7@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Vodafone","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000008','authenticated','authenticated','prov8@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"One Albania","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000009','authenticated','authenticated','prov9@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Zenith Travel","role":"provider"}',now(),now()),
 ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000010','authenticated','authenticated','prov10@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Elite Travel","role":"provider"}',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Demo company
INSERT INTO public.companies (id, owner_id, name, industry, employee_count, monthly_budget_per_employee_lek)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Fitnes First Tirana','Sport & Wellness',24,18000)
ON CONFLICT (id) DO NOTHING;

-- Link employee profiles to company + onboarding
UPDATE public.profiles SET company_id='aaaaaaaa-0000-0000-0000-000000000001', onboarding_complete=true, role='employee', job_title='Trajner/e', department='Operations'
  WHERE id IN ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444');
UPDATE public.profiles SET onboarding_complete=true, role='employer'
  WHERE id='11111111-1111-1111-1111-111111111111';

-- Providers
INSERT INTO public.providers (id, owner_id, business_name, category, city, description) VALUES
 ('b0000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Fitness First Tirana','fitness','Tirana','Qender fitnesi premium me pajisje te nivelit boteror, spinning, CrossFit, yoga dhe trajnere ekspertë per cdo qellim fitnesi.'),
 ('b0000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002','Serotonin Gym','fitness','Tirana','Hapesire fitnesi vetem per femra, e fokusuar te fuqizimi, vetebesimi dhe ushqyerja e shendetshme.'),
 ('b0000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000003','Ritual Spa & Hammam','wellness','Tirana','Spa e njohur per hammam autentik, masazhe relaksuese dhe nje ambient te qete dhe te miremabajtur per rigjenerim total.'),
 ('b0000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000004','LIFT Restaurant & Rooftop Bar','food','Tirana','Steakhouse elegante e kombinuar me bar ne cati dhe pamje mahnitese te Tiranes, ideale per darka special dhe atmosfere nate.'),
 ('b0000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000005','Oda Restaurant','food','Tirana','Restorant i ndertuar si dhome tradicionale shqiptare me mobilje druri, qe sherben pjata autentike si tave kosi, fergese dhe fli.'),
 ('b0000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000006','Artigiano','food','Tirana','Nje nga emrat me te njohur te kuzhines italiane ne Tirane, me dy lokacione dhe nje menu te pasur me pasta, pica dhe verera.'),
 ('b0000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000007','Vodafone Albania','telecom','Tirana','Nje nga dy operatoret kryesore celulare ne Shqiperi, me paketa interneti, telefoni dhe sherbime per familje e biznese.'),
 ('b0000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000008','One Albania','telecom','Tirana','Operatori i dyte kryesor celular ne Shqiperi, me oferta konkurruese per internet dhe telefoni.'),
 ('b0000000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000009','Zenith Travel','travel','Tirana','Agjenci udhetimi qe organizon pakete turistike nderkombetare me avion dhe guide, drejt destinacioneve si Amalfi, Sardenja dhe Stamboll.'),
 ('b0000000-0000-0000-0000-000000000010','b1000000-0000-0000-0000-000000000010','Elite Travel (Lufthansa City Center Albania)','travel','Tirana','Agjenci udhetimi pjese e nje rrjeti nderkombetar, e specializuar ne udhetime kulturore dhe ekskursione rajonale ne Ballkan dhe Greqi.')
ON CONFLICT (id) DO NOTHING;

-- Offers
INSERT INTO public.offers (id, provider_id, title_sq, title_en, description_sq, description_en, price_l, category, mood) VALUES
 ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Abonim mujor fitnesi premium','Premium monthly gym pass','Akses i plote ne pajisje, klasa grupore dhe trajner personal.','Full access to equipment, group classes and personal trainer.',8500,'fitness',ARRAY['energy','focus']),
 ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002','Abonim mujor vetem per femra','Women-only monthly pass','Mjedis i sigurt fitnesi me fokus te fuqizimi dhe ushqyerja.','Safe women-only space focused on strength and nutrition.',6500,'fitness',ARRAY['energy','focus']),
 ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003','Hammam & masazh relaksues','Hammam & relaxing massage','Nje session i plote hammam dhe masazh per rigjenerim total.','Full hammam session and massage for total recovery.',5500,'wellness',ARRAY['relax']),
 ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000004','Darke per dy ne rooftop','Dinner for two on the rooftop','Menu steak dhe veres mbi panorame te Tiranes.','Steak and wine menu over Tirana skyline.',7500,'food',ARRAY['relax','energy']),
 ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000005','Drekë tradicionale për dy','Traditional Albanian lunch for two','Tave kosi, fergese, fli dhe rakia shtepie.','Tave kosi, fergese, fli and house rakia.',3500,'food',ARRAY['relax']),
 ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000006','Pica & vere italiane','Italian pizza & wine','Combo pica autentike dhe shishe vere e zgjedhur.','Authentic pizza combo and a selected bottle of wine.',2800,'food',ARRAY['relax']),
 ('c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Paketa mujore internet & celular','Monthly internet & mobile bundle','Internet i pakufizuar dhe minuta te mjaftueshme.','Unlimited internet and ample minutes.',2200,'telecom',ARRAY['focus']),
 ('c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','Paketa familjare One','One family bundle','Plan familjar me data te perbashketa.','Family plan with shared data.',2400,'telecom',ARRAY['focus']),
 ('c0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000009','Fundjave ne Amalfi','Weekend in Amalfi','Pakete 3 ditore me fluturim dhe hotel 4*.','3-day package with flight and 4* hotel.',55000,'travel',ARRAY['adventure','relax']),
 ('c0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000010','Ekskursion kulturor ne Stamboll','Cultural tour in Istanbul','4 dite me guide, transferta dhe ushqim te perfshire.','4 days with guide, transfers and meals included.',62000,'travel',ARRAY['adventure'])
ON CONFLICT (id) DO NOTHING;

-- Points ledger
INSERT INTO public.points_ledger (employee_id, delta, reason) VALUES
 ('22222222-2222-2222-2222-222222222222',12000,'Mirëseardhje'),
 ('22222222-2222-2222-2222-222222222222', 3000,'Performancë mujore'),
 ('33333333-3333-3333-3333-333333333333',12000,'Mirëseardhje'),
 ('33333333-3333-3333-3333-333333333333', 3000,'Performancë mujore'),
 ('44444444-4444-4444-4444-444444444444',12000,'Mirëseardhje'),
 ('44444444-4444-4444-4444-444444444444', 3000,'Performancë mujore');

-- Selections: 4 paid + 1 pending
INSERT INTO public.selections (id, employee_id, offer_ids, total_l, status, created_at) VALUES
 ('d0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000001'::uuid],8500,'paid',now() - interval '20 days'),
 ('d0000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000003'::uuid],5500,'paid',now() - interval '10 days'),
 ('d0000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000004'::uuid,'c0000000-0000-0000-0000-000000000007'::uuid],9700,'paid',now() - interval '15 days'),
 ('d0000000-0000-0000-0000-000000000004','44444444-4444-4444-4444-444444444444',ARRAY['c0000000-0000-0000-0000-000000000002'::uuid],6500,'paid',now() - interval '5 days'),
 ('d0000000-0000-0000-0000-000000000005','44444444-4444-4444-4444-444444444444',ARRAY['c0000000-0000-0000-0000-000000000009'::uuid],55000,'pending',now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;
