import { Link } from "@tanstack/react-router";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <Link
      to="/"
      className={`font-display font-semibold tracking-tight ${cls} inline-flex items-baseline`}
    >
      <span>PERX</span>
      <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-copper" aria-hidden />
    </Link>
  );
}

export function LangToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t.nav.langLabel}
      className="inline-flex items-center rounded-full border border-[var(--hairline)] bg-paper p-0.5 text-xs font-medium"
    >
      {(["sq", "en"] as Locale[]).map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`btn-press rounded-full px-3 py-1.5 uppercase tracking-wide ${
              active ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/** Slim header for non-landing pages. */
export function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <Link
            to="/auth"
            className="btn-press hidden rounded-full px-4 py-2 text-sm font-medium text-ink/80 hover:text-ink sm:inline-flex"
          >
            {t.nav.login}
          </Link>
          <Link
            to="/auth"
            className="btn-press inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink/90"
          >
            {t.nav.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}
