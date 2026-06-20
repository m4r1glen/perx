import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Flame, Trophy, ChevronLeft, ChevronRight, X, Share2 } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { Offer, Selection } from "@/lib/use-marketplace";
import { formatLek, formatNumber } from "@/lib/use-marketplace";
import { CountUp } from "@/components/count-up";

type Props = {
  open: boolean;
  onClose: () => void;
  selections: Selection[];
  offerById: Map<string, Offer>;
  streakCount: number;
  fullName: string | null;
};

type PersonaKey =
  | "wellness"
  | "fitness"
  | "food"
  | "travel"
  | "learning"
  | "telecom"
  | "health"
  | "default";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const SLIDE_DURATION_MS = 5200;

export function YearInBenefits({
  open,
  onClose,
  selections,
  offerById,
  streakCount,
  fullName,
}: Props) {
  const { t, locale } = useLocale();
  const e = t.dashboard.employee;
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, [open]);

  const stats = useMemo(() => {
    const byCat = new Map<string, number>();
    let total = 0;
    let picks = 0;
    selections
      .filter((s) => s.status === "paid" || s.status === "approved")
      .forEach((s) => {
        total += s.total_l;
        s.offer_ids.forEach((id) => {
          const o = offerById.get(id);
          if (!o) return;
          picks += 1;
          byCat.set(o.category, (byCat.get(o.category) ?? 0) + o.price_l);
        });
      });
    let topCategory: string | null = null;
    let topValue = 0;
    byCat.forEach((v, k) => {
      if (v > topValue) {
        topValue = v;
        topCategory = k;
      }
    });
    const personaKey: PersonaKey = (
      topCategory && topCategory in e.personas ? topCategory : "default"
    ) as PersonaKey;
    return { total, picks, topCategory, topValue, personaKey };
  }, [selections, offerById, e.personas]);

  type Slide = {
    kicker: string;
    content: ReactNode;
    accent?: boolean;
  };

  const firstName = (fullName?.split(/\s+/)[0] ?? "PERX").toUpperCase();

  const slides = useMemo<Slide[]>(
    () => [
      // 1. Intro
      {
        kicker: e.wrappedKicker,
        content: (
          <>
            <div className="wrap-rise text-xs font-medium uppercase tracking-[0.28em] text-brand-light/80">
              {locale === "sq" ? "Përshëndetje" : "Hello"},
            </div>
            <div className="wrap-rise mt-3 font-display text-[clamp(56px,13vw,140px)] font-medium leading-[0.95] tracking-tight">
              {firstName}
            </div>
            <h2 className="wrap-rise mt-6 font-display text-2xl font-medium tracking-tight sm:text-4xl">
              {e.wrappedYourYear}
            </h2>
            <p className="wrap-rise mt-3 max-w-md text-sm text-parchment/65 sm:text-base">
              {locale === "sq" ? "Le ta shohim së bashku." : "Let's take a look together."}
            </p>
          </>
        ),
      },
      // 2. Persona
      {
        kicker: e.wrappedPersonaLabel,
        content: (
          <>
            <div className="wrap-rise relative flex items-center justify-center">
              <div className="absolute size-[clamp(180px,30vw,320px)] rounded-full bg-brand/25 blur-3xl" />
              <Sparkles
                className="relative size-[clamp(96px,16vw,180px)] text-brand-light"
                strokeWidth={1.1}
              />
            </div>
            <div className="wrap-rise mt-8 text-xs font-medium uppercase tracking-[0.22em] text-parchment/50">
              {locale === "sq" ? "Ti je" : "You are"}
            </div>
            <h2 className="wrap-rise mt-3 font-display text-4xl font-medium tracking-tight sm:text-6xl">
              {e.personas[stats.personaKey]}
            </h2>
            <p className="wrap-rise mt-3 max-w-md text-sm text-parchment/65 sm:text-base">
              {locale === "sq"
                ? "Bazuar në zgjedhjet që ke bërë gjatë vitit."
                : "Based on the picks you made this year."}
            </p>
          </>
        ),
        accent: true,
      },
      // 3. Top category
      {
        kicker: e.wrappedCategoryLabel,
        content: (
          <>
            <div className="wrap-rise text-xs font-medium uppercase tracking-[0.22em] text-parchment/50">
              {locale === "sq" ? "Më shumë se gjithçka" : "More than anything"}
            </div>
            <h2 className="wrap-rise mt-4 font-display text-5xl font-medium tracking-tight sm:text-7xl">
              {stats.topCategory ? (t.categories[stats.topCategory] ?? stats.topCategory) : "—"}
            </h2>
            <div className="wrap-rise mt-10 flex items-baseline justify-center gap-3">
              <span className="font-mono-num text-[clamp(56px,12vw,120px)] leading-none text-brand-light">
                {reduced ? (
                  formatNumber(stats.picks)
                ) : (
                  <CountUp value={stats.picks} duration={900} />
                )}
              </span>
              <span className="text-sm uppercase tracking-[0.18em] text-parchment/60 sm:text-base">
                {locale === "sq" ? "zgjedhje" : "picks"}
              </span>
            </div>
            {/* growing bar */}
            <div className="wrap-rise mx-auto mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-parchment/10">
              <div
                className="h-full rounded-full bg-brand-light"
                style={{
                  width: "100%",
                  transformOrigin: "left",
                  animation: reduced
                    ? "none"
                    : "wrapBarGrow 1100ms cubic-bezier(.2,.7,.2,1) 300ms both",
                }}
              />
            </div>
          </>
        ),
      },
      // 4. Total value — CLIMAX
      {
        kicker: e.wrappedValueLabel,
        content: (
          <>
            <div className="wrap-rise text-xs font-medium uppercase tracking-[0.22em] text-brand-light">
              {locale === "sq" ? "Vlerë pa tatim që mban për vete" : "Tax-free value you kept"}
            </div>
            <div className="wrap-rise mt-8 font-mono-num text-[clamp(72px,17vw,220px)] font-medium leading-none tracking-tight text-brand-light">
              {reduced ? (
                formatLek(stats.total)
              ) : (
                <CountUp value={stats.total} duration={1800} format={formatLek} />
              )}
            </div>
            <p className="wrap-rise mt-6 max-w-md text-sm text-parchment/65 sm:text-base">
              {locale === "sq"
                ? "Përfitime që do të kishin shkuar te tatimet — janë te ti."
                : "Benefits that would've gone to taxes — they stayed with you."}
            </p>
          </>
        ),
        accent: true,
      },
      // 5. Streak
      {
        kicker: e.wrappedStreakLabel,
        content: (
          <>
            <div className="wrap-rise relative flex items-center justify-center">
              <div className="absolute size-[clamp(160px,28vw,300px)] rounded-full bg-brand/20 blur-3xl" />
              <Trophy
                className="relative size-[clamp(80px,14vw,160px)] text-brand-light"
                strokeWidth={1.15}
              />
            </div>
            <div className="wrap-rise mt-8 flex items-baseline justify-center gap-3">
              <span className="font-mono-num text-[clamp(64px,14vw,160px)] leading-none">
                {reduced ? streakCount : <CountUp value={streakCount} duration={1100} />}
              </span>
              <span className="text-base uppercase tracking-[0.18em] text-parchment/60 sm:text-lg">
                {locale === "sq" ? "javë" : "weeks"}
              </span>
            </div>
            <div className="wrap-rise mt-4 inline-flex items-center gap-1.5 text-sm text-brand-light/90">
              <Flame className="size-4" />
              <span>{locale === "sq" ? "Streak më i gjatë" : "Longest streak"}</span>
            </div>
          </>
        ),
      },
      // 6. Closing
      {
        kicker: locale === "sq" ? "Faleminderit" : "Thank you",
        content: (
          <>
            <div className="wrap-rise text-xs font-medium uppercase tracking-[0.22em] text-brand-light">
              {locale === "sq" ? "Faleminderit që zgjodhe PERX" : "Thanks for choosing PERX"}
            </div>
            <h2 className="wrap-rise mt-6 font-display text-4xl font-medium tracking-tight sm:text-6xl">
              {locale === "sq" ? "Viti tjetër pret." : "Next year is waiting."}
            </h2>
            <p className="wrap-rise mt-4 max-w-md text-sm text-parchment/65 sm:text-base">
              {locale === "sq"
                ? "Vazhdo të zgjedhësh atë që të bën mirë."
                : "Keep choosing what makes you well."}
            </p>
            <button
              type="button"
              onClick={(ev) => ev.stopPropagation()}
              className="wrap-rise mt-10 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground btn-press"
            >
              <Share2 className="size-4" />
              {locale === "sq" ? "Ndaj momentin" : "Share the moment"}
            </button>
          </>
        ),
        accent: true,
      },
    ],
    [e, t.categories, firstName, stats, streakCount, locale, reduced],
  );

  // confetti on climax slide (total value)
  useEffect(() => {
    if (!open) return;
    if (reduced) return;
    if (step !== 3) return;
    const id = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 90,
        startVelocity: 32,
        origin: { y: 0.35 },
        colors: ["#0E7C66", "#16A34A", "#D5EDE6"],
        ticks: 160,
        scalar: 0.85,
      });
    }, 600);
    return () => clearTimeout(id);
  }, [open, step, reduced]);

  // reset on open/close
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // auto-advance + progress bar animation
  useEffect(() => {
    if (!open || reduced) return;
    const bar = progressRef.current;
    if (bar) {
      bar.style.transition = "none";
      bar.style.width = "0%";
      // reflow
      void bar.offsetWidth;
      bar.style.transition = `width ${SLIDE_DURATION_MS}ms linear`;
      bar.style.width = "100%";
    }
    const id = setTimeout(() => {
      setStep((s) => Math.min(slides.length - 1, s + 1));
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(id);
  }, [step, open, reduced, slides.length]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
      else if (ev.key === "ArrowRight" || ev.key === " " || ev.key === "Enter") next();
      else if (ev.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function next() {
    setStep((s) => {
      if (s >= slides.length - 1) {
        queueMicrotask(() => onClose());
        return 0;
      }
      return s + 1;
    });
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleTap(ev: React.MouseEvent<HTMLDivElement>) {
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    if (x < rect.width * 0.32) prev();
    else next();
  }

  if (!open) return null;
  const slide = slides[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] overflow-hidden bg-ink text-parchment wrap-open"
      style={{
        backgroundImage:
          "radial-gradient(1200px 800px at 20% 10%, color-mix(in oklab, var(--brand) 38%, transparent), transparent 60%), radial-gradient(900px 700px at 85% 90%, color-mix(in oklab, var(--brand-dark) 50%, transparent), transparent 65%), linear-gradient(135deg, #0A0B10 0%, #14171C 55%, #0A1F1A 100%)",
      }}
    >
      {/* Ambient drifting accents */}
      {!reduced && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-1/4 size-[420px] rounded-full bg-brand/25 blur-3xl wrap-drift-a"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 bottom-10 size-[520px] rounded-full bg-brand-dark/35 blur-3xl wrap-drift-b"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 wrap-particles" />
        </>
      )}

      {/* Progress segments */}
      <div className="absolute left-0 right-0 top-4 z-10 mx-auto flex max-w-2xl gap-1.5 px-5">
        {slides.map((_, i) => (
          <div
            key={i}
            className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-parchment/15"
          >
            {i < step && <div className="absolute inset-0 bg-parchment/85" />}
            {i === step && (
              <div
                ref={progressRef}
                className="absolute inset-y-0 left-0 bg-parchment/85"
                style={{ width: reduced ? "100%" : "0%" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label={e.wrappedClose}
        className="absolute right-4 top-9 z-20 inline-flex size-9 items-center justify-center rounded-full border border-parchment/15 bg-parchment/5 text-parchment/85 hover:bg-parchment/10"
      >
        <X className="size-4" />
      </button>

      {/* Nav arrows (desktop) */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous"
        disabled={step === 0}
        className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-parchment/10 bg-parchment/5 p-2 text-parchment/80 hover:bg-parchment/10 disabled:opacity-30 sm:inline-flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next"
        className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-parchment/10 bg-parchment/5 p-2 text-parchment/80 hover:bg-parchment/10 sm:inline-flex"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Tap surface */}
      <div
        onClick={handleTap}
        className="relative z-0 flex h-full w-full items-center justify-center px-6"
      >
        <div
          key={step}
          className={`wrap-slide mx-auto flex max-w-2xl flex-col items-center text-center ${slide.accent ? "" : ""}`}
        >
          <div className="wrap-rise text-[11px] font-medium uppercase tracking-[0.28em] text-brand-light">
            {slide.kicker}
          </div>
          <div className="mt-6 w-full">{slide.content}</div>
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-[11px] uppercase tracking-[0.2em] text-parchment/40">
        {step === slides.length - 1 ? e.wrappedTapClose : e.wrappedTapNext}
      </div>
    </div>
  );
}
