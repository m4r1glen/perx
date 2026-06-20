import { createFileRoute, Link } from "@tanstack/react-router";
import type { Dict, Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { ENABLE_DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PERX — Përfitimet që punonjësit duan vërtet" },
      {
        name: "description",
        content: "Tregu i benefiteve për punonjësit, ndërtuar për Shqipërinë dhe gati për Europën.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <Header locale={locale} setLocale={setLocale} t={t} />
      <main>
        <Hero t={t} />
        <HowItWorks t={t} />
        <Features t={t} />
        <CtaBand t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

/* ---------- Header ---------- */

function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
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

function LangToggle({
  locale,
  setLocale,
  label,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
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

function Header({
  locale,
  setLocale,
  t,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3.5 sm:px-8">
        <Wordmark />
        <div className="hidden justify-center md:flex">
          <nav className="flex items-center gap-7 text-sm text-ink/70">
            <a href="#how" className="hover:text-ink">
              {t.how.kicker}
            </a>
            <a href="#features" className="hover:text-ink">
              {t.features.kicker}
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 justify-self-end">
          <LangToggle locale={locale} setLocale={setLocale} label={t.nav.langLabel} />
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

/* ---------- Hero ---------- */

function Hero({ t }: { t: Dict }) {
  return (
    <section className="relative overflow-hidden">
      {/* Warm composition backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-24 h-[520px] w-[520px] rounded-full bg-copper-light blur-3xl opacity-70" />
        <div className="absolute top-40 -left-32 h-[380px] w-[380px] rounded-full bg-[#FCE9C9] blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-paper/70 px-3 py-1 text-xs font-medium text-ink/70">
            <span className="h-1.5 w-1.5 rounded-full bg-copper" />
            {t.hero.eyebrow}
          </span>

          <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            {t.hero.title.split(" ").slice(0, -1).join(" ")}{" "}
            <em className="not-italic text-copper-dark">{t.hero.title.split(" ").slice(-1)}</em>
          </h1>

          <p className="mt-5 max-w-xl text-base text-ink/70 sm:text-lg">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="btn-press inline-flex items-center rounded-full bg-copper px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(255,122,51,0.7)] hover:bg-copper-dark"
            >
              {t.hero.ctaPrimary}
            </Link>
            <a
              href="#how"
              className="btn-press inline-flex items-center rounded-full border border-[var(--hairline)] bg-paper/60 px-6 py-3.5 text-sm font-semibold text-ink hover:bg-paper"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>

          <div className="mt-10 flex items-center gap-2 text-xs text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            {t.hero.badge}
          </div>
        </div>

        {/* Hero visual: editorial card composition */}
        <div className="relative mt-14 lg:mt-0">
          <HeroVisual t={t} />
        </div>
      </div>
    </section>
  );
}

function HeroVisual({ t }: { t: Dict }) {
  return (
    <div className="relative mx-auto w-full max-w-md pt-2 sm:pt-8">
      {/* Ambient glow behind the cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_40%,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_70%)] blur-2xl"
      />

      <div className="flex flex-col gap-4">
        {/* Primary offer card */}
        <article className="hero-card group hairline relative rounded-3xl bg-paper p-5 shadow-[0_30px_60px_-30px_rgba(22,23,29,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-30px_rgba(22,23,29,0.45)] sm:p-6">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-base font-semibold text-brand-dark">
                BC
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
                  Bujtina Café
                </div>
                <div className="truncate text-[11px] text-ink/55">Ushqim · Tiranë</div>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Drop
            </span>
          </header>

          {/* Subtle sparkline — only on this card */}
          <div className="mt-4 flex items-end gap-1.5">
            {[40, 70, 55, 90, 60, 80, 45, 75, 95, 65, 88, 72].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-brand-soft transition-colors group-hover:bg-brand/40"
                style={{ height: `${h * 0.45}px` }}
              />
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--hairline)] pt-4">
            <div className="min-w-0">
              <div className="font-mono-num text-2xl font-semibold text-ink sm:text-3xl">
                1{"\u00a0"}200 L
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink/50">
                −30% këtë javë
              </div>
            </div>
            <a
              href="#features"
              className="btn-press inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3.5 py-2 text-[11px] font-semibold text-parchment hover:bg-ink/90"
            >
              Shiko detajet
              <span aria-hidden>→</span>
            </a>
          </div>
        </article>

        {/* Secondary offer card */}
        <article className="hero-card group hairline relative rounded-3xl bg-paper p-5 shadow-[0_24px_50px_-26px_rgba(22,23,29,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_36px_70px_-26px_rgba(22,23,29,0.40)] sm:ml-8">
          <header className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FCE9C9] font-display text-base font-semibold text-copper-dark">
                FF
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-lg leading-tight tracking-tight text-ink sm:text-xl">
                  Fitness First
                </div>
                <div className="truncate text-[11px] text-ink/55">Mirëqenie · 12 qendra</div>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage">
              −45%
            </span>
          </header>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--hairline)] pt-4">
            <div className="min-w-0">
              <div className="font-mono-num text-xl font-semibold text-ink sm:text-2xl">
                3{"\u00a0"}500 L
                <span className="ml-1 text-[11px] font-normal text-ink/50">/muaj</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink/50">
                Abonim mujor
              </div>
            </div>
            <a
              href="#features"
              className="btn-press inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--hairline)] bg-paper px-3.5 py-2 text-[11px] font-semibold text-ink hover:bg-parchment"
            >
              Shiko detajet
              <span aria-hidden>→</span>
            </a>
          </div>
        </article>

        {/* Stat strip — savings + monthly tax-free, fully visible */}
        <div className="hairline grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--hairline)]">
          <div className="flex items-center justify-between gap-2 bg-brand-soft px-4 py-3">
            <div className="text-[10px] uppercase leading-tight tracking-[0.12em] text-brand-dark/80">
              {t.hero.stat1Label}
            </div>
            <div className="font-mono-num text-xl font-semibold text-brand-dark">23%</div>
          </div>
          <div className="flex items-center justify-between gap-2 bg-ink px-4 py-3 text-parchment">
            <div className="text-[10px] uppercase leading-tight tracking-[0.12em] text-parchment/60">
              {t.hero.stat2Label}
            </div>
            <div className="font-mono-num text-xl font-semibold">{t.hero.stat2Value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowItWorks({ t }: { t: Dict }) {
  const icons = [EmployeeIcon, EmployerIcon, ProviderIcon];
  return (
    <section id="how" className="border-t border-[var(--hairline)] bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
            {t.how.kicker}
          </div>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
            {t.how.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {t.how.cards.map((c, i) => {
            const Icon = icons[i];
            return (
              <article
                key={c.tag}
                className="card-lift hairline group flex flex-col rounded-2xl bg-parchment p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-copper-light text-copper-dark">
                    <Icon />
                  </span>
                  <span className="font-mono-num text-xs text-ink/40">0{i + 1}</span>
                </div>
                <div className="mt-6 text-xs uppercase tracking-[0.14em] text-ink/50">{c.tag}</div>
                <h3 className="mt-2 font-display text-2xl leading-snug">{c.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{c.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */

function Features({ t }: { t: Dict }) {
  return (
    <section id="features" className="border-t border-[var(--hairline)] bg-ink text-parchment">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper">
              {t.features.kicker}
            </div>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
              {t.features.title}
            </h2>
          </div>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-parchment/10 bg-parchment/10 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 bg-ink p-7 transition-colors hover:bg-[#1B1C24]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-copper/15 text-copper">
                  <FeatureGlyph i={i} />
                </span>
                <span className="font-mono-num text-[11px] text-parchment/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-xl leading-snug">{f.title}</h3>
              <p className="text-sm text-parchment/70">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA band ---------- */

function CtaBand({ t }: { t: Dict }) {
  return (
    <section className="border-t border-[var(--hairline)] bg-parchment">
      <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <h2 className="font-display text-3xl font-medium tracking-tight sm:text-5xl">
          {t.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink/70">{t.cta.body}</p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/auth"
            className="btn-press inline-flex items-center rounded-full bg-copper px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(255,122,51,0.7)] hover:bg-copper-dark"
          >
            {t.cta.button}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer({ t }: { t: Dict }) {
  const cols: Array<[string, readonly string[]]> = [
    [t.footer.product, t.footer.productLinks],
    [t.footer.company, t.footer.companyLinks],
    [t.footer.legal, t.footer.legalLinks],
  ];
  return (
    <footer className="border-t border-[var(--hairline)] bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="lg" />
            <p className="mt-4 max-w-xs text-sm text-ink/65">{t.footer.tagline}</p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
                {title}
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-ink/80 hover:text-copper-dark">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[var(--hairline)] pt-6 text-xs text-ink/55 sm:flex-row sm:items-center">
          <span>{t.footer.copyright}</span>
          {ENABLE_DEMO_MODE ? <span className="font-mono-num">JunctionX Tirana demo</span> : null}
        </div>
      </div>
    </footer>
  );
}

/* ---------- Inline icons (no extra deps) ---------- */

function EmployeeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}
function EmployerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
function ProviderIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h18l-1.5 5H4.5L3 7Z" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 16h4" />
    </svg>
  );
}
function FeatureGlyph({ i }: { i: number }) {
  const paths = [
    <path key="a" d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />,
    <>
      <path key="b1" d="M4 20h16" />
      <path key="b2" d="M7 16V9M12 16V5M17 16v-4" />
    </>,
    <>
      <circle key="c1" cx="12" cy="12" r="8" />
      <path key="c2" d="M8 12l3 3 5-6" />
    </>,
    <>
      <rect key="d1" x="3" y="4" width="7" height="7" rx="1.5" />
      <rect key="d2" x="14" y="4" width="7" height="7" rx="1.5" />
      <rect key="d3" x="3" y="15" width="18" height="5" rx="1.5" />
    </>,
    <path key="e" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
    <>
      <path key="f1" d="M3 3v18h18" />
      <path key="f2" d="M7 15l4-4 3 3 5-6" />
    </>,
  ];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[i % paths.length]}
    </svg>
  );
}
