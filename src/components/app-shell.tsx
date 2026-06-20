import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { Wordmark, LangToggle } from "./site-header";

export function AppShell({
  kicker,
  title,
  subtitle,
  headerMark,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  headerMark?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-parchment text-ink">
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Wordmark />
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <button
              onClick={handleSignOut}
              className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-sm font-medium text-ink/80 hover:text-ink"
            >
              {t.dashboard.signOut}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
          {kicker}
        </div>
        <div className="mt-2 flex items-center gap-3">
          {headerMark}
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
        </div>
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-ink/70">{subtitle}</p> : null}
        <div className="mt-10 grid min-w-0 grid-cols-1 gap-8 [&>*]:min-w-0">{children}</div>
      </main>
    </div>
  );
}

export function Card({
  title,
  hint,
  children,
  className = "",
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hairline rounded-2xl bg-paper p-6 sm:p-8 ${className}`}>
      {title ? (
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-medium tracking-tight">{title}</h2>
          {hint ? <span className="text-xs text-ink/55">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="hairline rounded-2xl bg-paper p-5">
      <div className="text-xs uppercase tracking-[0.14em] text-ink/55">{label}</div>
      <div className="mt-2 font-mono-num text-3xl text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink/55">{hint}</div> : null}
    </div>
  );
}
