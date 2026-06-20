-- =====================================================================
-- PERX comprehensive demo seed
-- Idempotent: stable UUIDs + ON CONFLICT DO NOTHING / WHERE NOT EXISTS.
-- Does not change schema; only seeds data.
-- =====================================================================

-- ---------- 1. Auth users ----------
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  -- Two new employer owners
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111112','authenticated','authenticated','admin@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Erion Pacaj","role":"employer"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111113','authenticated','authenticated','admin@kafeflora.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Flora Lala","role":"employer"}',now(),now()),

  -- 2 extra DigitalNova employees
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222224','authenticated','authenticated','endrit.k@digitalnova.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Endrit Kraja","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222225','authenticated','authenticated','klejda.m@digitalnova.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Klejda Marku","role":"employee"}',now(),now()),

  -- 6 Adriatik Bank employees
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000001','authenticated','authenticated','edon.b@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Edon Bregu","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000002','authenticated','authenticated','ilirjana.d@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Ilirjana Daja","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000003','authenticated','authenticated','genc.h@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Genc Hysenaj","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000004','authenticated','authenticated','mirela.c@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Mirela Çela","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000005','authenticated','authenticated','florian.b@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Florian Bardhi","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-000000000006','authenticated','authenticated','anila.k@adriatikbank.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Anila Kuka","role":"employee"}',now(),now()),

  -- 4 Kafe Flora employees
  ('00000000-0000-0000-0000-000000000000','66666666-6666-6666-6666-000000000001','authenticated','authenticated','driton.v@kafeflora.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Driton Vlashi","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','66666666-6666-6666-6666-000000000002','authenticated','authenticated','suela.m@kafeflora.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Suela Mema","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','66666666-6666-6666-6666-000000000003','authenticated','authenticated','klara.b@kafeflora.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Klara Berisha","role":"employee"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','66666666-6666-6666-6666-000000000004','authenticated','authenticated','rinor.h@kafeflora.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Rinor Hyseni","role":"employee"}',now(),now()),

  -- 8 new provider owners
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000011','authenticated','authenticated','prov11@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Spa Lavanda","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000012','authenticated','authenticated','prov12@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Albtravel Tours","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000013','authenticated','authenticated','prov13@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Mediplus Klinikë","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000014','authenticated','authenticated','prov14@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Berlitz Tiranë","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000015','authenticated','authenticated','prov15@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Mullixhiu","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000016','authenticated','authenticated','prov16@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Thalasso Durrës","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000017','authenticated','authenticated','prov17@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Conad","role":"provider"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','b1000000-0000-0000-0000-000000000018','authenticated','authenticated','prov18@perx.al',crypt('DemoPerx!2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Gjelbërimi Yoga","role":"provider"}',now(),now())
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Companies ----------
-- Rename / enrich existing demo company
UPDATE public.companies SET
  name = 'DigitalNova Shpk',
  industry = 'Technology',
  employee_count = 25,
  monthly_budget_per_employee_lek = 18000,
  brand_primary = '#6366F1',
  brand_secondary = '#0F172A',
  employee_email_domains = ARRAY['digitalnova.al'],
  plan_status = 'active',
  plan_amount_l = 90000,
  plan_employees_count = 25,
  plan_paid_at = now() - interval '30 days',
  plan_renews_at = now() + interval '335 days'
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';

INSERT INTO public.companies (id, owner_id, name, industry, employee_count, monthly_budget_per_employee_lek, brand_primary, brand_secondary, employee_email_domains, plan_status, plan_amount_l, plan_employees_count, plan_paid_at, plan_renews_at)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111112','Adriatik Bank','Finance',40,22000,'#0F4C81','#FACC15',ARRAY['adriatikbank.al'],'active',144000,40,now() - interval '60 days',now() + interval '305 days'),
  ('aaaaaaaa-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111113','Kafe Flora Group','Hospitality',15,14000,'#C25B40','#1F2937',ARRAY['kafeflora.al'],'trial',NULL,NULL,NULL,NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------- 3. Profiles ----------
-- Update existing DigitalNova employees with richer attributes
UPDATE public.profiles SET
  company_id='aaaaaaaa-0000-0000-0000-000000000001',
  onboarding_complete=true,
  role='employee',
  job_title='Product Designer',
  department='Product',
  interests=ARRAY['wellness','food','learning']
WHERE id='22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  company_id='aaaaaaaa-0000-0000-0000-000000000001',
  onboarding_complete=true,
  role='employee',
  job_title='Senior Engineer',
  department='Engineering',
  interests=ARRAY['telecom','learning','fitness']
WHERE id='33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
  company_id='aaaaaaaa-0000-0000-0000-000000000001',
  onboarding_complete=true,
  role='employee',
  job_title='Customer Success',
  department='Operations',
  interests=ARRAY['travel','food','wellness']
WHERE id='44444444-4444-4444-4444-444444444444';

-- New DigitalNova
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete, job_title, department, interests, company_id) VALUES
  ('22222222-2222-2222-2222-222222222224','endrit.k@digitalnova.al','Endrit Kraja','employee',true,'Backend Engineer','Engineering',ARRAY['fitness','learning'],'aaaaaaaa-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222225','klejda.m@digitalnova.al','Klejda Marku','employee',true,'Marketing Lead','Marketing',ARRAY['food','travel'],'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  company_id=EXCLUDED.company_id, role=EXCLUDED.role, onboarding_complete=true,
  job_title=EXCLUDED.job_title, department=EXCLUDED.department, interests=EXCLUDED.interests;

-- Adriatik Bank employer
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete) VALUES
  ('11111111-1111-1111-1111-111111111112','admin@adriatikbank.al','Erion Pacaj','employer',true)
ON CONFLICT (id) DO UPDATE SET role='employer', onboarding_complete=true, full_name=EXCLUDED.full_name;

-- Adriatik Bank employees
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete, job_title, department, interests, company_id) VALUES
  ('55555555-5555-5555-5555-000000000001','edon.b@adriatikbank.al','Edon Bregu','employee',true,'Branch Manager','Operations',ARRAY['wellness','food','travel'],'aaaaaaaa-0000-0000-0000-000000000002'),
  ('55555555-5555-5555-5555-000000000002','ilirjana.d@adriatikbank.al','Ilirjana Daja','employee',true,'Compliance Officer','Legal',ARRAY['food','learning'],'aaaaaaaa-0000-0000-0000-000000000002'),
  ('55555555-5555-5555-5555-000000000003','genc.h@adriatikbank.al','Genc Hysenaj','employee',true,'Relationship Manager','Sales',ARRAY['travel','food'],'aaaaaaaa-0000-0000-0000-000000000002'),
  ('55555555-5555-5555-5555-000000000004','mirela.c@adriatikbank.al','Mirela Çela','employee',true,'Risk Analyst','Risk',ARRAY['fitness','wellness'],'aaaaaaaa-0000-0000-0000-000000000002'),
  ('55555555-5555-5555-5555-000000000005','florian.b@adriatikbank.al','Florian Bardhi','employee',true,'IT Lead','Engineering',ARRAY['telecom','learning','fitness'],'aaaaaaaa-0000-0000-0000-000000000002'),
  ('55555555-5555-5555-5555-000000000006','anila.k@adriatikbank.al','Anila Kuka','employee',true,'HR Manager','People',ARRAY['wellness','health','learning'],'aaaaaaaa-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  company_id=EXCLUDED.company_id, role=EXCLUDED.role, onboarding_complete=true,
  job_title=EXCLUDED.job_title, department=EXCLUDED.department, interests=EXCLUDED.interests;

-- Kafe Flora employer
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete) VALUES
  ('11111111-1111-1111-1111-111111111113','admin@kafeflora.al','Flora Lala','employer',true)
ON CONFLICT (id) DO UPDATE SET role='employer', onboarding_complete=true, full_name=EXCLUDED.full_name;

-- Kafe Flora employees
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete, job_title, department, interests, company_id) VALUES
  ('66666666-6666-6666-6666-000000000001','driton.v@kafeflora.al','Driton Vlashi','employee',true,'Head Barista','Operations',ARRAY['food','fitness'],'aaaaaaaa-0000-0000-0000-000000000003'),
  ('66666666-6666-6666-6666-000000000002','suela.m@kafeflora.al','Suela Mema','employee',true,'Floor Supervisor','Operations',ARRAY['wellness','food'],'aaaaaaaa-0000-0000-0000-000000000003'),
  ('66666666-6666-6666-6666-000000000003','klara.b@kafeflora.al','Klara Berisha','employee',true,'Pastry Chef','Kitchen',ARRAY['wellness','learning','travel'],'aaaaaaaa-0000-0000-0000-000000000003'),
  ('66666666-6666-6666-6666-000000000004','rinor.h@kafeflora.al','Rinor Hyseni','employee',true,'Brand Manager','Marketing',ARRAY['travel','telecom'],'aaaaaaaa-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET
  company_id=EXCLUDED.company_id, role=EXCLUDED.role, onboarding_complete=true,
  job_title=EXCLUDED.job_title, department=EXCLUDED.department, interests=EXCLUDED.interests;

-- New provider owner profiles
INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete) VALUES
  ('b1000000-0000-0000-0000-000000000011','prov11@perx.al','Spa Lavanda','provider',true),
  ('b1000000-0000-0000-0000-000000000012','prov12@perx.al','Albtravel Tours','provider',true),
  ('b1000000-0000-0000-0000-000000000013','prov13@perx.al','Mediplus Klinikë','provider',true),
  ('b1000000-0000-0000-0000-000000000014','prov14@perx.al','Berlitz Tiranë','provider',true),
  ('b1000000-0000-0000-0000-000000000015','prov15@perx.al','Mullixhiu','provider',true),
  ('b1000000-0000-0000-0000-000000000016','prov16@perx.al','Thalasso Durrës','provider',true),
  ('b1000000-0000-0000-0000-000000000017','prov17@perx.al','Conad','provider',true),
  ('b1000000-0000-0000-0000-000000000018','prov18@perx.al','Gjelbërimi Yoga','provider',true)
ON CONFLICT (id) DO UPDATE SET role='provider', onboarding_complete=true;

-- ---------- 4. Providers: enrich existing + insert new ----------
-- Brand colors + coords on the existing 11 providers
UPDATE public.providers SET brand_color='#E11D48', latitude=41.3275, longitude=19.8187 WHERE id='b0000000-0000-0000-0000-000000000001';
UPDATE public.providers SET brand_color='#DB2777', latitude=41.3231, longitude=19.8200 WHERE id='b0000000-0000-0000-0000-000000000002';
UPDATE public.providers SET brand_color='#7C3AED', latitude=41.3260, longitude=19.8230 WHERE id='b0000000-0000-0000-0000-000000000003';
UPDATE public.providers SET brand_color='#0F172A', latitude=41.3270, longitude=19.8190 WHERE id='b0000000-0000-0000-0000-000000000004';
UPDATE public.providers SET brand_color='#9A3412', latitude=41.3300, longitude=19.8260 WHERE id='b0000000-0000-0000-0000-000000000005';
UPDATE public.providers SET brand_color='#15803D', latitude=41.3250, longitude=19.8170 WHERE id='b0000000-0000-0000-0000-000000000006';
UPDATE public.providers SET brand_color='#E60000', latitude=41.3280, longitude=19.8200 WHERE id='b0000000-0000-0000-0000-000000000007';
UPDATE public.providers SET brand_color='#FF4F00', latitude=41.3290, longitude=19.8210 WHERE id='b0000000-0000-0000-0000-000000000008';
UPDATE public.providers SET brand_color='#0EA5E9', latitude=41.3310, longitude=19.8180 WHERE id='b0000000-0000-0000-0000-000000000009';
UPDATE public.providers SET brand_color='#1E40AF', latitude=41.3320, longitude=19.8160 WHERE id='b0000000-0000-0000-0000-000000000010';

INSERT INTO public.providers (id, owner_id, business_name, category, city, description, brand_color, latitude, longitude) VALUES
  ('b0000000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000011','Spa Lavanda','wellness','Tirana','Spa boutique e fokusuar tek terapitë natyrore me vajra esenciale, masazh suedez dhe trajtime fytyre. Dy degë në Tiranë.','#A78BFA',41.3215,19.8195),
  ('b0000000-0000-0000-0000-000000000012','b1000000-0000-0000-0000-000000000012','Albtravel Tours','travel','Tirana','Agjenci e specializuar në udhëtime grupore drejt Greqisë, Italisë dhe Turqisë me transport komod dhe guide shqipfolëse.','#0EA5A4',41.3265,19.8175),
  ('b0000000-0000-0000-0000-000000000013','b1000000-0000-0000-0000-000000000013','Mediplus Klinikë','health','Tirana','Klinikë private me pediatri, dermatologji, kardiologji dhe analiza laboratorike — pa pritje të gjata.','#0D9488',41.3305,19.8240),
  ('b0000000-0000-0000-0000-000000000014','b1000000-0000-0000-0000-000000000014','Berlitz Tiranë','learning','Tirana','Qendër e mirënjohur për mësimin e gjuhëve të huaja: anglisht, italisht, gjermanisht, frëngjisht — kurse për të rritur.','#1D4ED8',41.3245,19.8225),
  ('b0000000-0000-0000-0000-000000000015','b1000000-0000-0000-0000-000000000015','Mullixhiu Restorant','food','Tirana','Restorant që rikrijon kuzhinën tradicionale shqiptare me përbërës nga fermerët lokalë. Dy degë në Tiranë.','#65A30D',41.3175,19.8420),
  ('b0000000-0000-0000-0000-000000000016','b1000000-0000-0000-0000-000000000016','Thalasso Durrës','wellness','Durrës','Qendër thalasso buzë detit në Durrës me pishina me ujë deti, sauna dhe trajtime me leshterik.','#0891B2',41.3170,19.4549),
  ('b0000000-0000-0000-0000-000000000017','b1000000-0000-0000-0000-000000000017','Conad Supermarket','retail','Tirana','Zinxhir supermarketesh me produkte italiane dhe lokale — degë në Tiranë, Durrës, Vlorë, Shkodër.','#B91C1C',41.3290,19.8150),
  ('b0000000-0000-0000-0000-000000000018','b1000000-0000-0000-0000-000000000018','Gjelbërimi Yoga Studio','wellness','Tirana','Studio yoga me klasa Vinyasa, Yin dhe meditim, në një ambient të qetë me oborr të gjelbër.','#16A34A',41.3220,19.8260)
ON CONFLICT (id) DO NOTHING;

-- ---------- 5. Offers ----------
INSERT INTO public.offers (id, provider_id, title_sq, title_en, description_sq, description_en, price_l, category, mood) VALUES
  -- Spa Lavanda
  ('c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000011','Masazh aromaterapie 60 min','Aromatherapy massage 60 min','Masazh i plotë trupi me vajra esenciale.','Full-body massage with essential oils.',4500,'wellness',ARRAY['relax']),
  ('c0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000011','Trajtim fytyre premium','Premium facial','Trajtim hidratues me konsulencë dermatologjike.','Hydrating facial with dermatologist consult.',5200,'wellness',ARRAY['relax']),
  ('c0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000011','Paketë çift në spa','Couples spa package','Sesion masazhi për dy + çaj bimor.','Massage for two + herbal tea.',8200,'wellness',ARRAY['relax']),
  -- Albtravel
  ('c0000000-0000-0000-0000-000000000014','b0000000-0000-0000-0000-000000000012','Fundjavë në Korfuz','Weekend in Corfu','3 ditë me autobus + traget + hotel 3*.','3 days bus + ferry + 3* hotel.',24000,'travel',ARRAY['adventure','relax']),
  ('c0000000-0000-0000-0000-000000000015','b0000000-0000-0000-0000-000000000012','Ekskursion Selanik','Thessaloniki tour','2 ditë me guide shqipfolëse.','2 days with Albanian guide.',16500,'travel',ARRAY['adventure']),
  ('c0000000-0000-0000-0000-000000000016','b0000000-0000-0000-0000-000000000012','Krishtlindje në Romë','Christmas in Rome','5 ditë me fluturim, hotel 4*.','5 days flight + 4* hotel.',68000,'travel',ARRAY['adventure','relax']),
  -- Mediplus
  ('c0000000-0000-0000-0000-000000000017','b0000000-0000-0000-0000-000000000013','Check-up bazë vjetor','Annual basic check-up','Analiza gjaku + EKG + konsultë.','Blood tests + ECG + consult.',5800,'health',ARRAY['focus']),
  ('c0000000-0000-0000-0000-000000000018','b0000000-0000-0000-0000-000000000013','Vizitë dermatologjike','Dermatology visit','Vizitë specialistike dhe dermatoskopi.','Specialist visit and dermatoscopy.',3200,'health',ARRAY['focus']),
  ('c0000000-0000-0000-0000-000000000019','b0000000-0000-0000-0000-000000000013','Paketë pediatrike','Pediatric package','Vizitë pediatri + vaksinim me kalendar.','Pediatrician visit + scheduled vaccines.',4500,'health',ARRAY['focus']),
  -- Berlitz
  ('c0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000014','Kurs anglisht 8 javë','English course 8 weeks','Kurs grupor 2 herë në javë, niveli A2-B2.','Group course twice a week, A2-B2.',12000,'learning',ARRAY['focus']),
  ('c0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000014','Italisht intensiv 4 javë','Intensive Italian 4 weeks','Kurs intensiv 4 ditë në javë.','Intensive course 4 days a week.',9000,'learning',ARRAY['focus']),
  ('c0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000014','Mësim privat 10 orë','Private lessons 10 hours','Paketë orësh private 1-me-1.','10 private 1-on-1 lessons.',15000,'learning',ARRAY['focus']),
  -- Mullixhiu
  ('c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000015','Menu degustimi për dy','Tasting menu for two','7 pjata stinore + akompanim verësh.','7-course seasonal menu + wine pairing.',9800,'food',ARRAY['relax']),
  ('c0000000-0000-0000-0000-000000000024','b0000000-0000-0000-0000-000000000015','Drekë familjare e dielë','Sunday family lunch','Pjata tradicionale për 4 persona.','Traditional dishes for 4.',6200,'food',ARRAY['relax']),
  -- Thalasso Durrës
  ('c0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000016','Ditë e plotë thalasso','Full thalasso day','Pishina ujë deti + sauna + masazh 30 min.','Sea-water pools + sauna + 30-min massage.',6500,'wellness',ARRAY['relax']),
  ('c0000000-0000-0000-0000-000000000026','b0000000-0000-0000-0000-000000000016','Trajtim me leshterik','Seaweed body wrap','Trajtim trupi që mineralizon dhe relakson.','Mineralizing seaweed body treatment.',4200,'wellness',ARRAY['relax']),
  -- Conad
  ('c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000017','Voucher pazari 5000 L','Shopping voucher 5000 L','Voucher i përdorshëm në çdo degë.','Voucher usable at any branch.',5000,'retail',ARRAY['focus']),
  ('c0000000-0000-0000-0000-000000000028','b0000000-0000-0000-0000-000000000017','Voucher pazari 2000 L','Shopping voucher 2000 L','Voucher i përdorshëm në çdo degë.','Voucher usable at any branch.',2000,'retail',ARRAY['focus']),
  -- Gjelbërimi Yoga
  ('c0000000-0000-0000-0000-000000000029','b0000000-0000-0000-0000-000000000018','Abonim mujor yoga','Monthly yoga pass','Akses i pakufizuar në të gjitha klasat.','Unlimited access to all classes.',5500,'wellness',ARRAY['relax','focus']),
  ('c0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000018','Workshop weekend yoga','Yoga weekend workshop','Workshop 2-ditor me mësues të ftuar.','2-day workshop with guest teacher.',4200,'wellness',ARRAY['relax'])
ON CONFLICT (id) DO NOTHING;

-- ---------- 6. Offer locations ----------
-- Vodafone in 5 cities (offer c0..007)
INSERT INTO public.offer_locations (id, offer_id, provider_id, name, latitude, longitude, city, address) VALUES
  ('e0000000-0000-0000-0000-000000000071','c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Tirana City','41.3275','19.8187','Tirana','Bulevardi Bajram Curri'),
  ('e0000000-0000-0000-0000-000000000072','c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Durrës','41.3170','19.4549','Durrës','Rruga Tregtare'),
  ('e0000000-0000-0000-0000-000000000073','c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Vlorë','40.4660','19.4894','Vlorë','Sheshi i Flamurit'),
  ('e0000000-0000-0000-0000-000000000074','c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Shkodër','42.0683','19.5126','Shkodër','Rruga 28 Nëntori'),
  ('e0000000-0000-0000-0000-000000000075','c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000007','Vodafone Elbasan','41.1119','20.0822','Elbasan','Bulevardi Qemal Stafa'),
  -- One Albania in 4 cities
  ('e0000000-0000-0000-0000-000000000081','c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Tirana','41.3285','19.8210','Tirana','Rruga e Kavajës'),
  ('e0000000-0000-0000-0000-000000000082','c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Durrës','41.3185','19.4560','Durrës','Plazh, Rruga Pavarësia'),
  ('e0000000-0000-0000-0000-000000000083','c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Vlorë','40.4675','19.4910','Vlorë','Lungomare'),
  ('e0000000-0000-0000-0000-000000000084','c0000000-0000-0000-0000-000000000008','b0000000-0000-0000-0000-000000000008','One Shkodër','42.0690','19.5140','Shkodër','Rruga Vasil Shanto'),
  -- Spa Lavanda 2 branches (offer c0..011)
  ('e0000000-0000-0000-0000-000000000111','c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000011','Spa Lavanda Blloku','41.3210','19.8195','Tirana','Rruga Sami Frashëri'),
  ('e0000000-0000-0000-0000-000000000112','c0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000011','Spa Lavanda Komuna','41.3340','19.8090','Tirana','Komuna e Parisit'),
  -- Mullixhiu 2 branches (offer c0..023)
  ('e0000000-0000-0000-0000-000000000231','c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000015','Mullixhiu Parku i Madh','41.3175','19.8420','Tirana','Pranë Liqenit Artificial'),
  ('e0000000-0000-0000-0000-000000000232','c0000000-0000-0000-0000-000000000023','b0000000-0000-0000-0000-000000000015','Mullixhiu Petrelë','41.2390','19.9430','Tirana','Petrelë'),
  -- Conad 4 cities (offer c0..027)
  ('e0000000-0000-0000-0000-000000000271','c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000017','Conad Tirana','41.3290','19.8150','Tirana','Rruga e Durrësit'),
  ('e0000000-0000-0000-0000-000000000272','c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000017','Conad Durrës','41.3170','19.4549','Durrës','Rruga Tregtare'),
  ('e0000000-0000-0000-0000-000000000273','c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000017','Conad Vlorë','40.4660','19.4894','Vlorë','Lungomare'),
  ('e0000000-0000-0000-0000-000000000274','c0000000-0000-0000-0000-000000000027','b0000000-0000-0000-0000-000000000017','Conad Shkodër','42.0683','19.5126','Shkodër','Bulevardi'),
  -- Mediplus single
  ('e0000000-0000-0000-0000-000000000171','c0000000-0000-0000-0000-000000000017','b0000000-0000-0000-0000-000000000013','Mediplus Tirana','41.3305','19.8240','Tirana','Rruga Asim Vokshi'),
  -- Berlitz single
  ('e0000000-0000-0000-0000-000000000201','c0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000014','Berlitz Tiranë Qendër','41.3245','19.8225','Tirana','Rruga Donika Kastrioti'),
  -- Thalasso Durrës single
  ('e0000000-0000-0000-0000-000000000251','c0000000-0000-0000-0000-000000000025','b0000000-0000-0000-0000-000000000016','Thalasso Center Durrës','41.3170','19.4549','Durrës','Plazh, Currila'),
  -- Gjelbërimi
  ('e0000000-0000-0000-0000-000000000291','c0000000-0000-0000-0000-000000000029','b0000000-0000-0000-0000-000000000018','Gjelbërimi Yoga Studio','41.3220','19.8260','Tirana','Rruga Ibrahim Rugova')
ON CONFLICT (id) DO NOTHING;

-- ---------- 7. Points ledger ----------
INSERT INTO public.points_ledger (id, employee_id, delta, reason) VALUES
  -- New DigitalNova
  ('f0000000-0000-0000-0000-000000000024','22222222-2222-2222-2222-222222222224',15000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000025','22222222-2222-2222-2222-222222222225',15000,'Mirëseardhje'),
  -- Adriatik Bank starting balances (varied)
  ('f0000000-0000-0000-0000-000000000051','55555555-5555-5555-5555-000000000001',22000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000052','55555555-5555-5555-5555-000000000002',18000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000053','55555555-5555-5555-5555-000000000003',18000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000054','55555555-5555-5555-5555-000000000004',20000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000055','55555555-5555-5555-5555-000000000005',18000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000056','55555555-5555-5555-5555-000000000006',24000,'Mirëseardhje'),
  -- Kafe Flora starting balances
  ('f0000000-0000-0000-0000-000000000061','66666666-6666-6666-6666-000000000001',14000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000062','66666666-6666-6666-6666-000000000002',14000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000063','66666666-6666-6666-6666-000000000003',14000,'Mirëseardhje'),
  ('f0000000-0000-0000-0000-000000000064','66666666-6666-6666-6666-000000000004',14000,'Mirëseardhje')
ON CONFLICT (id) DO NOTHING;

-- ---------- 8. Selections ----------
-- A. Paid selections — one per provider (covers all 18 providers' offers).
-- Trigger auto-issues vouchers. Use stable IDs for idempotency.
INSERT INTO public.selections (id, employee_id, offer_ids, total_l, status, created_at) VALUES
  -- DigitalNova employees (wellness-skewed Arta hits multiple wellness providers)
  ('d1000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000003'::uuid],5500,'paid',now() - interval '40 days'),
  ('d1000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000011'::uuid],4500,'paid',now() - interval '32 days'),
  ('d1000000-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000025'::uuid],6500,'paid',now() - interval '24 days'),
  ('d1000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000029'::uuid],5500,'paid',now() - interval '14 days'),
  ('d1000000-0000-0000-0000-000000000005','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000007'::uuid],2200,'paid',now() - interval '21 days'),
  ('d1000000-0000-0000-0000-000000000006','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000020'::uuid],12000,'paid',now() - interval '18 days'),
  ('d1000000-0000-0000-0000-000000000007','44444444-4444-4444-4444-444444444444',ARRAY['c0000000-0000-0000-0000-000000000014'::uuid],24000,'paid',now() - interval '12 days'),
  ('d1000000-0000-0000-0000-000000000008','44444444-4444-4444-4444-444444444444',ARRAY['c0000000-0000-0000-0000-000000000005'::uuid],3500,'paid',now() - interval '8 days'),
  ('d1000000-0000-0000-0000-000000000009','22222222-2222-2222-2222-222222222224',ARRAY['c0000000-0000-0000-0000-000000000001'::uuid],8500,'paid',now() - interval '16 days'),
  ('d1000000-0000-0000-0000-000000000010','22222222-2222-2222-2222-222222222225',ARRAY['c0000000-0000-0000-0000-000000000006'::uuid],2800,'paid',now() - interval '10 days'),

  -- Adriatik Bank employees
  ('d1000000-0000-0000-0000-000000000011','55555555-5555-5555-5555-000000000001',ARRAY['c0000000-0000-0000-0000-000000000012'::uuid],5200,'paid',now() - interval '28 days'),
  ('d1000000-0000-0000-0000-000000000012','55555555-5555-5555-5555-000000000001',ARRAY['c0000000-0000-0000-0000-000000000023'::uuid],9800,'paid',now() - interval '18 days'),
  ('d1000000-0000-0000-0000-000000000013','55555555-5555-5555-5555-000000000002',ARRAY['c0000000-0000-0000-0000-000000000004'::uuid],7500,'paid',now() - interval '24 days'),
  ('d1000000-0000-0000-0000-000000000014','55555555-5555-5555-5555-000000000002',ARRAY['c0000000-0000-0000-0000-000000000021'::uuid],9000,'paid',now() - interval '14 days'),
  ('d1000000-0000-0000-0000-000000000015','55555555-5555-5555-5555-000000000003',ARRAY['c0000000-0000-0000-0000-000000000015'::uuid],16500,'paid',now() - interval '20 days'),
  ('d1000000-0000-0000-0000-000000000016','55555555-5555-5555-5555-000000000003',ARRAY['c0000000-0000-0000-0000-000000000028'::uuid],2000,'paid',now() - interval '6 days'),
  ('d1000000-0000-0000-0000-000000000017','55555555-5555-5555-5555-000000000004',ARRAY['c0000000-0000-0000-0000-000000000002'::uuid],6500,'paid',now() - interval '22 days'),
  ('d1000000-0000-0000-0000-000000000018','55555555-5555-5555-5555-000000000004',ARRAY['c0000000-0000-0000-0000-000000000026'::uuid],4200,'paid',now() - interval '11 days'),
  ('d1000000-0000-0000-0000-000000000019','55555555-5555-5555-5555-000000000005',ARRAY['c0000000-0000-0000-0000-000000000008'::uuid],2400,'paid',now() - interval '17 days'),
  ('d1000000-0000-0000-0000-000000000020','55555555-5555-5555-5555-000000000005',ARRAY['c0000000-0000-0000-0000-000000000022'::uuid],15000,'paid',now() - interval '9 days'),
  ('d1000000-0000-0000-0000-000000000021','55555555-5555-5555-5555-000000000006',ARRAY['c0000000-0000-0000-0000-000000000017'::uuid],5800,'paid',now() - interval '15 days'),
  ('d1000000-0000-0000-0000-000000000022','55555555-5555-5555-5555-000000000006',ARRAY['c0000000-0000-0000-0000-000000000018'::uuid],3200,'paid',now() - interval '7 days'),
  ('d1000000-0000-0000-0000-000000000023','55555555-5555-5555-5555-000000000006',ARRAY['c0000000-0000-0000-0000-000000000019'::uuid],4500,'paid',now() - interval '5 days'),

  -- Kafe Flora
  ('d1000000-0000-0000-0000-000000000024','66666666-6666-6666-6666-000000000001',ARRAY['c0000000-0000-0000-0000-000000000024'::uuid],6200,'paid',now() - interval '12 days'),
  ('d1000000-0000-0000-0000-000000000025','66666666-6666-6666-6666-000000000002',ARRAY['c0000000-0000-0000-0000-000000000013'::uuid],8200,'paid',now() - interval '9 days'),
  ('d1000000-0000-0000-0000-000000000026','66666666-6666-6666-6666-000000000003',ARRAY['c0000000-0000-0000-0000-000000000030'::uuid],4200,'paid',now() - interval '6 days'),
  ('d1000000-0000-0000-0000-000000000027','66666666-6666-6666-6666-000000000004',ARRAY['c0000000-0000-0000-0000-000000000010'::uuid],62000,'paid',now() - interval '4 days'),

  -- Extra paid selections so EVERY provider has >=3 vouchers (some providers had only 1 so far)
  -- Cover providers: 1(fitness),2(femra),3(ritual),4(LIFT),5(Oda),6(Artigiano),9(Zenith),10(Elite),
  --                  11(SpaLav),12(Albtravel),13(Mediplus),14(Berlitz),15(Mullixhiu),16(Thalasso),17(Conad),18(Yoga)
  ('d1000000-0000-0000-0000-000000000030','55555555-5555-5555-5555-000000000004',ARRAY['c0000000-0000-0000-0000-000000000001'::uuid],8500,'paid',now() - interval '30 days'),
  ('d1000000-0000-0000-0000-000000000031','66666666-6666-6666-6666-000000000003',ARRAY['c0000000-0000-0000-0000-000000000002'::uuid],6500,'paid',now() - interval '25 days'),
  ('d1000000-0000-0000-0000-000000000032','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000003'::uuid],5500,'paid',now() - interval '19 days'),
  ('d1000000-0000-0000-0000-000000000033','55555555-5555-5555-5555-000000000003',ARRAY['c0000000-0000-0000-0000-000000000004'::uuid],7500,'paid',now() - interval '17 days'),
  ('d1000000-0000-0000-0000-000000000034','22222222-2222-2222-2222-222222222225',ARRAY['c0000000-0000-0000-0000-000000000005'::uuid],3500,'paid',now() - interval '15 days'),
  ('d1000000-0000-0000-0000-000000000035','55555555-5555-5555-5555-000000000005',ARRAY['c0000000-0000-0000-0000-000000000006'::uuid],2800,'paid',now() - interval '13 days'),
  ('d1000000-0000-0000-0000-000000000036','66666666-6666-6666-6666-000000000001',ARRAY['c0000000-0000-0000-0000-000000000009'::uuid],55000,'paid',now() - interval '11 days'),
  ('d1000000-0000-0000-0000-000000000037','22222222-2222-2222-2222-222222222224',ARRAY['c0000000-0000-0000-0000-000000000010'::uuid],62000,'paid',now() - interval '9 days'),
  ('d1000000-0000-0000-0000-000000000038','55555555-5555-5555-5555-000000000001',ARRAY['c0000000-0000-0000-0000-000000000013'::uuid],8200,'paid',now() - interval '7 days'),
  ('d1000000-0000-0000-0000-000000000039','55555555-5555-5555-5555-000000000006',ARRAY['c0000000-0000-0000-0000-000000000011'::uuid],4500,'paid',now() - interval '5 days'),
  ('d1000000-0000-0000-0000-000000000040','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000016'::uuid],68000,'paid',now() - interval '23 days'),
  ('d1000000-0000-0000-0000-000000000041','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000026'::uuid],4200,'paid',now() - interval '3 days'),
  ('d1000000-0000-0000-0000-000000000042','55555555-5555-5555-5555-000000000002',ARRAY['c0000000-0000-0000-0000-000000000027'::uuid],5000,'paid',now() - interval '4 days'),
  ('d1000000-0000-0000-0000-000000000043','66666666-6666-6666-6666-000000000002',ARRAY['c0000000-0000-0000-0000-000000000028'::uuid],2000,'paid',now() - interval '8 days'),
  ('d1000000-0000-0000-0000-000000000044','55555555-5555-5555-5555-000000000004',ARRAY['c0000000-0000-0000-0000-000000000030'::uuid],4200,'paid',now() - interval '6 days'),
  ('d1000000-0000-0000-0000-000000000045','44444444-4444-4444-4444-444444444444',ARRAY['c0000000-0000-0000-0000-000000000024'::uuid],6200,'paid',now() - interval '10 days'),
  ('d1000000-0000-0000-0000-000000000046','66666666-6666-6666-6666-000000000004',ARRAY['c0000000-0000-0000-0000-000000000020'::uuid],12000,'paid',now() - interval '13 days'),
  ('d1000000-0000-0000-0000-000000000047','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000022'::uuid],15000,'paid',now() - interval '20 days'),

  -- Pending selections (employer dashboard approvals)
  ('d2000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',ARRAY['c0000000-0000-0000-0000-000000000016'::uuid],68000,'pending',now() - interval '2 days'),
  ('d2000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222224',ARRAY['c0000000-0000-0000-0000-000000000022'::uuid],15000,'pending',now() - interval '1 day'),
  ('d2000000-0000-0000-0000-000000000003','55555555-5555-5555-5555-000000000003',ARRAY['c0000000-0000-0000-0000-000000000009'::uuid],55000,'pending',now() - interval '2 days'),
  ('d2000000-0000-0000-0000-000000000004','55555555-5555-5555-5555-000000000006',ARRAY['c0000000-0000-0000-0000-000000000012'::uuid],5200,'pending',now() - interval '1 day'),
  ('d2000000-0000-0000-0000-000000000005','66666666-6666-6666-6666-000000000003',ARRAY['c0000000-0000-0000-0000-000000000023'::uuid],9800,'pending',now() - interval '12 hours'),

  -- Approved (not yet paid)
  ('d3000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',ARRAY['c0000000-0000-0000-0000-000000000021'::uuid],9000,'approved',now() - interval '3 days'),
  ('d3000000-0000-0000-0000-000000000002','55555555-5555-5555-5555-000000000005',ARRAY['c0000000-0000-0000-0000-000000000007'::uuid],2200,'approved',now() - interval '2 days'),

  -- Rejected
  ('d4000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222225',ARRAY['c0000000-0000-0000-0000-000000000016'::uuid],68000,'rejected',now() - interval '6 days'),
  ('d4000000-0000-0000-0000-000000000002','66666666-6666-6666-6666-000000000004',ARRAY['c0000000-0000-0000-0000-000000000016'::uuid],68000,'rejected',now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ---------- 9. Mark one voucher per provider as redeemed ----------
-- Idempotent: only flips a 'valid' voucher; on re-run all are already 'redeemed' or none qualify.
WITH first_per_provider AS (
  SELECT DISTINCT ON (provider_id) id, provider_id
  FROM public.vouchers
  WHERE status = 'valid'
  ORDER BY provider_id, created_at ASC
)
UPDATE public.vouchers v
   SET status = 'redeemed',
       redeemed_at = now() - interval '2 days',
       redeemed_by_provider_id = v.provider_id
  FROM first_per_provider f
 WHERE v.id = f.id;
