import { useLocale } from "@/lib/locale-context";
import { formatLek } from "@/lib/use-marketplace";

export type ReceiptData = {
  receiptNumber: string;
  employeeName: string;
  providerName: string;
  offerTitleSq?: string;
  offerTitleEn?: string;
  valueL: number;
  redeemedAt: string; // ISO
  code: string;
};

export function VoucherReceipt({ data }: { data: ReceiptData }) {
  const { t, locale } = useLocale();
  const r = t.dashboard.provider.scan.receipt;
  const dt = new Date(data.redeemedAt);
  const dateStr = dt.toLocaleString(locale === "sq" ? "sq-AL" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const offerTitle =
    (locale === "sq" ? data.offerTitleSq : data.offerTitleEn) ??
    data.offerTitleSq ??
    data.offerTitleEn ??
    "—";

  // tax-free portion: we treat the full value as tax-free benefit (illustrative)
  const taxFree = data.valueL;

  return (
    <div className="receipt-root mx-auto w-full max-w-[560px] bg-paper text-ink">
      <div className="hairline rounded-2xl p-8 print:border-0 print:rounded-none print:p-10">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl font-medium tracking-tight">PERX</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/55">{r.kicker}</div>
        </div>

        <h2 className="mt-6 font-display text-3xl font-medium leading-tight">{r.title}</h2>
        <div className="mt-1 font-mono-num text-xs text-ink/55">#{data.receiptNumber}</div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label={r.employee} value={data.employeeName} />
          <Field label={r.provider} value={data.providerName} />
          <Field label={r.offer} value={offerTitle} className="sm:col-span-2" />
          <Field label={r.code} value={data.code} mono />
          <Field label={r.confirmedAt} value={dateStr} />
        </div>

        <div className="mt-7 hairline rounded-xl bg-parchment p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-[0.14em] text-ink/55">{r.value}</div>
            <div className="font-mono-num text-3xl text-ink">{formatLek(data.valueL)}</div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-[0.14em] text-copper-dark">{r.taxFree}</div>
            <div className="font-mono-num text-lg text-copper-dark">{formatLek(taxFree)}</div>
          </div>
        </div>

        <p className="mt-6 text-sm text-ink/70">{r.paidLine}</p>

        <div className="mt-8 flex items-center justify-between border-t border-[var(--hairline)] pt-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/55">{r.stamp}</div>
          <div className="font-mono-num text-xs text-ink/55">{dateStr}</div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-ink/55">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono-num" : ""} text-sm text-ink`}>{value}</div>
    </div>
  );
}
