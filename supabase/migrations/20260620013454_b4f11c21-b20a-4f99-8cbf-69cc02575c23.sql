
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS brand_secondary text,
  ADD COLUMN IF NOT EXISTS employee_email_domains text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS plan_amount_l integer,
  ADD COLUMN IF NOT EXISTS plan_employees_count integer,
  ADD COLUMN IF NOT EXISTS plan_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_plan_status_chk;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_plan_status_chk CHECK (plan_status IN ('trial', 'active'));
