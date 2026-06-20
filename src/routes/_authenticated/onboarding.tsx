import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useProfile, dashboardPathForRole } from "@/lib/use-profile";
import { Wordmark, LangToggle } from "@/components/site-header";
import type { Role } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Mirësevini · PERX" },
      {
        name: "description",
        content: "Disa hapa të shpejtë për të personalizuar përvojën tuaj në PERX.",
      },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { data: profile, isLoading, refetch } = useProfile();
  const sq = locale === "sq";
  const o = t.onboarding;
  const [resolvedRole, setResolvedRole] = useState<Role | null>(null);
  const [roleResolving, setRoleResolving] = useState(true);

  // If onboarding is already complete, bounce to dashboard.
  useEffect(() => {
    if (profile?.onboarding_complete) {
      navigate({ to: dashboardPathForRole(profile.role), replace: true });
    }
  }, [profile, navigate]);

  // Resolve the user's role: profile first, then auth user_metadata.
  // If found on metadata but missing on profile, persist it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile) return;
      if (profile.role) {
        if (!cancelled) {
          setResolvedRole(profile.role);
          setRoleResolving(false);
        }
        return;
      }
      const { data } = await supabase.auth.getUser();
      const meta = (data.user?.user_metadata ?? {}) as { role?: Role };
      if (meta.role === "employee" || meta.role === "employer" || meta.role === "provider") {
        await supabase.from("profiles").update({ role: meta.role }).eq("id", profile.id);
        await refetch();
        if (!cancelled) {
          setResolvedRole(meta.role);
          setRoleResolving(false);
        }
        return;
      }
      if (!cancelled) {
        setResolvedRole(null);
        setRoleResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, refetch]);

  async function chooseRole(r: Role) {
    if (!profile) return;
    setRoleResolving(true);
    await supabase.from("profiles").update({ role: r }).eq("id", profile.id);
    await refetch();
    setResolvedRole(r);
    setRoleResolving(false);
  }

  if (isLoading || !profile || roleResolving) {
    return (
      <Shell sq={sq}>
        <div className="hairline rounded-3xl bg-paper p-10 text-sm text-ink/50">
          {sq ? "Po përgatisim…" : "Getting things ready…"}
        </div>
      </Shell>
    );
  }

  if (!resolvedRole) {
    return (
      <Shell sq={sq}>
        <RolePicker sq={sq} onPick={chooseRole} />
      </Shell>
    );
  }

  const role: Role = resolvedRole;

  return (
    <Shell sq={sq}>
      <Progress sq={sq} role={role} />
      <div className="mt-5 hairline overflow-hidden rounded-3xl bg-paper">
        <div className="border-b border-[var(--hairline)] bg-parchment/60 px-7 py-5 sm:px-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper-dark">
            {t.roles[role]}
          </div>
          <h1 className="mt-1.5 font-display text-2xl leading-tight tracking-tight sm:text-3xl">
            {o[role].title}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink/65">{o[role].subtitle}</p>
        </div>
        <div className="p-7 sm:p-10">
          {role === "employee" && (
            <EmployeeForm
              profileId={profile.id}
              initialFullName={profile.full_name ?? ""}
              onDone={async (r) => after(r, refetch, navigate)}
            />
          )}
          {role === "employer" && (
            <EmployerForm
              profileId={profile.id}
              initialFullName={profile.full_name ?? ""}
              onDone={async (r) => after(r, refetch, navigate)}
            />
          )}
          {role === "provider" && (
            <ProviderForm
              profileId={profile.id}
              initialFullName={profile.full_name ?? ""}
              onDone={async (r) => after(r, refetch, navigate)}
            />
          )}
        </div>
      </div>
    </Shell>
  );
}

function RolePicker({ sq, onPick }: { sq: boolean; onPick: (r: Role) => void }) {
  const items: { id: Role; titleSq: string; titleEn: string; bodySq: string; bodyEn: string }[] = [
    {
      id: "employee",
      titleSq: "Punonjës",
      titleEn: "Employee",
      bodySq: "Zgjidh interesat dhe fillo të përfitosh.",
      bodyEn: "Pick your interests and start enjoying benefits.",
    },
    {
      id: "employer",
      titleSq: "Punëdhënës",
      titleEn: "Employer",
      bodySq: "Vendos kompaninë, buxhetin dhe planin.",
      bodyEn: "Set up your company, budget and plan.",
    },
    {
      id: "provider",
      titleSq: "Ofrues shërbimi",
      titleEn: "Service provider",
      bodySq: "Shto biznesin dhe ofertat — falas.",
      bodyEn: "Add your business and offers — free.",
    },
  ];
  return (
    <div className="hairline overflow-hidden rounded-3xl bg-paper p-7 sm:p-10">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
        {sq ? "Çfarë rolesh ke?" : "What's your role?"}
      </div>
      <h1 className="mt-1.5 font-display text-2xl leading-tight tracking-tight sm:text-3xl">
        {sq ? "Le ta personalizojmë përvojën." : "Let's tailor your experience."}
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick(r.id)}
            className="btn-press flex h-full flex-col rounded-2xl border border-[var(--hairline)] bg-paper p-4 text-left hover:border-copper"
          >
            <div className="font-display text-base">{sq ? r.titleSq : r.titleEn}</div>
            <div className="mt-1 text-xs text-ink/65">{sq ? r.bodySq : r.bodyEn}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

async function after(
  role: Role,
  refetch: () => Promise<unknown>,
  navigate: ReturnType<typeof useNavigate>,
) {
  await refetch();
  navigate({ to: dashboardPathForRole(role), replace: true });
}

function Shell({ children, sq }: { children: React.ReactNode; sq: boolean }) {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link to="/" className="btn-press text-sm text-ink/70 hover:text-ink">
              {sq ? "Dil" : "Exit"}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
    </div>
  );
}

function Progress({ sq, role }: { sq: boolean; role: Role }) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink/55">
      <span className="inline-flex h-6 items-center rounded-full bg-copper-light/60 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-copper-dark">
        {sq ? "Hapi 1 nga 1" : "Step 1 of 1"}
      </span>
      <span>
        {sq ? "Pothuajse gati — më pak se një minutë." : "Almost there — under a minute."}
      </span>
      <span className="ml-auto hidden sm:inline">{role}</span>
    </div>
  );
}

/* ---------------- Shared form atoms ---------------- */

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink/55">{children}</div>
      {hint ? <div className="mt-1 text-xs text-ink/50">{hint}</div> : null}
    </div>
  );
}

function inputCls(hasError: boolean, mono = false) {
  return `block w-full rounded-xl border bg-parchment px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:bg-paper ${
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[var(--hairline)] focus:border-copper"
  } ${mono ? "font-mono-num text-base tracking-tight" : ""}`;
}

function ErrorLine({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="mt-1.5 text-xs text-red-600">{msg}</div>;
}

function Select({
  value,
  onChange,
  options,
  hasError,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hasError: boolean;
  placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls(hasError)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SubmitBar({
  loading,
  label,
  savingLabel,
}: {
  loading: boolean;
  label: string;
  savingLabel: string;
}) {
  return (
    <div className="mt-7 flex items-center justify-end">
      <button
        type="submit"
        disabled={loading}
        className="btn-press inline-flex items-center justify-center rounded-full bg-copper px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(255,122,51,0.7)] hover:bg-copper-dark disabled:opacity-60"
      >
        {loading ? savingLabel : label}
      </button>
    </div>
  );
}

/* ---------------- Employee form ---------------- */

function EmployeeForm({
  profileId,
  initialFullName,
  onDone,
}: {
  profileId: string;
  initialFullName: string;
  onDone: (r: Role) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const c = t.onboarding;
  const o = c.employee;
  const [fullName, setFullName] = useState(initialFullName);
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().trim().min(1, c.common.fullNameError).max(120),
        jobTitle: z.string().trim().min(1, o.jobTitleError).max(120),
        department: z.string().min(1, o.departmentError),
        interests: z.array(z.string()).min(1, o.interestsError),
      }),
    [c, o],
  );

  function toggle(v: string) {
    setInterests((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, jobTitle, department, interests });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[i.path[0] as string] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.fullName,
          job_title: parsed.data.jobTitle,
          department: parsed.data.department,
          interests: parsed.data.interests,
          onboarding_complete: true,
        })
        .eq("id", profileId);
      if (error) throw error;
      await onDone("employee");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label>{c.common.fullName}</Label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={c.common.fullNamePlaceholder}
          className={inputCls(!!errors.fullName)}
          autoComplete="name"
        />
        <ErrorLine msg={errors.fullName} />
      </div>
      <div>
        <Label>{o.jobTitle}</Label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder={o.jobTitlePlaceholder}
          className={inputCls(!!errors.jobTitle)}
        />
        <ErrorLine msg={errors.jobTitle} />
      </div>
      <div>
        <Label>{o.department}</Label>
        <Select
          value={department}
          onChange={setDepartment}
          options={o.departmentOptions}
          hasError={!!errors.department}
          placeholder="—"
        />
        <ErrorLine msg={errors.department} />
      </div>
      <div>
        <Label hint={o.interestsHint}>{o.interests}</Label>
        <div className="flex flex-wrap gap-2">
          {o.interestsOptions.map((it) => {
            const active = interests.includes(it.value);
            return (
              <button
                type="button"
                key={it.value}
                onClick={() => toggle(it.value)}
                className={`btn-press rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-copper bg-copper text-white shadow-[0_8px_24px_-14px_rgba(255,122,51,0.7)]"
                    : "border-[var(--hairline)] bg-parchment text-ink/75 hover:border-ink/25"
                }`}
              >
                {it.label}
              </button>
            );
          })}
        </div>
        <ErrorLine msg={errors.interests} />
      </div>
      <SubmitBar loading={loading} label={c.submit} savingLabel={c.saving} />
    </form>
  );
}

/* ---------------- Employer form (multi-step + simulated payment) ---------------- */

import {
  ANNUAL_LICENSE_PER_EMPLOYEE_L,
  annualLicenseTotalL,
  lekToEur,
  DEFAULT_MONTHLY_BUDGET_PER_EMPLOYEE_L,
  monthlyLicensePerEmployeeL,
} from "@/lib/pricing";
import { applyCompanyBrand } from "@/lib/brand-theme";
import { formatNumber, formatEur } from "@/lib/use-marketplace";
import { ENABLE_DEMO_MODE } from "@/lib/demo-mode";
import { Check, CreditCard, ArrowLeft } from "lucide-react";

const PERX_BRAND_DEFAULT = "#0E7C66";

type EmployerStep = 1 | 2 | 3 | 4;

function EmployerForm({
  profileId,
  initialFullName,
  onDone,
}: {
  profileId: string;
  initialFullName: string;
  onDone: (r: Role) => void | Promise<void>;
}) {
  const { t, locale } = useLocale();
  const sq = locale === "sq";
  const c = t.onboarding;
  const o = c.employer;
  const [step, setStep] = useState<EmployerStep>(1);

  // Step 1 fields
  const [fullName] = useState(initialFullName); // admin name comes from profile, read-only
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [brandPrimary, setBrandPrimary] = useState(PERX_BRAND_DEFAULT);
  const [brandSecondary, setBrandSecondary] = useState("");
  const [emailDomains, setEmailDomains] = useState("");

  // Step 2 fields
  const [employees, setEmployees] = useState("");
  const [budget, setBudget] = useState(String(DEFAULT_MONTHLY_BUDGET_PER_EMPLOYEE_L));

  // Step 3 fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paying, setPaying] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Live brand preview while picking
  useEffect(() => {
    applyCompanyBrand(brandPrimary);
  }, [brandPrimary]);
  useEffect(
    () => () => {
      applyCompanyBrand(null);
    },
    [],
  );

  const step1Schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, o.companyNameError).max(160),
        industry: z.string().min(1, o.industryError),
      }),
    [o],
  );

  const step2Schema = useMemo(
    () =>
      z.object({
        employees: z.coerce.number().int().min(1, o.employeeCountError).max(1_000_000),
        budget: z.coerce.number().int().min(0, o.budgetError).max(10_000_000),
      }),
    [o],
  );

  const employeesNum = Math.max(0, Math.floor(Number(employees) || 0));
  const budgetNum = Math.max(0, Math.floor(Number(budget) || 0));
  const annualLicense = annualLicenseTotalL(employeesNum);
  const annualWelfare = budgetNum * employeesNum * 12;

  function goNextFromStep1() {
    const parsed = step1Schema.safeParse({ name, industry });
    if (!parsed.success) {
      const m: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        m[i.path[0] as string] = i.message;
      });
      setErrors(m);
      return;
    }
    setErrors({});
    setStep(2);
  }

  function goNextFromStep2() {
    const parsed = step2Schema.safeParse({ employees, budget });
    if (!parsed.success) {
      const m: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        m[i.path[0] as string] = i.message;
      });
      setErrors(m);
      return;
    }
    setErrors({});
    setStep(3);
  }

  function parseDomains(raw: string): string[] {
    return raw
      .split(/[,\s]+/)
      .map((d) => d.trim())
      .filter(Boolean);
  }

  async function persist(planActive: boolean) {
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          onboarding_complete: true,
        })
        .eq("id", profileId);
      if (pErr) throw pErr;

      const now = new Date();
      const renews = new Date(now);
      renews.setFullYear(renews.getFullYear() + 1);

      const upsertPayload: Record<string, unknown> = {
        owner_id: profileId,
        name,
        industry,
        employee_count: employeesNum,
        monthly_budget_per_employee_lek: budgetNum,
        brand_primary: brandPrimary || null,
        brand_secondary: brandSecondary || null,
        employee_email_domains: parseDomains(emailDomains),
        plan_status: planActive ? "active" : "trial",
        plan_amount_l: planActive ? annualLicense : null,
        plan_employees_count: planActive ? employeesNum : null,
        plan_paid_at: planActive ? now.toISOString() : null,
        plan_renews_at: planActive ? renews.toISOString() : null,
      };
      // companies columns added in a recent migration are not yet in generated types
      const { error: cErr } = await (supabase.from("companies") as any).upsert(upsertPayload, {
        onConflict: "owner_id",
      });
      if (cErr) throw cErr;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setSaving(false);
      throw err;
    }
  }

  async function pay() {
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      await persist(true);
      setStep(4);
    } catch {
      /* toast already shown */
    } finally {
      setPaying(false);
    }
  }

  async function skip() {
    try {
      await persist(false);
      await onDone("employer");
    } catch {
      /* toast already shown */
    }
  }

  function fillTestCard() {
    setCardNumber("4242 4242 4242 4242");
    setCardExp("12 / 29");
    setCardCvc("123");
  }

  /* ----- step indicator ----- */
  const StepDots = () => (
    <div className="mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">
      <span>{o.stepLabel(step === 4 ? 3 : step, 3)}</span>
      <span className="ml-1 flex items-center gap-1.5">
        {[1, 2, 3].map((n) => {
          const active = step >= n;
          return (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all ${active ? "w-7 bg-brand" : "w-3 bg-ink/15"}`}
            />
          );
        })}
      </span>
    </div>
  );

  /* ----- Step 1: company details ----- */
  if (step === 1) {
    return (
      <div>
        <StepDots />
        <h2 className="font-display text-xl font-medium tracking-tight">{o.step1Title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNextFromStep1();
          }}
          className="mt-5 space-y-5"
        >
          <div className="flex items-center justify-between rounded-xl border border-[var(--hairline)] bg-parchment px-4 py-3 text-sm">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
              {o.adminLabel}
            </span>
            <span className="font-medium text-ink/80">{fullName || "—"}</span>
          </div>
          <div>
            <Label>{o.companyName}</Label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={o.companyNamePlaceholder}
              className={inputCls(!!errors.name)}
              autoComplete="organization"
            />
            <ErrorLine msg={errors.name} />
          </div>
          <div>
            <Label>{o.industry}</Label>
            <Select
              value={industry}
              onChange={setIndustry}
              options={o.industryOptions}
              hasError={!!errors.industry}
              placeholder="—"
            />
            <ErrorLine msg={errors.industry} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label hint={o.brandPrimaryHint}>{o.brandPrimary}</Label>
              <ColorField value={brandPrimary} onChange={setBrandPrimary} />
            </div>
            <div>
              <Label hint={o.brandSecondaryHint}>{o.brandSecondary}</Label>
              <ColorField value={brandSecondary} onChange={setBrandSecondary} allowEmpty />
            </div>
          </div>

          <div>
            <Label hint={o.emailDomainsHint}>{o.emailDomains}</Label>
            <input
              type="text"
              value={emailDomains}
              onChange={(e) => setEmailDomains(e.target.value)}
              placeholder={o.emailDomainsPlaceholder}
              className={inputCls(false)}
            />
          </div>

          <div className="mt-7 flex items-center justify-end">
            <button
              type="submit"
              className="btn-press inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--brand)_60%,transparent)] hover:bg-brand-dark"
            >
              {o.next}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ----- Step 2: plan & budget ----- */
  if (step === 2) {
    return (
      <div>
        <StepDots />
        <h2 className="font-display text-xl font-medium tracking-tight">{o.step2Title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNextFromStep2();
          }}
          className="mt-5 space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>{o.employeeCount}</Label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                placeholder={o.employeeCountPlaceholder}
                className={inputCls(!!errors.employees, true)}
              />
              <ErrorLine msg={errors.employees} />
            </div>
            <div>
              <Label hint={o.budgetHint}>{o.budget}</Label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  className={`${inputCls(!!errors.budget, true)} pr-16`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium uppercase tracking-[0.14em] text-ink/45">
                  {o.budgetSuffix}
                </span>
              </div>
              <ErrorLine msg={errors.budget} />
            </div>
          </div>

          {/* Pricing summary — hero is per-employee per-month */}
          <div className="hairline rounded-2xl bg-brand-soft p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">
              {o.pricingKicker}
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono-num text-4xl font-semibold tracking-tight text-ink">
                {o.pricingHeroPerMonth}
              </span>
            </div>
            <div className="mt-1 text-xs text-ink/55">{o.pricingHeroSub}</div>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-[var(--hairline)] pt-3">
              <span className="text-xs uppercase tracking-[0.14em] text-ink/55">
                {o.pricingAnnualLabel}
              </span>
              <span className="text-right">
                <span className="font-mono-num text-base font-medium text-ink/80">
                  {formatNumber(annualLicense)} L
                </span>
                <span className="ml-2 text-xs text-ink/55">
                  ≈ {formatEur(lekToEur(annualLicense))} {o.pricingPerYear}
                </span>
              </span>
            </div>
            <div className="mt-1 text-[11px] text-ink/45">
              {employeesNum > 0
                ? `${employeesNum} × ${formatNumber(monthlyLicensePerEmployeeL())} L/mo`
                : o.pricingPerEmployee}
            </div>
            <div className="mt-3 text-xs text-ink/60">{o.pricingReassurance}</div>
          </div>

          {/* Welfare pool (separate) */}
          <div className="hairline rounded-2xl bg-paper p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">
              {o.welfarePoolTitle}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num text-3xl font-semibold tracking-tight">
                {formatNumber(annualWelfare)}
              </span>
              <span className="text-sm text-ink/60">L /{sq ? "vit" : "yr"}</span>
            </div>
            <div className="mt-1 text-xs text-ink/55">{o.welfarePoolHint}</div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-ink/65 hover:text-ink"
            >
              <ArrowLeft size={14} /> {o.back}
            </button>
            <button
              type="submit"
              className="btn-press inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--brand)_60%,transparent)] hover:bg-brand-dark"
            >
              {o.next}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ----- Step 3: payment ----- */
  if (step === 3) {
    return (
      <div>
        <StepDots />
        <h2 className="font-display text-xl font-medium tracking-tight">{o.payTitle}</h2>
        <p className="mt-1 text-sm text-ink/60">{o.paySubtitle}</p>

        {/* Summary */}
        <div className="mt-5 hairline rounded-2xl bg-brand-soft p-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">
                {o.pricingTitle}
              </div>
              <div className="mt-1 text-xs text-ink/60">
                {employeesNum} × {formatNumber(ANNUAL_LICENSE_PER_EMPLOYEE_L)} L
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono-num text-3xl font-semibold tracking-tight">
                {formatNumber(annualLicense)} L
              </div>
              <div className="text-xs text-ink/55">
                ≈ {formatEur(lekToEur(annualLicense))} {o.pricingPerYear}
              </div>
            </div>
          </div>
        </div>

        {/* Mock card form */}
        <div className="mt-5 hairline rounded-2xl bg-paper p-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-ink/80">
              <CreditCard size={16} /> {o.payCardLabel}
            </div>
            {ENABLE_DEMO_MODE ? (
              <button
                type="button"
                onClick={fillTestCard}
                className="btn-press text-xs font-medium text-brand hover:underline"
              >
                {o.payUseTestCard}
              </button>
            ) : null}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder={o.payCardPlaceholder}
            className={`${inputCls(false, true)} mt-2`}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label>{o.payExpLabel}</Label>
              <input
                type="text"
                value={cardExp}
                onChange={(e) => setCardExp(e.target.value)}
                placeholder="MM / YY"
                className={inputCls(false, true)}
              />
            </div>
            <div>
              <Label>{o.payCvcLabel}</Label>
              <input
                type="text"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                placeholder="123"
                className={inputCls(false, true)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {ENABLE_DEMO_MODE ? (
            <button
              type="button"
              onClick={skip}
              disabled={paying || saving}
              className="btn-press inline-flex items-center justify-center rounded-full border border-[var(--hairline)] bg-parchment px-5 py-3 text-sm font-medium text-ink/75 hover:bg-paper disabled:opacity-60"
            >
              {o.paySkip}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={pay}
            disabled={paying || saving}
            className="btn-press inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--brand)_60%,transparent)] hover:bg-brand-dark disabled:opacity-60"
          >
            {paying ? o.payProcessing : o.payButton(annualLicense)}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn-press text-xs text-ink/55 hover:text-ink"
          >
            <ArrowLeft size={12} className="-mt-0.5 mr-1 inline" /> {o.back}
          </button>
        </div>
      </div>
    );
  }

  /* ----- Step 4: success ----- */
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_18px_40px_-16px_color-mix(in_oklab,var(--brand)_60%,transparent)]">
        <Check size={28} strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 font-display text-2xl font-medium tracking-tight">{o.paySuccess}</h2>
      <p className="mt-1.5 text-sm text-ink/65">{o.paySuccessBody}</p>
      <div className="mt-2 font-mono-num text-sm text-ink/55">
        {formatNumber(annualLicense)} L · ≈ {formatEur(lekToEur(annualLicense))}
      </div>
      <button
        type="button"
        onClick={() => onDone("employer")}
        className="btn-press mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-dark"
      >
        {o.payGoDashboard}
      </button>
    </div>
  );
}

function ColorField({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  const display = value || (allowEmpty ? "" : PERX_BRAND_DEFAULT);
  const swatch = value || "#FFFFFF";
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[var(--hairline)]"
        style={{ background: swatch }}
        aria-label="Color picker"
      >
        <input
          type="color"
          value={value || PERX_BRAND_DEFAULT}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {!value && allowEmpty ? <span className="text-xs text-ink/45">—</span> : null}
      </label>
      <input
        type="text"
        value={display}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#0E7C66"
        className={`${inputCls(false, true)} flex-1 uppercase`}
      />
      {allowEmpty && value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="btn-press text-xs text-ink/50 hover:text-ink"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

/* ---------------- Provider form (minimal, free) ---------------- */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProviderForm({
  profileId,
  initialFullName,
  onDone,
}: {
  profileId: string;
  initialFullName: string;
  onDone: (r: Role) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const c = t.onboarding;
  const o = c.provider;
  const [fullName] = useState(initialFullName); // contact name comes from profile (signup), read-only
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        businessName: z.string().trim().min(1, o.businessNameError).max(160),
        contactEmail: z.string().trim().email(o.contactEmailError).max(160),
        category: z.string().min(1, o.categoryError),
        city: z.string().trim().min(1, o.cityError).max(80),
      }),
    [o],
  );

  function pickLogo(file: File | null) {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(o.uploadFailed);
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function uploadLogoIfAny(): Promise<string | null> {
    if (!logoFile) return null;
    const ext =
      (logoFile.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${profileId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("provider-logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type || undefined });
    if (upErr) throw upErr;
    // Bucket is private — generate a long-lived signed URL so <img> tags work.
    const tenYears = 60 * 60 * 24 * 365 * 10;
    const { data, error: sErr } = await supabase.storage
      .from("provider-logos")
      .createSignedUrl(path, tenYears);
    if (sErr || !data?.signedUrl) throw sErr ?? new Error("Signed URL failed");
    return data.signedUrl;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ businessName, contactEmail, category, city });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[i.path[0] as string] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      let logoUrl: string | null = null;
      try {
        logoUrl = await uploadLogoIfAny();
      } catch (err) {
        toast.error(o.uploadFailed);
        console.error(err);
      }

      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          onboarding_complete: true,
        })
        .eq("id", profileId);
      if (pErr) throw pErr;

      const providerRow: Record<string, unknown> = {
        owner_id: profileId,
        business_name: parsed.data.businessName,
        category: parsed.data.category,
        city: parsed.data.city,
        description: tagline.trim() || null,
      };
      if (logoUrl) providerRow.logo_url = logoUrl;

      const { data: providerData, error: prErr } = await (supabase.from("providers") as any)
        .upsert(providerRow, { onConflict: "owner_id" })
        .select("id")
        .single();
      if (prErr) throw prErr;

      if (parsed.data.contactEmail && providerData?.id) {
        await (supabase as any).from("provider_contacts").upsert(
          {
            provider_id: providerData.id,
            contact_email: parsed.data.contactEmail,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider_id" },
        );
      }
      await onDone("provider");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const monogram = initials(businessName || fullName || "?");

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Free banner */}
      <div className="hairline rounded-2xl bg-parchment/70 p-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
          <Check className="size-3.5" /> {o.freeBadge}
        </div>
        <p className="mt-2 text-sm text-ink/65">{o.freeRationale}</p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[var(--hairline)] bg-parchment px-4 py-3 text-sm">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
          {c.common.fullName}
        </span>
        <span className="font-medium text-ink/80">{fullName || "—"}</span>
      </div>

      <div>
        <Label>{o.businessName}</Label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={o.businessNamePlaceholder}
          className={inputCls(!!errors.businessName)}
          autoComplete="organization"
        />
        <ErrorLine msg={errors.businessName} />
      </div>

      <div>
        <Label>{o.contactEmail}</Label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder={o.contactEmailPlaceholder}
          className={inputCls(!!errors.contactEmail)}
          autoComplete="email"
        />
        <ErrorLine msg={errors.contactEmail} />
      </div>

      {/* Logo */}
      <div>
        <Label hint={o.logoHint}>{o.logo}</Label>
        <div className="flex items-center gap-4">
          <div
            className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--hairline)] bg-parchment text-base font-semibold text-ink/70"
            aria-hidden
          >
            {logoPreview ? (
              <img src={logoPreview} alt="" className="size-full object-cover" />
            ) : (
              <span className="font-mono-num">{monogram}</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <label className="btn-press inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-ink/25">
              {logoPreview ? o.replaceLogo : o.uploadLogo}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            {logoPreview ? (
              <button
                type="button"
                onClick={() => pickLogo(null)}
                className="btn-press text-xs text-ink/55 hover:text-ink"
              >
                {o.removeLogo}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>{o.category}</Label>
          <Select
            value={category}
            onChange={setCategory}
            options={o.categoryOptions}
            hasError={!!errors.category}
            placeholder="—"
          />
          <ErrorLine msg={errors.category} />
        </div>
        <div>
          <Label>{o.city}</Label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={o.cityPlaceholder}
            className={inputCls(!!errors.city)}
            autoComplete="address-level2"
          />
          <ErrorLine msg={errors.city} />
        </div>
      </div>

      <div>
        <Label>{o.tagline}</Label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder={o.taglinePlaceholder}
          className={inputCls(false)}
          maxLength={140}
        />
      </div>

      <SubmitBar loading={loading} label={c.submit} savingLabel={c.saving} />
    </form>
  );
}
