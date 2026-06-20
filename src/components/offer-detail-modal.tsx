import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { formatLek, formatNumber, type Offer, type Provider } from "@/lib/use-marketplace";
import { computeTaxSavings } from "@/lib/tax-savings";
import { useOfferLocations, type OfferLocation } from "@/lib/use-offer-locations";
import { PerxMap } from "@/components/perx-map";
import { ProviderMark } from "@/components/provider-mark";

const FALLBACK_COLOR = "#FF7A33";

// Known travel destinations parsed from offer title for the special travel UI.
const DESTINATIONS: { match: RegExp; city: string; country: string; flag: string }[] = [
  { match: /amalfi/i, city: "Amalfi", country: "Italy", flag: "IT" },
  { match: /paris/i, city: "Paris", country: "France", flag: "FR" },
  { match: /barcelona/i, city: "Barcelona", country: "Spain", flag: "ES" },
  { match: /santorini|greece|greek/i, city: "Santorini", country: "Greece", flag: "GR" },
  { match: /istanbul|turkey|turqi/i, city: "Istanbul", country: "Turkey", flag: "TR" },
];

function findDestination(offer: Offer) {
  const hay = `${offer.title_sq} ${offer.title_en}`;
  return DESTINATIONS.find((d) => d.match.test(hay)) ?? null;
}

const COPY = {
  sq: {
    bundleTag: "Paketë",
    offerTag: "Ofertë",
    description: "Përshkrimi",
    includes: "Përfshin",
    total: "Totali",
    taxKicker: "Kursimi tatimor",
    asSalary: "Si pagë (neto)",
    asBenefit: "Si benefit (neto)",
    keepMore: "Mban më shumë",
    pointsTitle: "Pikët",
    pointsCost: "Kushton",
    pointsBalance: "Bilanci yt",
    pointsEnough: "Ke pikë të mjaftueshme",
    pointsShort: "Të mungojnë {n} L",
    pointsUnit: "1 pikë = 1 L",
    usableSingle: "Përdoret në të gjitha pikat {name} në Shqipëri",
    usableMulti: "Përdoret në këto lokacione",
    bookedInTirana: "Rezervohet në Tiranë",
    enjoyedIn: "Shijohet në {city} {flag}",
    locationsList: "Lokacionet",
    openInMaps: "Hap në Google Maps",
    addToSelection: "Shto në zgjedhje",
    addAll: "Shto të gjithë paketën",
    close: "Mbyll",
    seededDesc: {
      fitness: "Akses në palestër & klasa në grup gjatë gjithë muajit.",
      wellness: "Trajtim relaksues nga profesionistë të certifikuar.",
      travel: "Përvojë e organizuar — udhëtim, akomodim dhe detaje të kuruara.",
      health: "Konsultë mjekësore me specialistë të rrjetit.",
      telecom: "Internet & paketë celulare për një muaj të plotë.",
      food: "Vakte & përvoja kulinare nga kuzhinierë lokalë.",
      learning: "Materiale & sesione mësimore për të rritur shkathtësitë.",
    },
  },
  en: {
    bundleTag: "Bundle",
    offerTag: "Offer",
    description: "Description",
    includes: "Includes",
    total: "Total",
    taxKicker: "Tax savings",
    asSalary: "As salary (net)",
    asBenefit: "As benefit (net)",
    keepMore: "You keep more",
    pointsTitle: "Points",
    pointsCost: "Costs",
    pointsBalance: "Your balance",
    pointsEnough: "You have enough points",
    pointsShort: "You're short by {n} L",
    pointsUnit: "1 point = 1 L",
    usableSingle: "Usable at all {name} locations in Albania",
    usableMulti: "Usable at these locations",
    bookedInTirana: "Booked in Tirana",
    enjoyedIn: "Enjoyed in {city} {flag}",
    locationsList: "Locations",
    openInMaps: "Open in Google Maps",
    addToSelection: "Add to selection",
    addAll: "Add whole bundle",
    close: "Close",
    seededDesc: {
      fitness: "Full month of gym access and group classes.",
      wellness: "Relaxing treatment by certified professionals.",
      travel: "Curated experience — travel, stay, and the small details.",
      health: "Specialist consultation across our health network.",
      telecom: "Mobile & home internet for a full month.",
      food: "Meals and culinary experiences from local chefs.",
      learning: "Materials and sessions to grow your skills.",
    },
  },
} as const;

export type OfferDetailModalProps = {
  open: boolean;
  onClose: () => void;
  /** Single offer or list of offers (bundle). */
  offers: Offer[];
  providerById: Map<string, Provider>;
  /** Optional bundle override title — defaults to the single offer's title. */
  bundleTitle?: { sq: string; en: string };
  /** Employee points balance in L (1pt = 1L). */
  pointsBalance: number;
  /** Add a single offer or merge a bundle into the selection cart. */
  onAdd: (offers: Offer[]) => void;
};

export function OfferDetailModal({
  open,
  onClose,
  offers,
  providerById,
  bundleTitle,
  pointsBalance,
  onAdd,
}: OfferDetailModalProps) {
  const { locale } = useLocale();
  const c = COPY[locale];
  const isBundle = !!bundleTitle || offers.length > 1;

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const allLocations = useOfferLocations();
  const offerIds = useMemo(() => new Set(offers.map((o) => o.id)), [offers]);
  const filteredLocations = useMemo<OfferLocation[]>(
    () => (allLocations.data ?? []).filter((l) => offerIds.has(l.offer_id)),
    [allLocations.data, offerIds],
  );

  const total = offers.reduce((s, o) => s + o.price_l, 0);
  const tax = computeTaxSavings(total);

  const uniqueProviders = useMemo(() => {
    const m = new Map<string, Provider>();
    offers.forEach((o) => {
      const p = providerById.get(o.provider_id);
      if (p) m.set(p.id, p);
    });
    return Array.from(m.values());
  }, [offers, providerById]);

  const headerTitle = bundleTitle
    ? locale === "sq"
      ? bundleTitle.sq
      : bundleTitle.en
    : ((locale === "sq" ? offers[0]?.title_sq : offers[0]?.title_en) ?? "");

  // Travel detection
  const travelDestination = useMemo(() => {
    const travelOffer = offers.find((o) => o.category === "travel");
    return travelOffer ? findDestination(travelOffer) : null;
  }, [offers]);

  // Usable-at caption above the map
  const mapCaption = useMemo(() => {
    if (travelDestination) {
      return `${c.bookedInTirana} · ${c.enjoyedIn.replace("{city}", travelDestination.city).replace("{flag}", travelDestination.flag)}`;
    }
    if (uniqueProviders.length === 1) {
      return c.usableSingle.replace("{name}", uniqueProviders[0].business_name);
    }
    return c.usableMulti;
  }, [travelDestination, uniqueProviders, c]);

  const pointsShort = Math.max(0, total - pointsBalance);
  const pointsPct = Math.min(100, (pointsBalance / Math.max(1, total)) * 100);
  const pointsEnough = pointsBalance >= total;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-detail-title"
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
    >
      {/* Backdrop */}
      <button
        aria-label={c.close}
        onClick={onClose}
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Sheet / Modal */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[var(--hairline)] bg-paper text-ink shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-300 sm:max-h-[88vh] sm:rounded-3xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label={c.close}
          className="absolute right-4 top-4 z-20 grid size-9 place-items-center rounded-full bg-parchment/80 text-ink/70 backdrop-blur transition hover:bg-parchment hover:text-ink"
        >
          <X className="size-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-32 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
          {/* Header */}
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-copper-dark">
            {isBundle ? c.bundleTag : c.offerTag}
          </div>
          <h2
            id="offer-detail-title"
            className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl"
          >
            {headerTitle}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <ProviderChips providers={uniqueProviders} />
            <span className="ml-auto font-mono-num text-2xl tabular-nums sm:text-3xl">
              {formatLek(total)}
            </span>
          </div>

          {/* Bundle item rows */}
          {isBundle && (
            <section className="mt-6">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
                {c.includes}
              </div>
              <ul className="mt-3 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-parchment/60">
                {offers.map((o) => {
                  const p = providerById.get(o.provider_id);
                  const name = p?.business_name ?? "—";
                  return (
                    <li
                      key={o.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
                    >
                      <ProviderMark
                        name={name}
                        logoUrl={p?.logo_url}
                        brandColor={p?.brand_color}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {locale === "sq" ? o.title_sq : o.title_en}
                        </div>
                        <div className="truncate text-xs text-ink/55">{name}</div>
                      </div>
                      <span className="font-mono-num text-sm tabular-nums">
                        {formatLek(o.price_l)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Descriptions */}
          <section className="mt-7 space-y-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
              {c.description}
            </div>
            {offers.map((o) => {
              const desc =
                (locale === "sq" ? o.description_sq : o.description_en) ??
                c.seededDesc[o.category as keyof typeof c.seededDesc] ??
                "";
              return (
                <div key={o.id} className="text-sm leading-relaxed text-ink/75">
                  {isBundle && (
                    <span className="mr-2 font-medium text-ink">
                      {locale === "sq" ? o.title_sq : o.title_en} —
                    </span>
                  )}
                  {desc}
                </div>
              );
            })}
          </section>

          {/* Tax savings strip */}
          <section className="mt-7 overflow-hidden rounded-3xl border border-copper-light bg-gradient-to-br from-copper-light/60 via-paper to-paper p-5 sm:p-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper-dark">
              {c.taxKicker}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-ink/60">{c.asSalary}</div>
                <div className="mt-1 font-mono-num text-xl tabular-nums text-ink/70 line-through">
                  {formatLek(tax.raiseNet)}
                </div>
              </div>
              <div>
                <div className="text-xs text-ink/60">{c.asBenefit}</div>
                <div className="mt-1 font-mono-num text-xl tabular-nums">
                  {formatLek(tax.benefitNet)}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 rounded-2xl bg-copper px-4 py-3 text-parchment">
              <span className="text-xs font-medium uppercase tracking-[0.14em] opacity-90">
                {c.keepMore}
              </span>
              <span className="font-mono-num text-2xl font-medium tabular-nums">
                +{formatLek(tax.difference)}
              </span>
            </div>
          </section>

          {/* Points line */}
          <section className="mt-7 rounded-2xl border border-[var(--hairline)] bg-parchment/60 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/55">
                  {c.pointsTitle}
                </div>
                <div className="mt-1 text-sm">
                  <span className="text-ink/70">{c.pointsCost}: </span>
                  <span className="font-mono-num font-medium tabular-nums">{formatLek(total)}</span>
                </div>
              </div>
              <div className="text-right text-xs text-ink/60">
                {c.pointsBalance}
                <div className="font-mono-num text-sm tabular-nums text-ink">
                  {formatLek(pointsBalance)}
                </div>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-copper-light/60">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${pointsEnough ? "bg-sage" : "bg-copper"}`}
                style={{ width: `${pointsPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink/55">
              <span>{c.pointsUnit}</span>
              <span className={pointsEnough ? "text-sage" : "text-copper-dark"}>
                {pointsEnough
                  ? c.pointsEnough
                  : c.pointsShort.replace("{n}", formatNumber(pointsShort))}
              </span>
            </div>
          </section>

          {/* Map */}
          <section className="mt-7">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-ink/75">{mapCaption}</p>
              {travelDestination && (
                <span className="inline-flex items-center gap-1 rounded-full border border-copper-light bg-copper-light/40 px-2.5 py-1 text-[11px] font-medium text-copper-dark">
                  {travelDestination.flag} {travelDestination.city}
                </span>
              )}
            </div>
            {allLocations.isLoading ? (
              <div className="h-[280px] w-full animate-pulse rounded-3xl border border-[var(--hairline)] bg-parchment/60" />
            ) : filteredLocations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--hairline)] bg-parchment/40 p-6 text-center text-sm text-ink/55">
                {locale === "sq"
                  ? "Lokacionet do të konfirmohen pas miratimit."
                  : "Locations will be confirmed after approval."}
              </div>
            ) : (
              <PerxMap
                locations={filteredLocations}
                showFilters={false}
                heightClass="h-[280px] sm:h-[340px]"
              />
            )}

            {filteredLocations.length > 0 && (
              <ul className="mt-4 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-paper">
                {filteredLocations.map((loc) => {
                  const color = loc.provider.brand_color || FALLBACK_COLOR;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
                  return (
                    <li
                      key={loc.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
                    >
                      <span
                        className="size-2.5 rounded-sm"
                        aria-hidden
                        style={{ background: color }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{loc.name}</div>
                        <div className="truncate text-xs text-ink/55">
                          {loc.provider.business_name}
                          {loc.city ? ` · ${loc.city}` : ""}
                        </div>
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1 text-[11px] font-medium text-ink/75 hover:text-ink"
                      >
                        {c.openInMaps}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Sticky footer actions */}
        <div className="absolute inset-x-0 bottom-0 border-t border-[var(--hairline)] bg-paper/95 px-6 py-4 backdrop-blur sm:static sm:bg-paper">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={onClose}
              className="btn-press rounded-full border border-[var(--hairline)] bg-parchment px-5 py-2.5 text-sm font-medium text-ink/75 hover:text-ink"
            >
              {c.close}
            </button>
            <button
              onClick={() => {
                onAdd(offers);
                onClose();
              }}
              className="btn-press inline-flex items-center justify-center rounded-full bg-copper px-5 py-2.5 text-sm font-medium text-parchment hover:bg-copper-dark"
            >
              {isBundle ? c.addAll : c.addToSelection}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderChips({ providers }: { providers: Provider[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {providers.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-parchment py-1 pl-1 pr-3 text-xs"
        >
          <ProviderMark
            name={p.business_name}
            logoUrl={p.logo_url}
            brandColor={p.brand_color}
            size="xs"
          />
          <span className="font-medium text-ink">{p.business_name}</span>
        </span>
      ))}
    </div>
  );
}
