import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { User, Building2, Store, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { dashboardPathForRole } from "@/lib/use-profile";
import type { Role } from "@/lib/i18n";
import { Wordmark, LangToggle } from "@/components/site-header";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Hyrje · PERX" },
      { name: "description", content: "Hyni ose krijoni një llogari në PERX." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

const ROLES: {
  id: Role;
  icon: LucideIcon;
  titleSq: string;
  titleEn: string;
  bodySq: string;
  bodyEn: string;
  nextSq: string;
  nextEn: string;
}[] = [
  {
    id: "employee",
    icon: User,
    titleSq: "Punonjës",
    titleEn: "Employee",
    bodySq: "Përdor benefitet që kompania ime ofron.",
    bodyEn: "Use the benefits my company offers.",
    nextSq: "Më pas: zgjidh interesat dhe fillo të përfitosh.",
    nextEn: "Next: pick your interests and start enjoying benefits.",
  },
  {
    id: "employer",
    icon: Building2,
    titleSq: "Biznes — Punëdhënës",
    titleEn: "Business — Employer",
    bodySq: "Drejtoj benefitet për ekipin tim.",
    bodyEn: "I run benefits for my team.",
    nextSq: "Më pas: vendos kompaninë, buxhetin dhe planin.",
    nextEn: "Next: set up your company, budget and plan.",
  },
  {
    id: "provider",
    icon: Store,
    titleSq: "Biznes — Ofrues Shërbimi",
    titleEn: "Business — Service Provider",
    bodySq: "Listoj shërbimet e biznesit tim në PERX.",
    bodyEn: "I list my business' services on PERX.",
    nextSq: "Më pas: shto biznesin dhe ofertat — falas.",
    nextEn: "Next: add your business and offers — free.",
  },
];

function AuthPage() {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // If already signed in, route them away from /auth.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        await routeAfterAuth(navigate);
      } else {
        setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const sq = locale === "sq";
  const copy = {
    signinTitle: sq ? "Mirësevini sërish." : "Welcome back.",
    signupTitle: sq ? "Krijo llogarinë tuaj." : "Create your account.",
    signinBody: sq
      ? "Hyni për të vazhduar te benefitet tuaja."
      : "Sign in to continue to your benefits.",
    signupBody: sq ? "Disa hapa të shpejtë për të filluar." : "A few quick steps to get started.",
    email: sq ? "Email" : "Email",
    password: sq ? "Fjalëkalimi" : "Password",
    fullName: sq ? "Emri i plotë" : "Full name",
    chooseRole: sq ? "Çfarë rolesh ke?" : "What's your role?",
    chooseRoleHint: sq
      ? "Zgjidh një — mund ta ndryshosh më vonë."
      : "Pick one — you can change it later.",
    submitSignin: sq ? "Hyr" : "Log in",
    submitSignup: sq ? "Regjistrohu" : "Sign up",
    toggleToSignup: sq ? "Nuk ke llogari? Regjistrohu" : "No account yet? Sign up",
    toggleToSignin: sq ? "Ke tashmë llogari? Hyr" : "Already have an account? Log in",
    or: sq ? "ose" : "or",
    google: sq ? "Vazhdo me Google" : "Continue with Google",
    backHome: sq ? "← Kthehu" : "← Back",
    needRole: sq ? "Zgjidh një rol për të vazhduar." : "Pick a role to continue.",
  };

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schema = z.object({
      email: z.string().trim().email(),
      password: z.string().min(6).max(72),
      fullName: mode === "signup" ? z.string().trim().min(1).max(120) : z.string().optional(),
    });
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (mode === "signup" && !role) {
      toast.error(copy.needRole);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success(sq ? "Llogaria u krijua." : "Account created.");
        // Ensure profile row reflects the chosen role even if the trigger lags or
        // the user previously signed up with no role. Best-effort, non-blocking.
        if (role) {
          const { data: userRes } = await supabase.auth.getUser();
          if (userRes.user) {
            await supabase
              .from("profiles")
              .update({ role, full_name: fullName })
              .eq("id", userRes.user.id);
          }
        }
        navigate({ to: "/onboarding", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        await routeAfterAuth(navigate);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth",
        },
      });
      if (error) throw error;
      if (!data.url) await routeAfterAuth(navigate);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link to="/" className="btn-press text-sm text-ink/70 hover:text-ink">
              {copy.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        {!bootstrapped ? (
          <div className="text-center text-sm text-ink/50">…</div>
        ) : (
          <div className="hairline overflow-hidden rounded-3xl bg-paper">
            {mode === "signup" && (
              <div className="border-b border-[var(--hairline)] bg-parchment p-7 sm:p-10">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
                  {copy.chooseRole}
                </div>
                <p className="mt-2 text-sm text-ink/65">{copy.chooseRoleHint}</p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {ROLES.map((r) => {
                    const active = role === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        aria-pressed={active}
                        className={`group flex h-full flex-col rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-copper bg-copper-light/60 shadow-[0_10px_30px_-20px_rgba(255,122,51,0.6)]"
                            : "border-[var(--hairline)] bg-paper hover:border-ink/20"
                        }`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                            active
                              ? "border-copper-dark bg-copper text-white"
                              : "border-[var(--hairline)] bg-parchment text-ink/70"
                          }`}
                          aria-hidden
                        >
                          <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <div className="mt-3 font-display text-base leading-tight">
                          {sq ? r.titleSq : r.titleEn}
                        </div>
                        <div className="mt-1 text-xs text-ink/65">{sq ? r.bodySq : r.bodyEn}</div>
                        <div
                          className={`mt-3 text-[11px] leading-snug ${active ? "text-copper-dark" : "text-ink/45"}`}
                        >
                          {sq ? r.nextSq : r.nextEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className={
                mode === "signup" ? "grid grid-cols-1" : "grid gap-0 md:grid-cols-[1.05fr_1fr]"
              }
            >
              {/* Form column */}
              <div className="p-7 sm:p-10">
                <ModeTabs mode={mode} setMode={setMode} sq={sq} />
                <h1 className="mt-6 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                  {mode === "signin" ? copy.signinTitle : copy.signupTitle}
                </h1>
                <p className="mt-2 max-w-md text-sm text-ink/65">
                  {mode === "signin" ? copy.signinBody : copy.signupBody}
                </p>

                <form className="mt-7 space-y-4" onSubmit={handleEmailSubmit}>
                  {mode === "signup" && (
                    <Field
                      label={copy.fullName}
                      type="text"
                      value={fullName}
                      onChange={setFullName}
                      autoComplete="name"
                    />
                  )}
                  <Field
                    label={copy.email}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                  />
                  <Field
                    label={copy.password}
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-press mt-2 inline-flex w-full items-center justify-center rounded-full bg-copper px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(255,122,51,0.7)] hover:bg-copper-dark disabled:opacity-60"
                  >
                    {loading ? "…" : mode === "signin" ? copy.submitSignin : copy.submitSignup}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-ink/40">
                  <span className="h-px flex-1 bg-[var(--hairline)]" />
                  {copy.or}
                  <span className="h-px flex-1 bg-[var(--hairline)]" />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogle}
                  className="btn-press inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-parchment px-5 py-3 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
                >
                  <GoogleGlyph />
                  {copy.google}
                </button>

                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="btn-press mt-6 block w-full text-center text-sm text-ink/65 hover:text-copper-dark"
                >
                  {mode === "signin" ? copy.toggleToSignup : copy.toggleToSignin}
                </button>
              </div>

              {/* Side hero column — sign-in only */}
              {mode === "signin" && (
                <div className="border-t border-[var(--hairline)] bg-parchment p-7 sm:p-10 md:border-l md:border-t-0">
                  <AsideHero sq={sq} />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-6 text-center text-xs text-ink/40">{t.footer.copyright}</div>
      </main>
    </div>
  );
}

function ModeTabs({ mode, setMode, sq }: { mode: Mode; setMode: (m: Mode) => void; sq: boolean }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--hairline)] bg-parchment p-0.5 text-xs font-medium">
      {(["signin", "signup"] as Mode[]).map((m) => {
        const active = m === mode;
        const label = m === "signin" ? (sq ? "Hyr" : "Log in") : sq ? "Regjistrohu" : "Sign up";
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`btn-press rounded-full px-4 py-1.5 ${
              active ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-ink/55">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1.5 block w-full rounded-xl border border-[var(--hairline)] bg-parchment px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-copper focus:bg-paper"
      />
    </label>
  );
}

function AsideHero({ sq }: { sq: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between gap-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">PERX</div>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight">
          {sq ? "Përfitime që njerëzit i duan vërtet." : "Benefits people actually love."}
        </h2>
        <p className="mt-3 text-sm text-ink/65">
          {sq
            ? "Tregu i benefiteve për ekipet moderne — i ndërtuar në Shqipëri."
            : "The benefits marketplace for modern teams — built in Albania."}
        </p>
      </div>
      <div className="hairline rounded-2xl bg-paper p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink/50">
          {sq ? "Kursimi mesatar" : "Average savings"}
        </div>
        <div className="mt-1 font-mono-num text-3xl font-semibold">23%</div>
        <div className="mt-1 text-xs text-ink/55">
          {sq ? "tatim për punonjësit dhe punëdhënësit." : "tax for employees and employers."}
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.6 36 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

/** Decide where to send a freshly-authenticated user. */
async function routeAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_complete) {
    navigate({ to: "/onboarding", replace: true });
    return;
  }
  navigate({ to: dashboardPathForRole(profile.role as Role | null), replace: true });
}
