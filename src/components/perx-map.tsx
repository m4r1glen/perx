import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useOfferLocations, type OfferLocation } from "@/lib/use-offer-locations";
import { formatLek } from "@/lib/use-marketplace";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_GOOGLE_MAPS_TRACKING_ID as string | undefined;
// Google's documented demo mapId — enables AdvancedMarkerElement without Cloud Console setup.
const DEMO_MAP_ID = "DEMO_MAP_ID";

// Albania centroid (roughly center of country)
const ALBANIA_CENTER = { lat: 41.1533, lng: 20.1683 };

const CATEGORY_GLYPHS: Record<string, string> = {
  fitness: "Fi",
  wellness: "We",
  travel: "Tr",
  health: "He",
  telecom: "Te",
  food: "Fo",
  learning: "Le",
};

const FALLBACK_COLOR = "#FF7A33";

// Singleton loader for the Google Maps JS API.
let mapsPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }
  if (mapsPromise) return mapsPromise;
  if (!MAPS_KEY) return Promise.reject(new Error("Missing Google Maps key"));

  mapsPromise = new Promise((resolve, reject) => {
    const cbName = `__perxInitMap_${Date.now()}`;
    (window as unknown as Record<string, () => void>)[cbName] = () => {
      const g = (window as unknown as { google?: typeof google }).google;
      if (g?.maps) resolve(g);
      else reject(new Error("Maps did not initialize"));
      delete (window as unknown as Record<string, unknown>)[cbName];
    };
    const params = new URLSearchParams({
      key: MAPS_KEY,
      v: "weekly",
      libraries: "marker",
      loading: "async",
      callback: cbName,
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

export type PerxMapProps = {
  /** Optional preset of locations; defaults to all from DB */
  locations?: OfferLocation[];
  /** Height utility classes */
  heightClass?: string;
  /** Show category filter chips above the map */
  showFilters?: boolean;
};

export function PerxMap({
  locations: presetLocations,
  heightClass,
  showFilters = true,
}: PerxMapProps) {
  const { locale, t } = useLocale();
  const m = t.dashboard.employee.map;
  const all = useOfferLocations();
  const allLocations = presetLocations ?? all.data ?? [];

  const categories = useMemo(() => {
    const s = new Set<string>();
    allLocations.forEach((l) => s.add(l.provider.category ?? l.offer.category));
    return Array.from(s);
  }, [allLocations]);

  const [category, setCategory] = useState<string | "all">("all");
  const visible = useMemo(
    () =>
      category === "all"
        ? allLocations
        : allLocations.filter((l) => (l.provider.category ?? l.offer.category) === category),
    [allLocations, category],
  );

  const h = heightClass ?? "h-[420px] sm:h-[560px] lg:h-[640px]";

  // No key — render fallback.
  if (!MAPS_KEY) {
    return (
      <FallbackList
        locations={visible}
        categories={categories}
        category={category}
        setCategory={setCategory}
        showFilters={showFilters}
        locale={locale}
        m={m}
      />
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <CategoryChips
          categories={categories}
          category={category}
          setCategory={setCategory}
          filterAll={m.filterAll}
          t={t}
          venuesLabel={m.venuesCount.replace("{n}", String(visible.length))}
        />
      )}
      <MapCanvas locations={visible} heightClass={h} locale={locale} m={m} />
    </div>
  );
}

function CategoryChips({
  categories,
  category,
  setCategory,
  filterAll,
  t,
  venuesLabel,
}: {
  categories: string[];
  category: string | "all";
  setCategory: (c: string | "all") => void;
  filterAll: string;
  t: ReturnType<typeof useLocale>["t"];
  venuesLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setCategory("all")}
        className={`btn-press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          category === "all"
            ? "border-ink bg-ink text-parchment"
            : "border-[var(--hairline)] bg-paper text-ink/70 hover:text-ink"
        }`}
      >
        {filterAll}
      </button>
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => setCategory(category === c ? "all" : c)}
          className={`btn-press rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            category === c
              ? "border-ink bg-ink text-parchment"
              : "border-[var(--hairline)] bg-paper text-ink/70 hover:text-ink"
          }`}
        >
          {t.categories[c] ?? c}
        </button>
      ))}
      <span className="ml-auto text-xs text-ink/55">{venuesLabel}</span>
    </div>
  );
}

function MapCanvas({
  locations,
  heightClass,
  locale,
  m,
}: {
  locations: OfferLocation[];
  heightClass: string;
  locale: "sq" | "en";
  m: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["map"];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Initialize map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled || !containerRef.current) return;
        const { Map, InfoWindow } = (await g.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const map = new Map(containerRef.current, {
          center: ALBANIA_CENTER,
          zoom: 7,
          mapId: DEMO_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        infoRef.current = new InfoWindow({ disableAutoPan: false });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Delegated listener for the "View offers" button rendered inside InfoWindow HTML.
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.("[data-perx-view-provider]") as HTMLElement | null;
      if (!btn) return;
      const providerId = btn.getAttribute("data-perx-view-provider");
      const providerName = btn.getAttribute("data-perx-provider-name") ?? "";
      if (!providerId) return;
      window.dispatchEvent(
        new CustomEvent("perx:view-provider", { detail: { providerId, providerName } }),
      );
      infoRef.current?.close();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Render markers when locations change & map ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    let cancelled = false;

    (async () => {
      const g = (window as unknown as { google: typeof google }).google;
      const { AdvancedMarkerElement } = (await g.maps.importLibrary(
        "marker",
      )) as google.maps.MarkerLibrary;
      if (cancelled) return;

      // Clear old markers
      markersRef.current.forEach((mk) => (mk.map = null));
      markersRef.current = [];

      if (locations.length === 0) return;

      const bounds = new g.maps.LatLngBounds();

      for (const loc of locations) {
        const color = loc.provider.brand_color || FALLBACK_COLOR;
        const glyph = CATEGORY_GLYPHS[loc.provider.category ?? loc.offer.category] ?? "•";

        const el = document.createElement("div");
        el.className = "perx-pin";
        const hasLogo = !!loc.provider.logo_url;
        const bg = hasLogo ? "#FFFFFF" : color;
        const fg = hasLogo ? color : "#FFFFFF";
        el.setAttribute(
          "style",
          `display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;background:${bg};color:${fg};font-size:12px;font-weight:700;letter-spacing:-0.02em;line-height:1;box-shadow:0 6px 18px rgba(20,15,10,0.28),0 0 0 3px ${color},0 0 0 6px rgba(255,255,255,0.92);transform:translateY(-6px);cursor:pointer;font-family:Inter,system-ui,sans-serif;overflow:hidden;`,
        );
        if (hasLogo) {
          el.innerHTML = `<img src="${loc.provider.logo_url}" alt="" style="width:34px;height:34px;border-radius:8px;object-fit:contain;background:#FFFFFF;" />`;
        } else {
          el.textContent = glyph;
        }

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: Number(loc.latitude), lng: Number(loc.longitude) },
          content: el,
          title: loc.name,
        });

        marker.addListener("click", () => {
          if (!infoRef.current) return;
          infoRef.current.setContent(buildInfoHtml(loc, locale, m));
          infoRef.current.open({ map, anchor: marker });
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: Number(loc.latitude), lng: Number(loc.longitude) });
      }

      if (locations.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(13);
      } else {
        map.fitBounds(bounds, 64);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locations, status, locale, m]);

  return (
    <div
      className={`relative ${heightClass} w-full overflow-hidden rounded-3xl border border-[var(--hairline)] bg-paper`}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-parchment/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-copper/30 border-t-copper" />
            <span className="text-xs uppercase tracking-[0.16em] text-ink/55">{m.loading}</span>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-parchment/95 p-6 text-center">
          <div>
            <div className="font-display text-lg">{m.fallbackTitle}</div>
            <p className="mt-1 text-sm text-ink/65">{m.fallbackBody}</p>
          </div>
        </div>
      )}
      {status === "ready" && locations.length === 0 && (
        <div className="absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-paper px-4 py-1.5 text-xs text-ink/65 shadow">
          {m.empty}
        </div>
      )}
    </div>
  );
}

function buildInfoHtml(
  loc: OfferLocation,
  locale: "sq" | "en",
  m: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["map"],
): string {
  const title = locale === "sq" ? loc.offer.title_sq : loc.offer.title_en;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
  const color = loc.provider.brand_color || FALLBACK_COLOR;
  const price = formatLek(loc.offer.price_l);
  const esc = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
    );
  return `
<div style="font-family:system-ui,sans-serif;max-width:260px;padding:6px 4px 2px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${color};"></span>
    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#7a6f63;">${esc(loc.provider.business_name)}</span>
  </div>
  <div style="font-family:'Fraunces',Georgia,serif;font-size:18px;line-height:1.2;color:#1a140e;margin-top:6px;">${esc(loc.name)}</div>
  <div style="font-size:12px;color:#7a6f63;margin-top:2px;">${esc(loc.address ?? "")}${loc.city ? ` · ${esc(loc.city)}` : ""}</div>
  <div style="margin-top:10px;padding-top:8px;border-top:1px solid #ece4d6;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#7a6f63;">${esc(m.usableHere)}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;gap:8px;">
      <span style="font-size:14px;color:#1a140e;">${esc(title)}</span>
      <span style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#1a140e;">${esc(price)}</span>
    </div>
  </div>
  <button data-perx-view-provider="${esc(loc.provider.id)}" data-perx-provider-name="${esc(loc.provider.business_name)}" style="display:block;width:100%;margin-top:12px;padding:9px 12px;border-radius:999px;border:0;background:${color};color:#FFFFFF;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,system-ui,sans-serif;">${esc(m.viewOffers)}</button>
  <div style="display:flex;gap:6px;margin-top:8px;">
    <a href="${mapsUrl}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:7px 10px;border-radius:999px;background:#FBF7F1;color:#1a140e;text-decoration:none;font-size:12px;font-weight:500;border:1px solid #ece4d6;">${esc(m.openInMaps)}</a>
    <a href="${dirUrl}" target="_blank" rel="noopener" style="flex:1;text-align:center;padding:7px 10px;border-radius:999px;background:#FBF7F1;color:#1a140e;text-decoration:none;font-size:12px;font-weight:500;border:1px solid #ece4d6;">${esc(m.directions)}</a>
  </div>
</div>`;
}

function FallbackList({
  locations,
  categories,
  category,
  setCategory,
  showFilters,
  locale,
  m,
}: {
  locations: OfferLocation[];
  categories: string[];
  category: string | "all";
  setCategory: (c: string | "all") => void;
  showFilters: boolean;
  locale: "sq" | "en";
  m: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["map"];
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-4">
      {showFilters && (
        <CategoryChips
          categories={categories}
          category={category}
          setCategory={setCategory}
          filterAll={m.filterAll}
          t={t}
          venuesLabel={m.venuesCount.replace("{n}", String(locations.length))}
        />
      )}
      <div className="hairline rounded-3xl bg-paper p-5 sm:p-6">
        <div className="text-xs uppercase tracking-[0.14em] text-copper-dark">
          {m.fallbackTitle}
        </div>
        <p className="mt-1 text-sm text-ink/65">{m.fallbackBody}</p>
        <ul className="mt-5 divide-y divide-[var(--hairline)]">
          {locations.map((loc) => {
            const color = loc.provider.brand_color || FALLBACK_COLOR;
            const title = locale === "sq" ? loc.offer.title_sq : loc.offer.title_en;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
            return (
              <li
                key={loc.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3"
              >
                <span className="size-3 rounded-sm" style={{ background: color }} aria-hidden />
                <div className="min-w-0">
                  <div className="truncate font-medium">{loc.name}</div>
                  <div className="truncate text-xs text-ink/55">
                    {loc.provider.business_name} · {title}
                    {loc.city ? ` · ${loc.city}` : ""}
                  </div>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1 text-xs font-medium text-ink/75 hover:text-ink"
                >
                  {m.openInMaps}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
