import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-context";
import { formatLek, type Offer, type Provider } from "@/lib/use-marketplace";
import { computeTaxSavings } from "@/lib/tax-savings";
import { fetchSignedToken, useVouchersForSelection, type Voucher } from "@/lib/use-vouchers";
import { ProviderMark } from "@/components/provider-mark";

type Props = {
  open: boolean;
  onClose: () => void;
  selectionId: string | undefined;
  offerById: Map<string, Offer>;
  providerById: Map<string, Provider>;
};

const ROTATE_MS = 30_000;

export function VoucherModal({ open, onClose, selectionId, offerById, providerById }: Props) {
  const { t, locale } = useLocale();
  const v = t.dashboard.employee.voucher;
  const vouchersQ = useVouchersForSelection(open ? selectionId : undefined);
  const vouchers = vouchersQ.data ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  // Pick the first valid voucher by default whenever data arrives or selection changes
  useEffect(() => {
    if (!open) return;
    if (vouchers.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !vouchers.some((x) => x.id === activeId)) {
      const firstValid = vouchers.find((x) => x.status === "valid") ?? vouchers[0];
      setActiveId(firstValid.id);
    }
  }, [open, vouchers, activeId]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const active = vouchers.find((x) => x.id === activeId) ?? null;
  const isBundle = vouchers.length > 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="voucher-enter w-full max-w-[440px] max-h-[100dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {vouchersQ.isLoading ? (
          <div className="bg-paper p-10 text-center text-ink/60">{v.loadingToken}</div>
        ) : vouchers.length === 0 ? (
          <div className="bg-paper p-10 text-center text-ink/60">
            {v.loadError}
            <div className="mt-4">
              <button
                onClick={onClose}
                className="rounded-full bg-ink px-4 py-2 text-sm text-parchment"
              >
                {v.close}
              </button>
            </div>
          </div>
        ) : (
          <>
            {isBundle && (
              <BundleSwitcher
                vouchers={vouchers}
                activeId={activeId}
                onPick={setActiveId}
                providerById={providerById}
                offerById={offerById}
                locale={locale}
                v={v}
              />
            )}
            {active && (
              <VoucherPass
                key={active.id}
                voucher={active}
                provider={providerById.get(active.provider_id)}
                offer={offerById.get(active.offer_id)}
                locale={locale}
                v={v}
                onClose={onClose}
              />
            )}
          </>
        )}
      </div>

      <style>{`
        .voucher-enter { animation: voucherIn 320ms cubic-bezier(.2,.7,.2,1); }
        @keyframes voucherIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .qr-ring {
          position: absolute; inset: -6px;
          border-radius: 18px;
          background: conic-gradient(from 0deg, transparent 0%, color-mix(in oklab, var(--copper) 65%, transparent) 35%, transparent 70%);
          filter: blur(8px); opacity: .55;
          animation: qrRing 6s linear infinite;
          pointer-events: none;
        }
        @keyframes qrRing { to { transform: rotate(360deg); } }
        .qr-shimmer {
          position: absolute; inset: 0; border-radius: 12px;
          background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%);
          background-size: 220% 100%;
          animation: qrShimmer 3.4s ease-in-out infinite;
          pointer-events: none; mix-blend-mode: overlay;
        }
        @keyframes qrShimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
        @media (prefers-reduced-motion: reduce) {
          .voucher-enter { animation: none; }
          .qr-ring, .qr-shimmer { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* -------- Bundle switcher -------- */

function BundleSwitcher({
  vouchers,
  activeId,
  onPick,
  providerById,
  offerById,
  locale,
  v,
}: {
  vouchers: Voucher[];
  activeId: string | null;
  onPick: (id: string) => void;
  providerById: Map<string, Provider>;
  offerById: Map<string, Offer>;
  locale: "sq" | "en";
  v: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["voucher"];
}) {
  return (
    <div className="hairline rounded-t-3xl bg-paper px-4 pb-2 pt-4 sm:rounded-t-3xl">
      <div className="px-1 pb-2">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-copper-dark">
          {v.bundleHeading}
        </div>
        <div className="mt-0.5 text-xs text-ink/60">{v.bundleNote}</div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {vouchers.map((vc) => {
          const prov = providerById.get(vc.provider_id);
          const offer = offerById.get(vc.offer_id);
          const title = offer
            ? locale === "sq"
              ? offer.title_sq
              : offer.title_en
            : (prov?.business_name ?? "—");
          const isActive = vc.id === activeId;
          const dim = vc.status !== "valid";
          return (
            <button
              key={vc.id}
              onClick={() => onPick(vc.id)}
              className={`btn-press flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                isActive
                  ? "border-ink bg-ink text-parchment"
                  : "border-[var(--hairline)] bg-paper text-ink/75 hover:text-ink"
              } ${dim && !isActive ? "opacity-60" : ""}`}
              aria-pressed={isActive}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: prov?.brand_color ?? "var(--copper)" }}
                aria-hidden
              />
              <span className="max-w-[160px] truncate">{prov?.business_name ?? title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------- The pass itself -------- */

function VoucherPass({
  voucher,
  provider,
  offer,
  locale,
  v,
  onClose,
}: {
  voucher: Voucher;
  provider: Provider | undefined;
  offer: Offer | undefined;
  locale: "sq" | "en";
  v: ReturnType<typeof useLocale>["t"]["dashboard"]["employee"]["voucher"];
  onClose: () => void;
}) {
  const isValid = voucher.status === "valid" && new Date(voucher.expires_at).getTime() > Date.now();
  const isRedeemed = voucher.status === "redeemed";
  const isExpired =
    voucher.status === "expired" ||
    (!isRedeemed && new Date(voucher.expires_at).getTime() <= Date.now());
  const isCancelled = voucher.status === "cancelled";

  const [token, setToken] = useState<string | null>(null);
  const [tokenErr, setTokenErr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch + rotate signed token
  const fetchToken = useCallback(async () => {
    try {
      const res = await fetchSignedToken(voucher.id);
      if (!mountedRef.current) return;
      if (res.ok && res.token) {
        setToken(res.token);
        setTokenErr(false);
      } else {
        setTokenErr(true);
      }
    } catch {
      if (mountedRef.current) setTokenErr(true);
    }
  }, [voucher.id]);

  useEffect(() => {
    mountedRef.current = true;
    if (!isValid) return; // do not sign used/expired/cancelled vouchers
    void fetchToken();
    const id = window.setInterval(() => {
      void fetchToken();
    }, ROTATE_MS);
    return () => {
      mountedRef.current = false;
      window.clearInterval(id);
    };
  }, [fetchToken, isValid]);

  // Render QR whenever token changes
  useEffect(() => {
    if (!token) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 360,
      color: { dark: "#14151A", light: "#FFFDF8" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setTokenErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const offerTitle = offer ? (locale === "sq" ? offer.title_sq : offer.title_en) : "—";
  const providerName = provider?.business_name ?? "";
  const brandColor = provider?.brand_color ?? "#FF7A33";
  const tax = useMemo(() => computeTaxSavings(voucher.value_l), [voucher.value_l]);

  const expiryDate = new Date(voucher.expires_at).toLocaleDateString(
    locale === "sq" ? "sq-AL" : "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );
  const redeemedDate = voucher.redeemed_at
    ? new Date(voucher.redeemed_at).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const statusChip = isRedeemed
    ? { label: v.redeemed, klass: "bg-parchment text-ink/55" }
    : isExpired
      ? { label: v.expired, klass: "bg-clay/10 text-clay" }
      : isCancelled
        ? { label: v.cancelled, klass: "bg-clay/10 text-clay" }
        : { label: v.valid, klass: "bg-sage/15 text-sage" };

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      toast.success(v.copied);
    } catch {
      /* noop */
    }
  }, [voucher.code, v.copied]);

  // Ticket-notch SVG mask: two small circles cut out of left/right edges
  // Implemented via radial-gradient mask for crisp edges.
  const ticketStyle: React.CSSProperties = {
    background: "var(--paper)",
    WebkitMaskImage:
      "radial-gradient(circle 10px at 0 50%, transparent 99%, #000 100%), radial-gradient(circle 10px at 100% 50%, transparent 99%, #000 100%)",
    maskImage:
      "radial-gradient(circle 10px at 0 50%, transparent 99%, #000 100%), radial-gradient(circle 10px at 100% 50%, transparent 99%, #000 100%)",
    WebkitMaskComposite: "source-in" as never,
    maskComposite: "intersect" as never,
  };

  return (
    <article
      className="relative rounded-3xl shadow-[0_24px_60px_-30px_rgba(20,21,26,0.45)]"
      style={ticketStyle}
    >
      {/* Top brand bar */}
      <header
        className="flex items-center justify-between gap-3 rounded-t-3xl px-5 py-4"
        style={{ background: `color-mix(in oklab, ${brandColor} 14%, var(--paper))` }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ProviderMark
            name={providerName || "—"}
            logoUrl={provider?.logo_url}
            brandColor={brandColor}
            size="md"
          />
          <div className="min-w-0">
            <div className="truncate text-xs font-medium uppercase tracking-[0.14em] text-ink/65">
              {providerName}
            </div>
            <div className="truncate font-display text-lg font-medium tracking-tight">
              {offerTitle}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusChip.klass}`}
        >
          {statusChip.label}
        </span>
      </header>

      {/* Dashed perforation */}
      <div
        className="relative mx-5 my-1 border-t border-dashed border-[var(--hairline)]"
        aria-hidden
      />

      {/* Center: QR */}
      <section className="px-5 pb-5 pt-3">
        <div className="mx-auto flex w-fit flex-col items-center">
          <div className="relative">
            {isValid && <span className="qr-ring" aria-hidden />}
            <div className="relative rounded-xl bg-paper p-3 shadow-[0_2px_0_rgba(20,21,26,0.04)] ring-1 ring-[var(--hairline)]">
              <div className="relative h-[240px] w-[240px] overflow-hidden rounded-md">
                {qrDataUrl && isValid ? (
                  <>
                    <img
                      src={qrDataUrl}
                      alt={`QR ${voucher.code}`}
                      width={240}
                      height={240}
                      className="block h-[240px] w-[240px]"
                    />
                    <span className="qr-shimmer" aria-hidden />
                  </>
                ) : isValid && !tokenErr ? (
                  <div className="grid h-full w-full place-items-center">
                    <span
                      className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ink/15 border-t-ink/60"
                      aria-label={v.loadingToken}
                    />
                  </div>
                ) : (
                  // Redeemed / expired / cancelled / error → dimmed QR-shaped placeholder
                  <div className="grid h-full w-full place-items-center rounded-md bg-parchment text-center text-xs text-ink/55">
                    {tokenErr ? v.loadError : isRedeemed ? v.scanHintRedeemed : statusChip.label}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secure badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-parchment px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink/65">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            {v.secureBadge}
            {isValid && <span className="ml-1 text-ink/40">· {v.rotating}</span>}
          </div>
        </div>

        {/* Human code */}
        <div className="mt-5 text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55">
            {v.codeHint}
          </div>
          <button
            onClick={copyCode}
            className="btn-press mt-1 inline-flex items-center gap-2 rounded-lg bg-parchment px-3 py-1.5 font-mono-num text-base tracking-[0.08em] text-ink hover:bg-[color-mix(in_oklab,var(--ink)_5%,var(--parchment))]"
            title={v.copyCode}
          >
            {voucher.code}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="8"
                y="8"
                width="12"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        {/* Value + meta */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-parchment px-3 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink/55">
              {v.valueLabel}
            </div>
            <div className="mt-0.5 font-mono-num text-lg">{formatLek(voucher.value_l)}</div>
          </div>
          <div className="rounded-2xl bg-parchment px-3 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-copper-dark">
              {v.taxFreeLabel}
            </div>
            <div className="mt-0.5 font-mono-num text-lg text-copper-dark">
              +{formatLek(tax.difference)}
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-xs text-ink/60">
          {isRedeemed && redeemedDate
            ? v.redeemedOn.replace("{date}", redeemedDate)
            : v.expiresOn.replace("{date}", expiryDate)}
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink/55">
          {isRedeemed ? v.scanHintRedeemed : isValid ? v.scanHint : statusChip.label}
        </p>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="btn-press w-full rounded-full border border-[var(--hairline)] bg-paper px-4 py-2.5 text-sm font-medium text-ink/75 hover:text-ink"
          >
            {v.close}
          </button>
        </div>
      </section>
    </article>
  );
}
