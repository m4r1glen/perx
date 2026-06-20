import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import type { Role } from "@/lib/i18n";

const ROUTES: Record<Role, "/app/employee" | "/app/employer" | "/app/provider"> = {
  employee: "/app/employee",
  employer: "/app/employer",
  provider: "/app/provider",
};

type DemoAccount = {
  email: string;
  label: string;
  sub?: string;
};

const PASSWORD = "DemoPerx!2026";

const ACCOUNTS: Record<Role, DemoAccount[]> = {
  employer: [
    { email: "demo.employer@perx.al", label: "DigitalNova Shpk", sub: "Tech · 25 employees" },
    { email: "admin@adriatikbank.al", label: "Adriatik Bank", sub: "Finance · 40 employees" },
    { email: "admin@kafeflora.al", label: "Kafe Flora Group", sub: "Hospitality · 15 employees" },
  ],
  employee: [
    { email: "arta.k@perx.al", label: "Arta Kola", sub: "DigitalNova · Product (wellness-skewed)" },
    { email: "besnik.h@perx.al", label: "Besnik Hoxha", sub: "DigitalNova · Engineering" },
    { email: "eliona.s@perx.al", label: "Eliona Shehu", sub: "DigitalNova · Operations" },
    { email: "endrit.k@digitalnova.al", label: "Endrit Kraja", sub: "DigitalNova · Engineering" },
    { email: "klejda.m@digitalnova.al", label: "Klejda Marku", sub: "DigitalNova · Marketing" },
    { email: "edon.b@adriatikbank.al", label: "Edon Bregu", sub: "Adriatik Bank · Branch Manager" },
    {
      email: "ilirjana.d@adriatikbank.al",
      label: "Ilirjana Daja",
      sub: "Adriatik Bank · Compliance",
    },
    { email: "genc.h@adriatikbank.al", label: "Genc Hysenaj", sub: "Adriatik Bank · Sales" },
    { email: "mirela.c@adriatikbank.al", label: "Mirela Çela", sub: "Adriatik Bank · Risk" },
    { email: "florian.b@adriatikbank.al", label: "Florian Bardhi", sub: "Adriatik Bank · IT" },
    {
      email: "anila.k@adriatikbank.al",
      label: "Anila Kuka",
      sub: "Adriatik Bank · People (wellness)",
    },
    { email: "driton.v@kafeflora.al", label: "Driton Vlashi", sub: "Kafe Flora · Operations" },
    { email: "suela.m@kafeflora.al", label: "Suela Mema", sub: "Kafe Flora · Operations" },
    { email: "klara.b@kafeflora.al", label: "Klara Berisha", sub: "Kafe Flora · Kitchen" },
    { email: "rinor.h@kafeflora.al", label: "Rinor Hyseni", sub: "Kafe Flora · Marketing" },
  ],
  provider: [
    { email: "prov1@perx.al", label: "Fitness First Tirana", sub: "Fitness · Tirana" },
    { email: "prov2@perx.al", label: "Serotonin Gym", sub: "Fitness · Tirana" },
    { email: "prov3@perx.al", label: "Ritual Spa & Hammam", sub: "Wellness · Tirana" },
    { email: "prov4@perx.al", label: "LIFT Rooftop", sub: "Food · Tirana" },
    { email: "prov5@perx.al", label: "Oda Restaurant", sub: "Food · Tirana" },
    { email: "prov6@perx.al", label: "Artigiano", sub: "Food · Tirana" },
    { email: "prov7@perx.al", label: "Vodafone Albania", sub: "Telecom · 5 cities" },
    { email: "prov8@perx.al", label: "One Albania", sub: "Telecom · 4 cities" },
    { email: "prov9@perx.al", label: "Zenith Travel", sub: "Travel · Tirana" },
    { email: "prov10@perx.al", label: "Elite Travel", sub: "Travel · Tirana" },
    { email: "prov11@perx.al", label: "Spa Lavanda", sub: "Wellness · Tirana (2 branches)" },
    { email: "prov12@perx.al", label: "Albtravel Tours", sub: "Travel · Tirana" },
    { email: "prov13@perx.al", label: "Mediplus Klinikë", sub: "Health · Tirana" },
    { email: "prov14@perx.al", label: "Berlitz Tiranë", sub: "Learning · Tirana" },
    { email: "prov15@perx.al", label: "Mullixhiu Restorant", sub: "Food · Tirana (2 branches)" },
    { email: "prov16@perx.al", label: "Thalasso Durrës", sub: "Wellness · Durrës" },
    { email: "prov17@perx.al", label: "Conad Supermarket", sub: "Retail · 4 cities" },
    { email: "prov18@perx.al", label: "Gjelbërimi Yoga", sub: "Wellness · Tirana" },
  ],
};

type Brand = "perx" | "teamsystem";
const BRAND_KEY = "perx.brand";
const LAST_ACCOUNT_KEY = "perx.demo.lastAccount";
const HIDDEN_KEY = "perx.demo.hidden";

function applyBrand(brand: Brand) {
  const root = document.documentElement;
  if (brand === "teamsystem") root.setAttribute("data-theme", "teamsystem");
  else root.removeAttribute("data-theme");
}

export function DemoRoleSwitcher() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [brand, setBrand] = useState<Brand>("perx");
  const [open, setOpen] = useState<Role | null>(null);
  const [lastEmail, setLastEmail] = useState<Record<Role, string | undefined>>({
    employee: undefined,
    employer: undefined,
    provider: undefined,
  });
  const [hidden, setHidden] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved =
      (typeof window !== "undefined" && (localStorage.getItem(BRAND_KEY) as Brand | null)) ||
      "perx";
    setBrand(saved);
    applyBrand(saved);
    try {
      const raw = localStorage.getItem(LAST_ACCOUNT_KEY);
      if (raw) setLastEmail(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    try {
      // Default to collapsed; only expanded if user explicitly opened it.
      setHidden(localStorage.getItem(HIDDEN_KEY) !== "0");
    } catch {
      /* ignore */
    }
  }, []);

  function setHiddenPersist(v: boolean) {
    setHidden(v);
    try {
      localStorage.setItem(HIDDEN_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  // Close popover on outside click / escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchBrand(next: Brand) {
    setBrand(next);
    applyBrand(next);
    try {
      localStorage.setItem(BRAND_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const currentRole: Role | null = pathname.startsWith("/app/employee")
    ? "employee"
    : pathname.startsWith("/app/employer")
      ? "employer"
      : pathname.startsWith("/app/provider")
        ? "provider"
        : null;

  async function loginAs(role: Role, account: DemoAccount) {
    setSwitching(true);
    setOpen(null);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: PASSWORD,
      });
      if (error) throw error;
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      const next = { ...lastEmail, [role]: account.email };
      setLastEmail(next);
      try {
        localStorage.setItem(LAST_ACCOUNT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      await queryClient.invalidateQueries();
      navigate({ to: ROUTES[role], replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setSwitching(false);
    }
  }

  function quickSwitch(role: Role) {
    const remembered = lastEmail[role];
    const pick =
      (remembered && ACCOUNTS[role].find((a) => a.email === remembered)) || ACCOUNTS[role][0];
    void loginAs(role, pick);
  }

  if (hidden) {
    return (
      <div className="fixed bottom-2 right-2 z-[60] sm:bottom-3 sm:right-3 print:hidden">
        <button
          onClick={() => setHiddenPersist(false)}
          className="btn-press group inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] bg-paper/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/35 backdrop-blur transition-all hover:bg-paper/95 hover:text-ink/80 hover:px-2 focus-visible:opacity-100 focus-visible:text-ink"
          title="Show demo controls"
          aria-label="Show demo controls"
        >
          <span className="h-1 w-1 rounded-full bg-brand/70 group-hover:bg-brand" />
          <span className="opacity-70 group-hover:opacity-100">{t.demo.label}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-3 sm:bottom-6"
    >
      <div className="hairline relative flex max-w-[calc(100vw-1.5rem)] items-center gap-2 overflow-visible rounded-full bg-paper/95 px-2 py-1.5 soft-shadow backdrop-blur">
        <span
          className="ml-1.5 hidden items-center gap-1.5 pr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/60 sm:inline-flex"
          title={t.demo.hint}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {t.demo.label}
        </span>
        <div role="group" aria-label={t.demo.hint} className="flex items-center gap-0.5">
          {(Object.keys(ROUTES) as Role[]).map((r) => {
            const active = r === currentRole;
            const count = ACCOUNTS[r].length;
            return (
              <div key={r} className="relative">
                <div
                  className={`flex items-center rounded-full transition-colors ${
                    active ? "bg-ink text-parchment" : "text-ink/70 hover:bg-parchment"
                  }`}
                >
                  <button
                    onClick={() => quickSwitch(r)}
                    disabled={switching}
                    className="btn-press rounded-l-full px-3 py-1.5 text-xs font-medium"
                    title={`Sign in as ${t.roles[r]}`}
                  >
                    {switching ? "…" : t.roles[r]}
                  </button>
                  <button
                    onClick={() => setOpen(open === r ? null : r)}
                    disabled={switching}
                    aria-label={`Pick which ${t.roles[r]} account`}
                    className="btn-press rounded-r-full px-1.5 py-1.5 text-[10px] opacity-70 hover:opacity-100"
                  >
                    ▾ <span className="hidden sm:inline">{count}</span>
                  </button>
                </div>

                {open === r ? (
                  <div className="absolute bottom-full left-1/2 z-[70] mb-2 w-72 -translate-x-1/2 rounded-2xl border border-[var(--hairline)] bg-paper p-1.5 soft-shadow">
                    <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55">
                      {t.roles[r]} accounts ({count})
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {ACCOUNTS[r].map((acc) => {
                        const last = lastEmail[r] === acc.email;
                        return (
                          <button
                            key={acc.email}
                            onClick={() => loginAs(r, acc)}
                            className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs hover:bg-parchment"
                          >
                            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {acc.label}{" "}
                                {last ? (
                                  <span className="text-[10px] text-ink/45">· last</span>
                                ) : null}
                              </span>
                              {acc.sub ? (
                                <span className="block truncate text-[11px] text-ink/55">
                                  {acc.sub}
                                </span>
                              ) : null}
                              <span className="block truncate font-mono-num text-[10px] text-ink/40">
                                {acc.email}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <span
          className="mx-1 hidden h-4 w-px bg-[var(--hairline-strong)] sm:inline-block"
          aria-hidden
        />

        <div
          role="group"
          aria-label="Brand theme"
          className="flex items-center gap-0.5"
          title="Switch brand theme — show how PERX adapts to any company."
        >
          {(["perx", "teamsystem"] as Brand[]).map((b) => {
            const active = b === brand;
            return (
              <button
                key={b}
                onClick={() => switchBrand(b)}
                className={`btn-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground"
                    : "text-ink/70 hover:bg-parchment hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block size-2 rounded-full"
                  style={{ background: b === "perx" ? "#0E7C66" : "#1A9EDA" }}
                />
                {b === "perx" ? "PERX" : "TeamSystem"}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setHiddenPersist(true)}
          className="btn-press ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink/45 hover:bg-parchment hover:text-ink"
          title="Hide demo switcher"
          aria-label="Hide demo switcher"
        >
          ×
        </button>
      </div>
    </div>
  );
}
