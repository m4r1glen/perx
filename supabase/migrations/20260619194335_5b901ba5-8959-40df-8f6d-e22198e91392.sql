
-- Extend profiles with employee-side onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}'::text[];

-- Companies (employer onboarding)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  employee_count integer,
  monthly_budget_per_employee_lek integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert their company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their company"
  ON public.companies FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Providers (provider onboarding)
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  category text,
  city text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their provider"
  ON public.providers FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert their provider"
  ON public.providers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their provider"
  ON public.providers FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their provider"
  ON public.providers FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER providers_set_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
