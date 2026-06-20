import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatLek, type Offer, type Selection } from "@/lib/use-marketplace";
import { localRecommend, type FallbackResult } from "@/lib/concierge-fallback";
import type { Profile } from "@/lib/use-profile";

/* ------------------------------------------------------------------ */
/* Typewriter tuning — tweak these to taste                            */
const TYPE_CHAR_MS = 28; // ms per character while "speaking"
const TYPING_DOTS_MS = 650; // how long the "..." typing bubble shows
const CARDS_REVEAL_DELAY = 120; // ms after typing finishes before cards fade in
/* ------------------------------------------------------------------ */

type Pick = { offer_id: string; reason: string };
type AssistantMsg = {
  role: "assistant";
  intro: string;
  picks: Pick[];
  source: "ai" | "fallback";
  id?: string;
};
type UserMsg = { role: "user"; text: string };
type Msg = UserMsg | AssistantMsg;

const COPY = {
  sq: {
    kicker: "Konçerzh i Përfitimeve",
    title: "Çfarë po kërkon sot?",
    sub: "Më thuaj humorin dhe buxhetin — të rekomandoj një paketë reale nga katalogu.",
    placeholder: "p.sh. diçka relaksuese nën 8000 Lekë…",
    send: "Pyet",
    thinking: "Po mendoj…",
    addBundle: "Shto të gjithë paketën",
    bundleTotal: "Totali i paketës",
    suggestions: [
      "Cila paketë është më e mira për mua?",
      "Diçka relaksuese nën 8000 Lekë",
      "Energji & fokus për javën e punës",
    ],
    fallbackNote: "Rekomanduar lokalisht (offline)",
    empty: "Nuk gjeta oferta që përshtaten me kërkesën — provo një buxhet tjetër.",
  },
  en: {
    kicker: "Benefits Concierge",
    title: "What are you in the mood for?",
    sub: "Tell me a vibe and a budget — I'll curate a real bundle from the catalog.",
    placeholder: "e.g. something relaxing under 8000 Lekë…",
    send: "Ask",
    thinking: "Thinking…",
    addBundle: "Add whole bundle",
    bundleTotal: "Bundle total",
    suggestions: [
      "Which package is best for me?",
      "Something relaxing under 8000 Lekë",
      "Energy & focus for the work week",
    ],
    fallbackNote: "Recommended locally (offline)",
    empty: "No matching offers — try a different budget.",
  },
} as const;

export function ConciergePanel({
  offers,
  profile,
  balance,
  selections,
  locale,
  onAddBundle,
  onOpenDetails,
  compact = false,
}: {
  offers: Offer[];
  profile: Profile | null | undefined;
  balance: number;
  selections: Selection[];
  locale: "sq" | "en";
  onAddBundle: (items: Offer[]) => void;
  onOpenDetails?: (offers: Offer[], bundleTitle?: { sq: string; en: string }) => void;
  compact?: boolean;
}) {
  const c = COPY[locale];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const offerById = useMemo(() => {
    const m = new Map<string, Offer>();
    offers.forEach((o) => m.set(o.id, o));
    return m;
  }, [offers]);

  const spendByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    selections
      .filter((s) => s.status === "paid")
      .forEach((s) =>
        s.offer_ids.forEach((id) => {
          const o = offerById.get(id);
          if (!o) return;
          out[o.category] = (out[o.category] ?? 0) + o.price_l;
        }),
      );
    return out;
  }, [selections, offerById]);

  const recentOfferIds = useMemo(() => {
    const ids: string[] = [];
    for (const s of selections) {
      for (const id of s.offer_ids) {
        if (!ids.includes(id)) ids.push(id);
        if (ids.length >= 3) return ids;
      }
    }
    return ids;
  }, [selections]);

  async function ask(message: string) {
    const text = message.trim();
    if (!text || loading) return;
    setInput("");
    const priorHistory = messages.map((m) =>
      m.role === "user"
        ? { role: "user" as const, text: m.text }
        : { role: "assistant" as const, intro: m.intro, picks: m.picks },
    );
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    let assistant: AssistantMsg | null = null;
    try {
      const { data, error } = await supabase.functions.invoke("concierge", {
        body: {
          message: text,
          locale,
          profile: {
            full_name: profile?.full_name,
            job_title: profile?.job_title,
            department: profile?.department,
            interests: profile?.interests,
          },
          balance,
          spendByCategory,
          recentOfferIds,
          history: priorHistory,
          offers: offers.map((o) => ({
            id: o.id,
            title_sq: o.title_sq,
            title_en: o.title_en,
            price_l: o.price_l,
            category: o.category,
            mood: o.mood,
          })),
        },
      });
      if (error) throw error;
      const picks = Array.isArray(data?.picks) ? (data.picks as Pick[]) : [];
      const validPicks = picks.filter((p) => offerById.has(p.offer_id));
      if (validPicks.length >= 2) {
        assistant = {
          role: "assistant",
          intro: typeof data?.intro === "string" ? data.intro : "",
          picks: validPicks.slice(0, 4),
          source: "ai",
        };
      }
    } catch (e) {
      console.warn("concierge_fallback", e);
    }

    if (!assistant) {
      const fb: FallbackResult = localRecommend(text, offers, balance, locale);
      assistant = {
        role: "assistant",
        intro: fb.intro,
        picks: fb.picks,
        source: "fallback",
      };
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `a_${Date.now()}_${Math.random()}`;
    assistant = { ...assistant, id };
    setFreshId(id);
    setMessages((m) => [...m, assistant!]);
    setLoading(false);
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  return (
    <section
      className={`concierge-panel-glow hairline flex h-full flex-col overflow-hidden bg-ink text-parchment ${compact ? "rounded-2xl" : "rounded-3xl"}`}
    >
      <div
        className={`flex items-start justify-between gap-4 border-b border-parchment/10 ${compact ? "px-5 py-4" : "p-6 sm:p-8"}`}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
            {c.kicker}
          </div>
          <h2
            className={`mt-1 font-display font-medium tracking-tight ${compact ? "text-lg" : "mt-2 text-3xl sm:text-4xl"}`}
          >
            {c.title}
          </h2>
          {!compact && <p className="mt-2 max-w-md text-sm text-parchment/65">{c.sub}</p>}
        </div>
        {!compact && <SparkBadge />}
      </div>

      <div
        ref={scrollerRef}
        className={`flex-1 space-y-4 overflow-y-auto ${compact ? "px-5 py-4" : "max-h-[480px] px-6 py-5 sm:px-8"}`}
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-wrap gap-2">
            {c.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="concierge-chip btn-press rounded-full border border-parchment/15 bg-parchment/5 px-3.5 py-1.5 text-xs font-medium text-parchment/85 hover:border-copper hover:text-parchment"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-copper px-4 py-2.5 text-sm text-parchment">
                {m.text}
              </div>
            </div>
          ) : (
            <AssistantBubble
              key={i}
              msg={m}
              offerById={offerById}
              locale={locale}
              copy={c}
              onAddBundle={onAddBundle}
              onOpenDetails={onOpenDetails}
              animate={!!m.id && m.id === freshId}
              onAnimationDone={() => {
                requestAnimationFrame(() => {
                  scrollerRef.current?.scrollTo({
                    top: scrollerRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                });
              }}
            />
          ),
        )}

        {loading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-parchment/60">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-copper" />
              {c.thinking}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-parchment/5" />
              <div className="h-24 animate-pulse rounded-2xl bg-parchment/5" />
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className={`flex items-center gap-2 border-t border-parchment/10 bg-ink/80 ${compact ? "p-3" : "p-4 sm:p-5"}`}
      >
        <div
          className={`relative flex-1 rounded-full ${loading ? "concierge-thinking" : "concierge-glow"}`}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={c.placeholder}
            className="relative z-[1] w-full min-w-0 rounded-full bg-parchment/10 px-4 py-2.5 text-sm text-parchment placeholder:text-parchment/40 focus:outline-none focus:ring-2 focus:ring-copper"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="ask-sheen btn-press shrink-0 rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-parchment hover:bg-copper-dark disabled:opacity-50"
        >
          {c.send}
        </button>
      </form>
    </section>
  );
}

function AssistantBubble({
  msg,
  offerById,
  locale,
  copy,
  onAddBundle,
  onOpenDetails,
  animate = false,
  onAnimationDone,
}: {
  msg: AssistantMsg;
  offerById: Map<string, Offer>;
  locale: "sq" | "en";
  copy: (typeof COPY)[keyof typeof COPY];
  onAddBundle: (items: Offer[]) => void;
  onOpenDetails?: (offers: Offer[], bundleTitle?: { sq: string; en: string }) => void;
  animate?: boolean;
  onAnimationDone?: () => void;
}) {
  const items = msg.picks
    .map((p) => ({ offer: offerById.get(p.offer_id)!, reason: p.reason }))
    .filter((x) => !!x.offer);
  const total = items.reduce((s, x) => s + x.offer.price_l, 0);
  const detailsLabel = locale === "sq" ? "Shiko detajet" : "View details";

  // Detect reduced motion
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const shouldAnimate = animate && !reducedMotion;

  type Phase = "dots" | "typing" | "cards" | "done";
  const [phase, setPhase] = useState<Phase>(shouldAnimate ? "dots" : "done");
  const [typedCount, setTypedCount] = useState<number>(shouldAnimate ? 0 : msg.intro.length);

  // Phase 1: dots → typing
  useEffect(() => {
    if (!shouldAnimate) return;
    const t = setTimeout(() => setPhase("typing"), TYPING_DOTS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2: typewriter
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedCount >= msg.intro.length) {
      const t = setTimeout(() => {
        setPhase("cards");
        onAnimationDone?.();
      }, CARDS_REVEAL_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedCount((n) => n + 1), TYPE_CHAR_MS);
    return () => clearTimeout(t);
  }, [phase, typedCount, msg.intro, onAnimationDone]);

  // Phase 3 → done after card stagger completes (rough estimate)
  useEffect(() => {
    if (phase !== "cards") return;
    const t = setTimeout(() => setPhase("done"), 600);
    return () => clearTimeout(t);
  }, [phase]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-parchment/10 bg-parchment/5 p-5 text-sm text-parchment/75">
        {copy.empty}
      </div>
    );
  }

  const showCards = phase === "cards" || phase === "done";
  const isTyping = phase === "typing" && typedCount < msg.intro.length;
  const introText = shouldAnimate ? msg.intro.slice(0, typedCount) : msg.intro;

  return (
    <div className="space-y-3">
      {phase === "dots" ? (
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-parchment/5 px-3 py-2">
          <span className="concierge-typing-dot" />
          <span className="concierge-typing-dot" />
          <span className="concierge-typing-dot" />
        </div>
      ) : (
        <p className="font-display text-lg leading-snug text-parchment">
          {introText}
          {isTyping && <span className="concierge-typing-caret" aria-hidden />}
        </p>
      )}

      {showCards && (
        <div className="stagger-rise grid gap-2.5 sm:grid-cols-2">
          {items.map(({ offer, reason }) => (
            <article
              key={offer.id}
              className="rounded-2xl border border-parchment/10 bg-parchment/5 p-4"
            >
              <div className="text-[10px] uppercase tracking-[0.14em] text-copper">
                {offer.category}
              </div>
              <div className="mt-1 text-sm font-medium text-parchment">
                {locale === "sq" ? offer.title_sq : offer.title_en}
              </div>
              <div className="mt-2 font-mono-num text-sm text-parchment/85">
                {formatLek(offer.price_l)}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-parchment/65">{reason}</p>
            </article>
          ))}
        </div>
      )}
      {showCards && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-parchment/5 px-4 py-3">
          <div className="text-xs text-parchment/65">
            {copy.bundleTotal}:{" "}
            <span className="font-mono-num text-parchment">{formatLek(total)}</span>
            {msg.source === "fallback" ? (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-parchment/40">
                · {copy.fallbackNote}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {onOpenDetails && (
              <button
                onClick={() =>
                  onOpenDetails(
                    items.map((x) => x.offer),
                    { sq: msg.intro || "Paketë", en: msg.intro || "Bundle" },
                  )
                }
                className="btn-press rounded-full border border-parchment/20 bg-parchment/5 px-3 py-2 text-xs font-medium text-parchment/85 hover:border-copper hover:text-parchment"
              >
                {detailsLabel}
              </button>
            )}
            <button
              onClick={() => onAddBundle(items.map((x) => x.offer))}
              className="btn-press rounded-full bg-copper px-4 py-2 text-xs font-medium text-parchment hover:bg-copper-dark"
            >
              {copy.addBundle}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SparkBadge() {
  return (
    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-copper/15 text-copper sm:flex">
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
