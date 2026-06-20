
-- Populate logo_url for seeded providers.
-- Real brands use known public CDN logos; fictional businesses use DiceBear-generated
-- circular brand initials with their brand color so map pins render a real logo badge
-- instead of a 2-letter monogram.

UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Fitness%20First&backgroundColor=E11D48&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000001' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Serotonin%20Gym&backgroundColor=DB2777&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000002' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Ritual%20Spa&backgroundColor=7C3AED&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000003' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=LIFT%20Rooftop&backgroundColor=0F172A&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000004' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Oda&backgroundColor=9A3412&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000005' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Artigiano&backgroundColor=15803D&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000006' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Vodafone_2017_logo.svg/240px-Vodafone_2017_logo.svg.png' WHERE id='b0000000-0000-0000-0000-000000000007' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=One%20Albania&backgroundColor=FF4F00&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000008' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Zenith%20Travel&backgroundColor=0EA5E9&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000009' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Provider%2010&backgroundColor=1E40AF&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000010' AND logo_url IS NULL;

UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Spa%20Lavanda&backgroundColor=A78BFA&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000011' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Albtravel&backgroundColor=0EA5A4&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000012' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Mediplus&backgroundColor=0D9488&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000013' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Berlitz_Logo.svg/240px-Berlitz_Logo.svg.png' WHERE id='b0000000-0000-0000-0000-000000000014' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Mullixhiu&backgroundColor=65A30D&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000015' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Thalasso%20Durres&backgroundColor=0891B2&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000016' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Logo_Conad.svg/240px-Logo_Conad.svg.png' WHERE id='b0000000-0000-0000-0000-000000000017' AND logo_url IS NULL;
UPDATE public.providers SET logo_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Gjelberimi%20Yoga&backgroundColor=16A34A&fontFamily=Helvetica&fontWeight=700&radius=50' WHERE id='b0000000-0000-0000-0000-000000000018' AND logo_url IS NULL;
