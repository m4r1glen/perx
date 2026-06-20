import { useCallback, useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { formatLek } from "@/lib/use-marketplace";
import { verifyVoucher, type VerifyResult } from "@/lib/use-vouchers";
import { VoucherReceipt, type ReceiptData } from "@/components/voucher-receipt";
import { downloadReceiptPdf } from "@/lib/receipt-pdf";

type Props = {
  open: boolean;
  onClose: () => void;
  providerName: string;
  onRedeemed?: () => void;
};

type Phase =
  | { kind: "scanning" }
  | { kind: "verifying" }
  | { kind: "result"; result: VerifyResult }
  | { kind: "receipt"; data: ReceiptData };

export function ProviderScanModal({ open, onClose, providerName, onRedeemed }: Props) {
  const { t, locale } = useLocale();
  const s = t.dashboard.provider.scan;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanAtRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>({ kind: "scanning" });
  const [manualCode, setManualCode] = useState("");
  const [camError, setCamError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setPhase({ kind: "scanning" });
    setManualCode("");
    lastScanRef.current = "";
  }, []);

  const handleVerify = useCallback(
    async (input: { token?: string; code?: string }) => {
      setPhase({ kind: "verifying" });
      const result = await verifyVoucher(input);
      setPhase({ kind: "result", result });
      if (result.ok) onRedeemed?.();
    },
    [onRedeemed],
  );

  // Camera scanner lifecycle
  useEffect(() => {
    if (!open || phase.kind !== "scanning" || !videoRef.current) return;
    let cancelled = false;
    setCamError(null);

    const video = videoRef.current;
    const scanner = new QrScanner(
      video,
      (res) => {
        const text = res.data;
        const now = Date.now();
        if (text === lastScanRef.current && now - lastScanAtRef.current < 1500) return;
        lastScanRef.current = text;
        lastScanAtRef.current = now;
        // Token format: payloadB64.sig (no spaces). Plain code: starts with PERX-
        if (text.includes(".") && !text.startsWith("PERX-")) {
          void handleVerify({ token: text });
        } else if (text.toUpperCase().startsWith("PERX-")) {
          void handleVerify({ code: text.toUpperCase() });
        } else {
          void handleVerify({ token: text });
        }
      },
      {
        highlightScanRegion: false,
        highlightCodeOutline: false,
        preferredCamera: "environment",
        maxScansPerSecond: 4,
      },
    );
    scannerRef.current = scanner;

    scanner.start().catch((err: unknown) => {
      if (cancelled) return;
      console.warn("[scan] camera unavailable", err);
      setCamError(s.cameraDenied);
    });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [open, phase.kind, handleVerify, s.cameraDenied]);

  // Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 backdrop-blur-sm sm:items-center print:static print:bg-paper"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] max-h-[100dvh] overflow-y-auto rounded-t-3xl bg-paper sm:rounded-3xl print:max-w-none print:max-h-none print:rounded-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4 print:hidden">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-copper-dark">
              {s.kicker}
            </div>
            <h2 className="font-display text-xl font-medium tracking-tight">{s.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={s.close}
            className="btn-press grid size-9 place-items-center rounded-full border border-[var(--hairline)] bg-parchment text-ink/70 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </header>

        {phase.kind === "scanning" ? (
          <div className="p-6 print:hidden">
            <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-3xl bg-ink">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                playsInline
              />
              <Reticle />
              {camError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/85 p-6 text-center text-sm text-parchment/90">
                  {camError}
                </div>
              ) : null}
            </div>
            <p className="mt-4 text-center text-sm text-ink/65">{s.aim}</p>

            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55">
                {s.manualLabel}
              </div>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const c = manualCode.trim().toUpperCase();
                  if (c.length < 6) return;
                  void handleVerify({ code: c });
                }}
              >
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="PERX-XXXX-XXXX"
                  className="hairline w-full rounded-lg bg-parchment px-3 py-2 font-mono-num text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-copper/40"
                />
                <button
                  type="submit"
                  className="btn-press rounded-full bg-ink px-4 py-2 text-sm font-medium text-parchment hover:opacity-90"
                >
                  {s.verify}
                </button>
              </form>
            </div>
          </div>
        ) : phase.kind === "verifying" ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-copper" />
            <div className="text-sm text-ink/65">{s.verifying}</div>
          </div>
        ) : phase.kind === "result" ? (
          <ResultView
            result={phase.result}
            providerName={providerName}
            onRescan={reset}
            onShowReceipt={(data) => setPhase({ kind: "receipt", data })}
          />
        ) : (
          <div className="bg-paper">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--hairline)] px-6 py-3 print:hidden">
              <button
                onClick={reset}
                className="btn-press rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1.5 text-xs text-ink/70 hover:text-ink"
              >
                ← {s.backToScan}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-3 py-1.5 text-xs font-medium text-ink/80 hover:text-ink"
                >
                  {s.print}
                </button>
                <button
                  onClick={() => {
                    setDownloading(true);
                    downloadReceiptPdf(receiptRef.current, phase.data.receiptNumber).finally(() =>
                      setDownloading(false),
                    );
                  }}
                  disabled={downloading}
                  className="btn-press rounded-full bg-copper px-4 py-1.5 text-xs font-medium text-parchment hover:bg-copper-dark disabled:opacity-60"
                >
                  {downloading ? "…" : (s.download ?? "PDF")}
                </button>
              </div>
            </div>
            <div ref={receiptRef} className="p-6 print:p-0">
              <VoucherReceipt data={phase.data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Reticle() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2">
        <Corner className="top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl" />
        <Corner className="top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl" />
        <Corner className="bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl" />
        <Corner className="bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl" />
        <div className="scan-line absolute inset-x-0 top-0 h-[2px] bg-copper shadow-[0_0_12px_var(--copper)]" />
      </div>
    </div>
  );
}
function Corner({ className }: { className: string }) {
  return <span className={`absolute h-7 w-7 border-copper ${className}`} />;
}

function ResultView({
  result,
  providerName,
  onRescan,
  onShowReceipt,
}: {
  result: VerifyResult;
  providerName: string;
  onRescan: () => void;
  onShowReceipt: (data: ReceiptData) => void;
}) {
  const { t, locale } = useLocale();
  const s = t.dashboard.provider.scan;

  if (result.ok && result.voucher) {
    const v = result.voucher;
    const title =
      (locale === "sq" ? v.offer_title_sq : v.offer_title_en) ??
      v.offer_title_sq ??
      v.offer_title_en ??
      "—";
    const redeemedAt = v.redeemed_at ?? new Date().toISOString();
    return (
      <div className="p-8">
        <div className="result-pop flex flex-col items-center text-center">
          <SuccessCheck />
          <div className="mt-4 font-display text-3xl font-medium tracking-tight text-emerald-700">
            {s.valid}
          </div>
          <div className="mt-1 text-sm text-ink/65">{s.confirmed}</div>

          <div className="mt-6 w-full hairline rounded-2xl bg-parchment p-5 text-left">
            <Row label={s.employee} value={v.employee_name ?? "—"} />
            <Row label={s.offer} value={title} />
            <Row label={s.value} value={formatLek(v.value_l)} mono />
            <Row label={s.code} value={v.code} mono />
          </div>

          <div className="mt-6 flex w-full gap-2">
            <button
              onClick={onRescan}
              className="btn-press flex-1 rounded-full border border-[var(--hairline)] bg-paper px-4 py-2.5 text-sm font-medium text-ink/80 hover:text-ink"
            >
              {s.scanAnother}
            </button>
            <button
              onClick={() =>
                onShowReceipt({
                  receiptNumber: v.code,
                  employeeName: v.employee_name ?? "—",
                  providerName,
                  offerTitleSq: v.offer_title_sq,
                  offerTitleEn: v.offer_title_en,
                  valueL: v.value_l,
                  redeemedAt,
                  code: v.code,
                })
              }
              className="btn-press flex-1 rounded-full bg-copper px-4 py-2.5 text-sm font-medium text-parchment hover:bg-copper-dark"
            >
              {s.receiptCta}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failure states
  const reason = result.reason ?? "server_error";
  const isAlready = reason === "already_redeemed";
  const tone = isAlready ? "amber" : "red";
  const headline =
    reason === "already_redeemed"
      ? s.alreadyRedeemed
      : reason === "invalid_signature" ||
          reason === "tampered" ||
          reason === "invalid_payload" ||
          reason === "invalid_token_format"
        ? s.invalid
        : reason === "expired"
          ? s.expired
          : reason === "wrong_provider"
            ? s.wrongProvider
            : reason === "not_a_provider"
              ? s.notAProvider
              : reason === "not_found"
                ? s.notFound
                : reason === "cancelled"
                  ? s.cancelled
                  : s.genericError;

  const sub =
    isAlready && result.redeemed_at
      ? s.redeemedOn.replace(
          "{date}",
          new Date(result.redeemed_at).toLocaleString(locale === "sq" ? "sq-AL" : "en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        )
      : null;

  return (
    <div className="p-8">
      <div className="result-pop flex flex-col items-center text-center">
        <FailMark tone={tone} />
        <div
          className={`mt-4 font-display text-3xl font-medium tracking-tight ${tone === "amber" ? "text-amber-700" : "text-red-700"}`}
        >
          {headline}
        </div>
        {sub ? <div className="mt-2 text-sm text-ink/70">{sub}</div> : null}
        {result.voucher ? (
          <div className="mt-6 w-full hairline rounded-2xl bg-parchment p-5 text-left">
            {result.voucher.employee_name ? (
              <Row label={s.employee} value={result.voucher.employee_name} />
            ) : null}
            <Row label={s.code} value={result.voucher.code} mono />
            <Row label={s.value} value={formatLek(result.voucher.value_l)} mono />
          </div>
        ) : null}
        <button
          onClick={onRescan}
          className="btn-press mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:opacity-90"
        >
          {s.scanAnother}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink/55">{label}</span>
      <span className={`text-sm text-ink ${mono ? "font-mono-num" : ""}`}>{value}</span>
    </div>
  );
}

function SuccessCheck() {
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
      <circle
        cx="40"
        cy="40"
        r="36"
        className="fill-emerald-50 stroke-emerald-500"
        strokeWidth="2"
      />
      <path
        d="M24 42 L36 54 L58 30"
        className="check-stroke"
        fill="none"
        stroke="#059669"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FailMark({ tone }: { tone: "red" | "amber" }) {
  const ring = tone === "amber" ? "fill-amber-50 stroke-amber-500" : "fill-red-50 stroke-red-500";
  const stroke = tone === "amber" ? "#b45309" : "#b91c1c";
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden>
      <circle cx="40" cy="40" r="36" className={ring} strokeWidth="2" />
      <path
        d="M28 28 L52 52 M52 28 L28 52"
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
