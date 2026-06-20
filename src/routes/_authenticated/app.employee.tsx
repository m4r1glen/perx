import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useProfile } from "@/lib/use-profile";
import { useStreakOnOpen } from "@/lib/use-streak";
import {
  useOffers,
  useProviders,
  useMyPoints,
  useMySelections,
  useMyCompany,
  formatLek,
  formatNumber,
  type Offer,
  type Provider,
} from "@/lib/use-marketplace";
import { computeTaxSavings } from "@/lib/tax-savings";
import { DEMO_MONTHLY_BUDGET_ALL, ENABLE_DEMO_MODE } from "@/lib/demo-mode";
import { AppShell } from "@/components/app-shell";
import { JoinCompanyBanner } from "@/components/join-company-banner";
import { ConciergeLauncher } from "@/components/concierge-launcher";
import { CountUp } from "@/components/count-up";
import { YearInBenefits } from "@/components/year-in-benefits";
import { PerxMap } from "@/components/perx-map";
import { OfferDetailModal } from "@/components/offer-detail-modal";
import { GiftModal } from "@/components/gift-modal";
import { GiftReveal } from "@/components/gift-reveal";
import { VoucherModal } from "@/components/voucher-modal";
import { ProviderMark } from "@/components/provider-mark";
import { useMyTransfers, displayName, initials, type TransferWithPeople } from "@/lib/use-gifts";

export const Route = createFileRoute("/_authenticated/app/employee")({
  head: () => ({
    meta: [
      { title: "Punonjësi · PERX" },
      { name: "description", content: "Paneli i punonjësit në PERX." },
    ],
  }),
  component: EmployeeDashboard,
});

type Tab = "feed" | "market" | "map" | "savings" | "mine" | "gifts";

function EmployeeDashboard() {
  const { t, locale } = useLocale();
  const e = t.dashboard.employee;
  const { data: profile, isLoading: profileLoading } = useProfile();
  const userId = profile?.id;

  const offersQ = useOffers();
  const providersQ = useProviders();
  const pointsQ = useMyPoints(userId);
  const selectionsQ = useMySelections(userId);
  const companyQ = useMyCompany(undefined); // employee has no owned company; budget shown from any-companies fallback below
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("feed");
  const [cart, setCart] = useState<Offer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [detail, setDetail] = useState<{
    offers: Offer[];
    bundleTitle?: { sq: string; en: string };
  } | null>(null);
  const openDetails = useCallback((offers: Offer[], bundleTitle?: { sq: string; en: string }) => {
    setDetail({ offers, bundleTitle });
  }, []);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftInitial, setGiftInitial] = useState<{
    mode: "points" | "package";
    offerIds?: string[];
  }>({ mode: "points" });
  const openGift = useCallback((init?: { mode: "points" | "package"; offerIds?: string[] }) => {
    setGiftInitial(init ?? { mode: "points" });
    setGiftOpen(true);
  }, []);
  const [voucherSelectionId, setVoucherSelectionId] = useState<string | null>(null);
  const openVoucher = useCallback((selectionId: string) => setVoucherSelectionId(selectionId), []);

  const handleStreakIncrease = useCallback(
    (next: number, _prev: number) => {
      burstConfetti();
      toast.success(e.streakUp, { description: e.streakUpBody });
      void next;
    },
    [e.streakUp, e.streakUpBody],
  );
  useStreakOnOpen(profile ?? null, handleStreakIncrease);

  const providerById = useMemo(() => {
    const m = new Map<string, Provider>();
    (providersQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [providersQ.data]);

  const offerById = useMemo(() => {
    const m = new Map<string, Offer>();
    (offersQ.data ?? []).forEach((o) => m.set(o.id, o));
    return m;
  }, [offersQ.data]);

  function addToCart(o: Offer) {
    setCart((c) => (c.some((x) => x.id === o.id) ? c : [...c, o]));
    toast.success(e.added);
  }
  function removeFromCart(id: string) {
    setCart((c) => c.filter((x) => x.id !== id));
  }
  function addBundle(items: Offer[]) {
    setCart((c) => {
      const ids = new Set(c.map((x) => x.id));
      const merged = [...c];
      items.forEach((o) => {
        if (!ids.has(o.id)) merged.push(o);
      });
      return merged;
    });
    toast.success(e.added);
  }

  const cartTotal = cart.reduce((s, o) => s + o.price_l, 0);

  async function submitSelection() {
    if (!userId || cart.length === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("selections").insert({
      employee_id: userId,
      offer_ids: cart.map((o) => o.id),
      total_l: cartTotal,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    burstConfetti();
    toast.success(e.submitted);
    setCart([]);
    qc.invalidateQueries({ queryKey: ["selections"] });
  }

  // ---- Derived data
  const firstName = (profile?.full_name ?? profile?.email ?? "").split(/\s+/)[0] || "";
  const interests = profile?.interests ?? [];

  const allOffers = offersQ.data ?? [];

  // Drops: pick first 3 offers, give each a deterministic end timestamp
  // anchored to the start of this ISO week so countdowns actually tick down.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const drops = useMemo(() => {
    return allOffers.slice(0, 3).map((o) => ({
      offer: o,
      endsAt: computeDropEnd(o.id, now),
    }));
  }, [allOffers, now]);

  // For you: prefer offers whose category matches any interest, else first 6
  const forYou = useMemo(() => {
    if (interests.length === 0) return allOffers.slice(0, 6);
    const matched = allOffers.filter((o) => interests.includes(o.category));
    if (matched.length >= 3) return matched.slice(0, 6);
    const rest = allOffers.filter((o) => !matched.includes(o));
    return [...matched, ...rest].slice(0, 6);
  }, [allOffers, interests]);

  // Bundles: pick 1 offer from a few different categories
  const bundles = useMemo(() => buildBundles(allOffers, t), [allOffers, t]);

  // Real streak from profile (bumped via useStreakOnOpen)
  const streakWeeks = profile?.streak_count ?? 0;

  // Weekly team challenge: count this week's selections + a few "colleagues"
  // (demo-friendly aggregate so it always feels alive).
  const challenge = useMemo(() => {
    const weekStart = startOfWeek(new Date(now)).getTime();
    const mine = (selectionsQ.data ?? []).filter(
      (s) => new Date(s.created_at).getTime() >= weekStart,
    ).length;
    const teammates = 7; // demo baseline so the bar feels collective
    const value = Math.min(20, mine + teammates);
    return { value, goal: 20 };
  }, [selectionsQ.data, now]);

  // Categories for chip filter
  const categories = useMemo(() => {
    const s = new Set<string>();
    allOffers.forEach((o) => s.add(o.category));
    return Array.from(s);
  }, [allOffers]);
  const [category, setCategory] = useState<string | "all">("all");
  const [providerFilter, setProviderFilter] = useState<{ id: string; name: string } | null>(null);
  const filteredMarket = useMemo(() => {
    let list = allOffers;
    if (providerFilter) list = list.filter((o) => o.provider_id === providerFilter.id);
    if (category !== "all") list = list.filter((o) => o.category === category);
    return list;
  }, [allOffers, category, providerFilter]);

  // Listen for "View offers" clicks from the map InfoWindow.
  useEffect(() => {
    const onView = (ev: Event) => {
      const detail = (ev as CustomEvent<{ providerId: string; providerName: string }>).detail;
      if (!detail?.providerId) return;
      setProviderFilter({ id: detail.providerId, name: detail.providerName });
      setCategory("all");
      setTab("market");
    };
    window.addEventListener("perx:view-provider", onView);
    return () => window.removeEventListener("perx:view-provider", onView);
  }, []);

  const realMonthlyAllowance = companyQ.data?.monthly_budget_per_employee_lek ?? null;
  const usingDemoAllowance = realMonthlyAllowance == null && ENABLE_DEMO_MODE;
  const monthlyAllowance =
    realMonthlyAllowance ?? (usingDemoAllowance ? DEMO_MONTHLY_BUDGET_ALL : 0);
  const spentThisCycle = (selectionsQ.data ?? [])
    .filter((s) => s.status === "paid" || s.status === "approved")
    .reduce((sum, s) => sum + s.total_l, 0);

  const isLoading = profileLoading || offersQ.isLoading || providersQ.isLoading;

  return (
    <div className="min-h-screen overflow-x-clip bg-parchment text-ink">
      <TopBar
        balance={pointsQ.data?.balance ?? 0}
        spent={spentThisCycle}
        allowance={monthlyAllowance}
        demoAllowance={usingDemoAllowance}
        loading={pointsQ.isLoading}
        onGift={() => openGift({ mode: "points" })}
      />

      <main className="mx-auto max-w-7xl px-5 pb-40 pt-8 sm:px-8 sm:pt-12">
        {userId && profile && !profile.company_id ? <JoinCompanyBanner userId={userId} /> : null}
        <Tabs tab={tab} setTab={setTab} labels={e.tabs} />

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-10 [&>*]:min-w-0">
          {isLoading ? (
            <SkeletonGrid />
          ) : tab === "feed" ? (
            <>
              <FeedView
                firstName={firstName}
                streakWeeks={streakWeeks}
                drops={drops}
                forYou={forYou}
                providerById={providerById}
                onAdd={addToCart}
                onOpenDetails={openDetails}
                onOpenWrapped={() => setWrappedOpen(true)}
                challenge={challenge}
                now={now}
                locale={locale}
                t={t}
              />
            </>
          ) : tab === "market" ? (
            <MarketView
              offers={filteredMarket}
              providerById={providerById}
              categories={categories}
              category={category}
              setCategory={setCategory}
              providerFilter={providerFilter}
              onClearProviderFilter={() => setProviderFilter(null)}
              bundles={bundles}
              onAdd={addToCart}
              onAddBundle={addBundle}
              onOpenDetails={openDetails}
              locale={locale}
              t={t}
            />
          ) : tab === "map" ? (
            <MapView t={t} />
          ) : tab === "savings" ? (
            <SavingsView cartTotal={cartTotal} t={t} />
          ) : tab === "gifts" ? (
            <GiftsView
              myId={userId}
              offerById={offerById}
              locale={locale}
              t={t}
              onOpenGift={openGift}
            />
          ) : (
            <MyBenefitsView
              selections={selectionsQ.data ?? []}
              offerById={offerById}
              locale={locale}
              t={t}
              onGift={(offerIds) => openGift({ mode: "package", offerIds })}
              onShowVoucher={openVoucher}
            />
          )}
        </div>
      </main>

      <CartBar
        cart={cart}
        total={cartTotal}
        submitting={submitting}
        onSubmit={submitSelection}
        onRemove={removeFromCart}
        onViewSavings={() => setTab("savings")}
        locale={locale}
        t={t}
      />

      <YearInBenefits
        open={wrappedOpen}
        onClose={() => setWrappedOpen(false)}
        selections={selectionsQ.data ?? []}
        offerById={offerById}
        streakCount={streakWeeks}
        fullName={profile?.full_name ?? null}
      />

      <OfferDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        offers={detail?.offers ?? []}
        bundleTitle={detail?.bundleTitle}
        providerById={providerById}
        pointsBalance={pointsQ.data?.balance ?? 0}
        onAdd={(items) => (items.length > 1 ? addBundle(items) : items[0] && addToCart(items[0]))}
      />

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        myId={userId}
        balance={pointsQ.data?.balance ?? 0}
        offers={allOffers}
        initialMode={giftInitial.mode}
        initialOfferIds={giftInitial.offerIds}
        locale={locale}
      />

      <GiftReveal myId={userId} offerById={offerById} locale={locale} />

      <ConciergeLauncher
        offers={allOffers}
        profile={profile}
        balance={pointsQ.data?.balance ?? 0}
        selections={selectionsQ.data ?? []}
        locale={locale}
        onAddBundle={addBundle}
        onOpenDetails={openDetails}
      />

      <VoucherModal
        open={!!voucherSelectionId}
        onClose={() => setVoucherSelectionId(null)}
        selectionId={voucherSelectionId ?? undefined}
        offerById={offerById}
        providerById={providerById}
      />
    </div>
  );
}

/* -------------------- Top bar -------------------- */

function TopBar({
  balance,
  spent,
  allowance,
  demoAllowance,
  loading,
  onGift,
}: {
  balance: number;
  spent: number;
  allowance: number;
  demoAllowance: boolean;
  loading: boolean;
  onGift: () => void;
}) {
  const { t } = useLocale();
  const e = t.dashboard.employee;
  const qc = useQueryClient();
  const pct = Math.min(100, (spent / Math.max(1, allowance)) * 100);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 sm:py-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-6">
          <Link to="/" className="font-display text-2xl font-medium tracking-tight">
            PERX<span className="text-copper">.</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center justify-end gap-3 sm:justify-center">
              <CoinIcon className="size-4 text-copper" />
              <div className="font-mono-num text-lg sm:text-xl text-ink">
                {loading ? (
                  "…"
                ) : (
                  <CountUp value={balance} pulseOnChange format={(n) => `${formatNumber(n)} L`} />
                )}
              </div>
              <span className="hidden text-xs uppercase tracking-[0.14em] text-ink/55 sm:inline">
                {e.pointsBalance}
              </span>
            </div>
            <div className="mt-2 hidden sm:block">
              <ProgressBar pct={pct} />
              <div className="mt-1 flex justify-between text-[11px] text-ink/55">
                <span>
                  {e.progressLabel}: <span className="font-mono-num">{formatLek(spent)}</span>
                </span>
                <span>
                  {demoAllowance ? "Demo monthly allowance" : e.progressOf}{" "}
                  <span className="font-mono-num">{formatLek(allowance)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGift}
              className="btn-press inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-foreground shadow-sm transition hover:bg-brand-dark"
              title={e.gifts.cta}
            >
              <Gift className="size-4" aria-hidden />
              <span className="hidden sm:inline">{e.gifts.cta}</span>
            </button>
            <LangPill />
            <button
              onClick={handleSignOut}
              className="btn-press hidden rounded-full border border-[var(--hairline)] bg-paper px-3.5 py-1.5 text-sm font-medium text-ink/80 hover:text-ink sm:inline-flex"
            >
              {t.dashboard.signOut}
            </button>
          </div>
        </div>
        <div className="mt-3 sm:hidden">
          <ProgressBar pct={pct} />
        </div>
      </div>
    </header>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-copper-light/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-copper to-copper-dark transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LangPill() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--hairline)] bg-paper p-0.5 text-xs font-medium">
      {(["sq", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`btn-press rounded-full px-2.5 py-1 uppercase tracking-wider transition ${
            locale === l ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* -------------------- Tabs -------------------- */

function Tabs({
  tab,
  setTab,
  labels,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  labels: {
    feed: string;
    market: string;
    savings: string;
    mine: string;
    map: string;
    gifts: string;
  };
}) {
  const items: { id: Tab; label: string }[] = [
    { id: "feed", label: labels.feed },
    { id: "market", label: labels.market },
    { id: "map", label: labels.map },
    { id: "savings", label: labels.savings },
    { id: "mine", label: labels.mine },
    { id: "gifts", label: labels.gifts },
  ];
  return (
    <div className="inline-flex w-full overflow-x-auto rounded-full border border-[var(--hairline)] bg-paper p-1 text-sm font-medium sm:w-auto">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => setTab(i.id)}
          className={`btn-press whitespace-nowrap rounded-full px-4 py-2 transition ${
            tab === i.id ? "bg-ink text-parchment" : "text-ink/65 hover:text-ink"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

function MapView({ t }: { t: ReturnType<typeof useLocale>["t"] }) {
  const m = t.dashboard.employee.map;
  return (
    <section className="space-y-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
          {m.hint}
        </div>
        <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {m.title}
        </h2>
      </div>
      <PerxMap />
    </section>
  );
}

/* -------------------- Feed -------------------- */

function FeedView({
  firstName,
  streakWeeks,
  drops,
  forYou,
  providerById,
  onAdd,
  onOpenDetails,
  onOpenWrapped,
  challenge,
  now,
  locale,
  t,
}: {
  firstName: string;
  streakWeeks: number;
  drops: { offer: Offer; endsAt: Date }[];
  forYou: Offer[];
  providerById: Map<string, Provider>;
  onAdd: (o: Offer) => void;
  onOpenDetails: (offers: Offer[], bundleTitle?: { sq: string; en: string }) => void;
  onOpenWrapped: () => void;
  challenge: { value: number; goal: number };
  now: number;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const challengePct = Math.min(100, (challenge.value / challenge.goal) * 100);
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="hairline rounded-3xl bg-paper p-7 sm:p-10">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
            PERX
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {e.welcome.replace("{name}", firstName || (locale === "sq" ? "mik" : "friend"))}
          </h1>
          <p className="mt-3 max-w-md text-base text-ink/65">
            {locale === "sq"
              ? "Sot ke zgjedhje të reja për të bërë. Le t'i shohim."
              : "Fresh picks are waiting. Let's take a look."}
          </p>
          <button
            onClick={onOpenWrapped}
            className="btn-press mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-gradient-to-r from-ink to-copper-dark px-4 py-2 text-sm font-medium text-parchment hover:opacity-95"
          >
            <SparkIcon className="size-3.5" />
            {e.wrappedCta}
          </button>
        </div>

        <button
          onClick={onOpenWrapped}
          className="hairline group relative overflow-hidden rounded-3xl bg-gradient-to-br from-copper-light via-paper to-paper p-7 text-left sm:p-8"
          aria-label={e.wrappedCta}
        >
          <TrophyIcon className="absolute -right-3 -top-3 size-28 text-copper/15 transition-transform group-hover:scale-105" />
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
            {e.streak}
          </div>
          <div className="mt-2 font-mono-num text-5xl text-ink">{streakWeeks}</div>
          <div className="mt-1 text-sm text-ink/70">
            {e.streakWeeks.replace("{n}", String(streakWeeks))}
          </div>
          <div className="mt-3 text-xs text-ink/55">{e.streakHint}</div>
        </button>
      </section>

      <section className="hairline rounded-2xl bg-paper p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-copper-dark">
              {e.challengeHint}
            </div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight sm:text-xl">
              {e.challengeTitle}
            </h3>
          </div>
          <span className="font-mono-num text-sm text-ink/70">
            {challenge.value}/{challenge.goal}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-copper-light/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sage to-copper transition-[width] duration-700"
            style={{ width: `${challengePct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink/55">
          {e.challengeProgress
            .replace("{n}", String(challenge.value))
            .replace("{goal}", String(challenge.goal))}
        </p>
      </section>

      <section>
        <SectionHead title={e.drops} hint={e.dropsHint} />
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
          {drops.map(({ offer, endsAt }) => (
            <DropCard
              key={offer.id}
              offer={offer}
              endsAt={endsAt}
              now={now}
              provider={providerById.get(offer.provider_id)}
              onAdd={() => onAdd(offer)}
              onOpenDetails={() => onOpenDetails([offer])}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHead title={e.forYou} hint={e.forYouHint} />
        <div className="stagger-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forYou.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              provider={providerById.get(o.provider_id)}
              onAdd={() => onAdd(o)}
              onOpenDetails={() => onOpenDetails([o])}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{title}</h2>
      {hint ? <span className="text-xs text-ink/55">{hint}</span> : null}
    </div>
  );
}

function DropCard({
  offer,
  endsAt,
  now,
  provider,
  onAdd,
  onOpenDetails,
  locale,
  t,
}: {
  offer: Offer;
  endsAt: Date;
  now: number;
  provider: Provider | undefined;
  onAdd: () => void;
  onOpenDetails: () => void;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const msLeft = endsAt.getTime() - now;
  const label =
    msLeft <= 0 ? e.dropEndedJustNow : e.dropEndsIn.replace("{t}", formatDuration(msLeft, locale));
  const detailsLabel = locale === "sq" ? "Shiko detajet" : "View details";
  const providerName = provider?.business_name ?? "—";
  return (
    <article className="card-lift relative flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-copper-light bg-gradient-to-br from-copper-light/60 via-paper to-paper p-5">
      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-copper-dark px-2.5 py-1 font-mono-num text-[11px] font-medium tabular-nums text-parchment">
        <SparkIcon className="size-3" />
        {label}
      </span>
      <div className="text-xs uppercase tracking-wide text-copper-dark">
        {t.categories[offer.category] ?? offer.category}
      </div>
      <h3 className="mt-2 font-display text-xl leading-tight">
        {locale === "sq" ? offer.title_sq : offer.title_en}
      </h3>
      <div className="mt-1 flex items-center gap-1.5">
        <ProviderMark
          name={providerName}
          logoUrl={provider?.logo_url}
          brandColor={provider?.brand_color}
          size="xs"
        />
        <p className="truncate text-xs text-ink/60">{providerName}</p>
      </div>
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between">
          <span className="font-mono-num text-lg">{formatLek(offer.price_l)}</span>
          <button
            onClick={onAdd}
            className="btn-press inline-flex items-center justify-center rounded-full bg-copper px-3.5 py-1.5 text-sm font-medium text-parchment hover:bg-copper-dark"
          >
            {e.add}
          </button>
        </div>
        <button
          onClick={onOpenDetails}
          className="btn-press mt-2 w-full rounded-full border border-[var(--hairline)] bg-paper/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-ink"
        >
          {detailsLabel}
        </button>
      </div>
    </article>
  );
}

function OfferCard({
  offer,
  provider,
  onAdd,
  onOpenDetails,
  locale,
  t,
}: {
  offer: Offer;
  provider: Provider | undefined;
  onAdd: () => void;
  onOpenDetails: () => void;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const detailsLabel = locale === "sq" ? "Shiko detajet" : "View details";
  const providerName = provider?.business_name ?? "—";
  return (
    <article className="card-lift hairline flex flex-col rounded-2xl bg-paper p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ink/55">
        <span>{t.categories[offer.category] ?? offer.category}</span>
        <span className="font-mono-num text-ink">{formatLek(offer.price_l)}</span>
      </div>
      <h3 className="mt-3 font-display text-lg leading-tight">
        {locale === "sq" ? offer.title_sq : offer.title_en}
      </h3>
      <div className="mt-1 flex items-center gap-1.5">
        <ProviderMark
          name={providerName}
          logoUrl={provider?.logo_url}
          brandColor={provider?.brand_color}
          size="xs"
        />
        <p className="truncate text-xs text-ink/60">{providerName}</p>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-ink/70">
        {locale === "sq" ? offer.description_sq : offer.description_en}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {offer.mood.map((m) => (
          <span
            key={m}
            className="rounded-full bg-copper-light px-2 py-0.5 text-[11px] font-medium text-copper-dark"
          >
            {t.moods[m] ?? m}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onOpenDetails}
          className="btn-press flex-1 rounded-full border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm font-medium text-ink/75 hover:text-ink"
        >
          {detailsLabel}
        </button>
        <button
          onClick={onAdd}
          className="btn-press inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink/90"
        >
          {e.add}
        </button>
      </div>
    </article>
  );
}

/* -------------------- Market -------------------- */

function MarketView({
  offers,
  providerById,
  categories,
  category,
  setCategory,
  providerFilter,
  onClearProviderFilter,
  bundles,
  onAdd,
  onAddBundle,
  onOpenDetails,
  locale,
  t,
}: {
  offers: Offer[];
  providerById: Map<string, Provider>;
  categories: string[];
  category: string | "all";
  setCategory: (c: string | "all") => void;
  providerFilter: { id: string; name: string } | null;
  onClearProviderFilter: () => void;
  bundles: Bundle[];
  onAdd: (o: Offer) => void;
  onAddBundle: (items: Offer[]) => void;
  onOpenDetails: (offers: Offer[], bundleTitle?: { sq: string; en: string }) => void;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const provider = providerFilter ? providerById.get(providerFilter.id) : null;
  return (
    <>
      {!providerFilter && (
        <section>
          <SectionHead title={e.bundles} hint={e.bundlesHint} />
          <div className="grid gap-4 md:grid-cols-3">
            {bundles.map((b) => (
              <BundleCard
                key={b.key}
                bundle={b}
                providerById={providerById}
                onAdd={() => onAddBundle(b.items)}
                onOpenDetails={() => onOpenDetails(b.items, { sq: b.title_sq, en: b.title_en })}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHead title={e.browse} hint={e.browseHint} />
        {providerFilter && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--hairline)] bg-paper p-3">
            <ProviderMark
              name={providerFilter.name}
              logoUrl={provider?.logo_url}
              brandColor={provider?.brand_color}
              size="md"
              className="!size-10 !rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-[0.14em] text-ink/55">
                {e.map.usableHere}
              </div>
              <div className="truncate font-display text-base">{providerFilter.name}</div>
            </div>
            <button
              onClick={onClearProviderFilter}
              className="btn-press rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-ink"
            >
              ✕ {e.filterAll}
            </button>
          </div>
        )}
        <div className="mb-5 flex flex-wrap gap-2">
          <Chip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label={e.filterAll}
          />
          {categories.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? "all" : c)}
              label={t.categories[c] ?? c}
            />
          ))}
        </div>

        <div className="stagger-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              provider={providerById.get(o.provider_id)}
              onAdd={() => onAdd(o)}
              onOpenDetails={() => onOpenDetails([o])}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-ink bg-ink text-parchment"
          : "border-[var(--hairline)] bg-paper text-ink/70 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

type Bundle = {
  key: string;
  title_sq: string;
  title_en: string;
  items: Offer[];
  total: number;
  saving: number;
};

function buildBundles(offers: Offer[], t: ReturnType<typeof useLocale>["t"]): Bundle[] {
  const pick = (cats: string[]) => {
    const items: Offer[] = [];
    for (const c of cats) {
      const o = offers.find((x) => x.category === c && !items.includes(x));
      if (o) items.push(o);
    }
    return items;
  };
  const make = (key: string, sq: string, en: string, cats: string[]): Bundle | null => {
    const items = pick(cats);
    if (items.length < 2) return null;
    const total = items.reduce((s, o) => s + o.price_l, 0);
    const saving = Math.round(total * 0.1);
    return { key, title_sq: sq, title_en: en, items, total, saving };
  };
  void t;
  return [
    make("wellweek", "Java e Mirëqenies", "Wellness week", ["fitness", "wellness", "food"]),
    make("focus", "Paketa e Fokusit", "Focus pack", ["learning", "telecom", "health"]),
    make("escape", "Arratisja e Fundjavës", "Weekend escape", ["travel", "food", "wellness"]),
  ].filter((b): b is Bundle => b !== null);
}

function BundleCard({
  bundle,
  providerById,
  onAdd,
  onOpenDetails,
  locale,
  t,
}: {
  bundle: Bundle;
  providerById: Map<string, Provider>;
  onAdd: () => void;
  onOpenDetails: () => void;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const detailsLabel = locale === "sq" ? "Shiko detajet" : "View details";
  // Unique providers represented in the bundle, in order.
  const bundleProviders = (() => {
    const seen = new Set<string>();
    const list: Provider[] = [];
    for (const o of bundle.items) {
      const p = providerById.get(o.provider_id);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list;
  })();
  return (
    <article className="card-lift hairline flex flex-col rounded-2xl bg-gradient-to-br from-paper via-paper to-copper-light/40 p-5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-copper-dark">
        <span>{e.bundles}</span>
        <span className="rounded-full bg-sage/15 px-2 py-0.5 font-medium text-sage">
          {e.bundleSave.replace("{n}", formatNumber(bundle.saving))}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl leading-tight">
        {locale === "sq" ? bundle.title_sq : bundle.title_en}
      </h3>
      {bundleProviders.length > 0 && (
        <div className="mt-3 flex -space-x-1.5">
          {bundleProviders.map((p) => (
            <ProviderMark
              key={p.id}
              name={p.business_name}
              logoUrl={p.logo_url}
              brandColor={p.brand_color}
              size="xs"
              className="ring-1 ring-paper"
            />
          ))}
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm text-ink/75">
        {bundle.items.map((o) => (
          <li key={o.id} className="flex items-baseline justify-between gap-3">
            <span className="truncate">· {locale === "sq" ? o.title_sq : o.title_en}</span>
            <span className="font-mono-num text-xs text-ink/55">{formatLek(o.price_l)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between">
          <span className="font-mono-num text-lg">{formatLek(bundle.total)}</span>
          <button
            onClick={onAdd}
            className="btn-press inline-flex items-center justify-center rounded-full bg-copper px-4 py-2 text-sm font-medium text-parchment hover:bg-copper-dark"
          >
            {e.add}
          </button>
        </div>
        <button
          onClick={onOpenDetails}
          className="btn-press mt-2 w-full rounded-full border border-[var(--hairline)] bg-paper/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:text-ink"
        >
          {detailsLabel}
        </button>
      </div>
    </article>
  );
}

/* -------------------- Savings -------------------- */

function SavingsView({
  cartTotal,
  t,
}: {
  cartTotal: number;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const [value, setValue] = useState<number>(cartTotal > 0 ? cartTotal : 60_000);
  useEffect(() => {
    if (cartTotal > 0) setValue(cartTotal);
  }, [cartTotal]);
  const bd = computeTaxSavings(value);

  return (
    <section className="hairline rounded-3xl bg-paper p-6 sm:p-10">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-copper-dark">
        {e.savingsKicker}
      </div>
      <h2 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {e.savingsTitle}
      </h2>
      <p className="mt-3 max-w-xl text-ink/70">{e.savingsBody}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="hairline rounded-2xl bg-parchment p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-ink/55">{e.savingsAsSalary}</div>
          <div className="mt-2 font-mono-num text-3xl text-ink/85">
            <CountUp value={bd.raiseNet} format={(n) => `${formatNumber(n)} L`} />
          </div>
        </div>
        <div className="hairline rounded-2xl bg-parchment p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-ink/55">
            {e.savingsAsBenefit}
          </div>
          <div className="mt-2 font-mono-num text-3xl text-ink">
            <CountUp value={bd.benefitNet} format={(n) => `${formatNumber(n)} L`} />
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-copper to-copper-dark p-5 text-parchment shadow-lg shadow-copper/20">
          <div className="text-xs uppercase tracking-[0.14em] text-parchment/80">
            {e.savingsKeepsMore}
          </div>
          <div className="mt-2 font-mono-num text-3xl">
            +<CountUp value={bd.difference} pulseOnChange format={(n) => `${formatNumber(n)} L`} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-parchment p-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full flex-col gap-2 sm:max-w-md">
          <span className="text-xs uppercase tracking-[0.14em] text-ink/55">{e.savingsKicker}</span>
          <input
            type="range"
            min={10_000}
            max={300_000}
            step={5_000}
            value={value}
            onChange={(ev) => setValue(Number(ev.target.value))}
            className="accent-copper"
          />
          <span className="font-mono-num text-lg">{formatLek(value)}</span>
        </label>
        <div className="grid grid-cols-3 gap-4 text-xs text-ink/65 sm:text-sm">
          <div>
            <div className="uppercase tracking-[0.12em] text-ink/45">{e.savingsPit}</div>
            <div className="mt-1 font-mono-num text-base text-ink">{formatLek(bd.taxPaid)}</div>
          </div>
          <div>
            <div className="uppercase tracking-[0.12em] text-ink/45">{e.savingsSocial}</div>
            <div className="mt-1 font-mono-num text-base text-ink">{formatLek(bd.socialPaid)}</div>
          </div>
          <div>
            <div className="uppercase tracking-[0.12em] text-ink/45">{e.savingsEffective}</div>
            <div className="mt-1 font-mono-num text-base text-ink">
              {(bd.effectiveRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink/50">{e.savingsDisclaimer}</p>
    </section>
  );
}

/* -------------------- My benefits -------------------- */

function MyBenefitsView({
  selections,
  offerById,
  providerById,
  locale,
  t,
  onGift,
  onShowVoucher,
}: {
  selections: {
    id: string;
    status: "pending" | "approved" | "paid" | "rejected";
    total_l: number;
    offer_ids: string[];
    created_at: string;
  }[];
  offerById: Map<string, Offer>;
  providerById?: Map<string, Provider>;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
  onGift: (offerIds: string[]) => void;
  onShowVoucher: (selectionId: string) => void;
}) {
  const e = t.dashboard.employee;
  if (selections.length === 0) {
    return (
      <section className="hairline rounded-3xl bg-paper p-10 text-center text-ink/60">
        {e.myBenefitsEmpty}
      </section>
    );
  }
  void providerById;
  return (
    <section className="hairline rounded-3xl bg-paper p-6 sm:p-8">
      <SectionHead title={e.myBenefits} />
      <ul className="divide-y divide-[var(--hairline)]">
        {selections.map((s) => {
          const first = offerById.get(s.offer_ids[0]);
          const title = first ? (locale === "sq" ? first.title_sq : first.title_en) : "—";
          const extra = s.offer_ids.length > 1 ? ` +${s.offer_ids.length - 1}` : "";
          const isPaid = s.status === "paid";
          const isPending = s.status === "pending";
          const pillClass = isPaid
            ? "bg-sage/15 text-sage"
            : isPending
              ? "bg-copper-light text-copper-dark"
              : "bg-parchment text-ink/65";
          return (
            <li
              key={s.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[minmax(0,2fr)_auto_auto_auto_auto]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {title}
                  {extra}
                </div>
                <div className="text-xs text-ink/55">
                  {new Date(s.created_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-GB")}
                </div>
              </div>
              <span className="hidden font-mono-num text-sm sm:inline">{formatLek(s.total_l)}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pillClass}`}>
                {e.status[s.status]}
              </span>
              {isPaid ? (
                <button
                  onClick={() => onShowVoucher(s.id)}
                  className="btn-press inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-parchment hover:bg-ink/90"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M3 10h18M8 14h2M12 14h4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {e.voucher.showVoucher}
                </button>
              ) : (
                <span className="hidden sm:inline" />
              )}
              <button
                onClick={() => onGift(s.offer_ids)}
                className="btn-press hidden items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-paper px-3 py-1 text-xs font-medium text-ink/70 hover:text-ink sm:inline-flex"
              >
                <Gift className="size-3.5" aria-hidden /> {e.gifts.cta}
              </button>
              <span className="col-span-2 font-mono-num text-sm sm:hidden">
                {formatLek(s.total_l)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------- Gifts view -------------------- */

function GiftsView({
  myId,
  offerById,
  locale,
  t,
  onOpenGift,
}: {
  myId: string | undefined;
  offerById: Map<string, Offer>;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
  onOpenGift: (init?: { mode: "points" | "package"; offerIds?: string[] }) => void;
}) {
  const g = t.dashboard.employee.gifts;
  const transfersQ = useMyTransfers(myId);
  const all = transfersQ.data ?? [];
  const sent = all.filter((tr) => tr.sender_id === myId);
  const received = all.filter((tr) => tr.recipient_id === myId);

  return (
    <section className="space-y-8">
      <div className="hairline flex flex-col items-start justify-between gap-4 rounded-3xl bg-paper p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-brand-dark">
            <Gift className="size-3.5" aria-hidden /> {g.cta}
          </div>
          <h2 className="mt-1 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            {g.title}
          </h2>
          <p className="mt-1 text-sm text-ink/65">{g.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onOpenGift({ mode: "points" })}
            className="btn-press rounded-full bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink/90"
          >
            {g.tabPoints}
          </button>
          <button
            onClick={() => onOpenGift({ mode: "package" })}
            className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-parchment"
          >
            {g.tabPackage}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GiftList
          title={g.receivedTitle}
          empty={g.receivedEmpty}
          transfers={received}
          perspective="received"
          offerById={offerById}
          locale={locale}
          g={g}
        />
        <GiftList
          title={g.sentTitle}
          empty={g.sentEmpty}
          transfers={sent}
          perspective="sent"
          offerById={offerById}
          locale={locale}
          g={g}
        />
      </div>
    </section>
  );
}

function GiftList({
  title,
  empty,
  transfers,
  perspective,
  offerById,
  locale,
  g,
}: {
  title: string;
  empty: string;
  transfers: TransferWithPeople[];
  perspective: "sent" | "received";
  offerById: Map<string, Offer>;
  locale: "sq" | "en";
  g: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["gifts"];
}) {
  return (
    <div className="hairline rounded-3xl bg-paper p-6 sm:p-8">
      <SectionHead title={title} />
      {transfers.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/55">{empty}</p>
      ) : (
        <ul className="divide-y divide-[var(--hairline)]">
          {transfers.map((tr) => {
            const other = perspective === "sent" ? tr.recipient : tr.sender;
            const name = displayName(other);
            const detail =
              tr.type === "points"
                ? `${formatLek(tr.points_amount)} pts`
                : tr.offer_ids
                    .map((id) => {
                      const o = offerById.get(id);
                      return o ? (locale === "sq" ? o.title_sq : o.title_en) : null;
                    })
                    .filter(Boolean)
                    .join(" · ");
            return (
              <li key={tr.id} className="flex items-start gap-3 py-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-copper to-copper-dark font-display text-xs font-medium text-parchment">
                  {initials(other)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ink/55">{perspective === "sent" ? g.to : g.from}</span>
                    <span className="font-medium">{name}</span>
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${tr.status === "claimed" ? "bg-sage/15 text-sage" : "bg-copper-light text-copper-dark"}`}
                    >
                      {tr.status === "claimed" ? g.statusClaimed : g.statusSent}
                    </span>
                  </div>
                  <div className="mt-1 font-mono-num text-base">{detail || "—"}</div>
                  {tr.gift_message && (
                    <p className="mt-1 text-sm italic text-ink/70">“{tr.gift_message}”</p>
                  )}
                  <div className="mt-1 text-[11px] text-ink/45">
                    {new Date(tr.created_at).toLocaleString(locale === "sq" ? "sq-AL" : "en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------------------- Cart bar -------------------- */

function CartBar({
  cart,
  total,
  submitting,
  onSubmit,
  onRemove,
  onViewSavings,
  locale,
  t,
}: {
  cart: Offer[];
  total: number;
  submitting: boolean;
  onSubmit: () => void;
  onRemove: (id: string) => void;
  onViewSavings: () => void;
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employee;
  const [open, setOpen] = useState(false);
  if (cart.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex justify-center px-4 sm:bottom-0 sm:pb-6">
      <div className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--hairline)] bg-ink text-parchment shadow-2xl shadow-ink/20">
        {open ? (
          <div className="border-b border-parchment/10 p-4">
            <ul className="space-y-2">
              {cart.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{locale === "sq" ? o.title_sq : o.title_en}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num">{formatLek(o.price_l)}</span>
                    <button
                      onClick={() => onRemove(o.id)}
                      className="rounded-full px-2 py-0.5 text-xs text-parchment/60 hover:text-parchment"
                    >
                      {e.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={onViewSavings}
              className="mt-3 text-xs text-copper-light underline-offset-4 hover:underline"
            >
              {e.savingsKicker} →
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <button
            onClick={() => setOpen((v) => !v)}
            className="hidden items-center gap-2 rounded-full bg-parchment/10 px-3 py-1.5 text-xs font-medium text-parchment/80 hover:bg-parchment/15 sm:inline-flex"
          >
            {e.cartItems.replace("{n}", String(cart.length))}
          </button>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] text-parchment/55 sm:hidden">
              {e.cartItems.replace("{n}", String(cart.length))}
            </div>
            <div className="text-xs uppercase tracking-[0.14em] text-parchment/55 sm:block">
              {e.cartTotal}
            </div>
            <div className="font-mono-num text-2xl">{formatLek(total)}</div>
          </div>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-press rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-parchment hover:bg-copper-dark disabled:opacity-60"
          >
            {submitting ? e.submitting : e.submit}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Skeleton / icons / confetti -------------------- */

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="hairline h-48 animate-pulse rounded-2xl bg-paper" />
      ))}
    </div>
  );
}

/* -------------------- Time helpers (streak/drops) -------------------- */

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + mondayOffset);
  return x;
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic drop end: 6..72h from current week's Monday; rolls forward. */
function computeDropEnd(offerId: string, now: number): Date {
  const monday = startOfWeek(new Date(now));
  const hours = (hashString(offerId) % 67) + 6;
  let end = new Date(monday.getTime() + hours * 3_600_000);
  while (end.getTime() <= now) end = new Date(end.getTime() + 7 * 86_400_000);
  return end;
}

function formatDuration(ms: number, locale: "sq" | "en"): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return locale === "sq" ? `${days}d ${rem}h` : `${days}d ${rem}h`;
  }
  if (hours >= 1) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${mins}m`;
}

function burstConfetti() {
  const colors = ["#FF7A33", "#C7541A", "#FFE4D1", "#5F9C75"];
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.85 },
    colors,
    scalar: 0.9,
    ticks: 160,
  });
}

function CoinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M9.5 9.5h4.2a1.8 1.8 0 110 3.6h-3.4a1.8 1.8 0 100 3.6h4.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
    </svg>
  );
}

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4h10v3a5 5 0 11-10 0V4z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 6H3a3 3 0 003 3M19 6h2a3 3 0 01-3 3M9 17h6M10 21h4M12 13v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
