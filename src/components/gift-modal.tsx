import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Gift } from "lucide-react";
import confetti from "canvas-confetti";
import { useLocale } from "@/lib/locale-context";
import { formatLek, formatNumber, type Offer } from "@/lib/use-marketplace";
import { useColleagues, useSendGift, displayName, initials, type Colleague } from "@/lib/use-gifts";

type Mode = "points" | "package";

export function GiftModal({
  open,
  onClose,
  myId,
  balance,
  offers,
  initialMode = "points",
  initialOfferIds,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  myId: string | undefined;
  balance: number;
  offers: Offer[];
  initialMode?: Mode;
  initialOfferIds?: string[];
  locale: "sq" | "en";
}) {
  const { t } = useLocale();
  const g = t.dashboard.employee.gifts;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [recipient, setRecipient] = useState<Colleague | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>(initialOfferIds ?? []);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const colleaguesQ = useColleagues(myId);
  const sendMut = useSendGift();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSelectedOfferIds(initialOfferIds ?? []);
      setAmount("");
      setMessage("");
      setRecipient(null);
      setSearch("");
    }
  }, [open, initialMode, initialOfferIds]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const colleagues = colleaguesQ.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colleagues;
    return colleagues.filter((c) => {
      const n = displayName(c).toLowerCase();
      const j = (c.job_title ?? "").toLowerCase();
      return n.includes(q) || j.includes(q);
    });
  }, [colleagues, search]);

  const numericAmount = Number(amount.replace(/\D/g, "")) || 0;
  const packageTotal = useMemo(
    () => offers.filter((o) => selectedOfferIds.includes(o.id)).reduce((s, o) => s + o.price_l, 0),
    [offers, selectedOfferIds],
  );
  const totalCost = mode === "points" ? numericAmount : packageTotal;
  const overBalance = totalCost > balance;
  const canSend =
    !!recipient &&
    !sendMut.isPending &&
    totalCost > 0 &&
    !overBalance &&
    (mode === "points" || selectedOfferIds.length > 0);

  async function handleSend() {
    if (!recipient) return;
    try {
      await sendMut.mutateAsync({
        recipientId: recipient.id,
        type: mode,
        points: mode === "points" ? numericAmount : undefined,
        offerIds: mode === "package" ? selectedOfferIds : undefined,
        message: message.trim(),
      });
      burstCoins();
      const name = displayName(recipient);
      const msg =
        mode === "points"
          ? g.successPoints.replace("{n}", formatNumber(numericAmount)).replace("{name}", name)
          : g.successPackage.replace("{name}", name);
      toast.success(msg);
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/45 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="paper-card relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl animate-scale-in sm:rounded-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink/55 hover:bg-parchment hover:text-ink"
        >
          <X className="size-4" />
        </button>

        <header className="mb-4">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-brand">
            <Gift className="size-3.5" aria-hidden /> {g.cta}
          </div>
          <h2 className="mt-1 font-display text-3xl font-medium tracking-tight">{g.title}</h2>
          <p className="mt-1 text-sm text-ink/65">{g.subtitle}</p>
        </header>

        {/* Mode tabs */}
        <div className="inline-flex rounded-full border border-[var(--hairline)] bg-parchment p-1 text-sm font-medium">
          {(["points", "package"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`btn-press rounded-full px-4 py-1.5 transition ${
                mode === m ? "bg-ink text-parchment" : "text-ink/65 hover:text-ink"
              }`}
            >
              {m === "points" ? g.tabPoints : g.tabPackage}
            </button>
          ))}
        </div>

        {/* Colleague picker */}
        <section className="mt-5">
          <label className="text-xs font-medium uppercase tracking-wider text-ink/55">
            {g.pickColleague}
          </label>
          {recipient ? (
            <div className="mt-2 flex items-center justify-between rounded-2xl border border-copper/40 bg-copper-light/40 p-3">
              <div className="flex items-center gap-3">
                <Avatar c={recipient} />
                <div>
                  <div className="font-medium">{displayName(recipient)}</div>
                  <div className="text-xs text-ink/60">
                    {recipient.job_title ?? recipient.department ?? ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setRecipient(null)}
                className="text-xs font-medium text-ink/65 hover:text-ink underline"
              >
                {g.cancel}
              </button>
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={g.searchColleague}
                className="mt-2 w-full rounded-full border border-[var(--hairline)] bg-parchment px-4 py-2 text-sm outline-none focus:border-ink/50"
              />
              <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-parchment">
                {filtered.length === 0 ? (
                  <div className="p-4 text-sm text-ink/55">{g.noColleagues}</div>
                ) : (
                  <ul className="divide-y divide-[var(--hairline)]">
                    {filtered.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setRecipient(c)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-paper"
                        >
                          <Avatar c={c} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{displayName(c)}</div>
                            <div className="truncate text-xs text-ink/55">
                              {c.job_title ?? c.department ?? ""}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>

        {/* Body */}
        {mode === "points" ? (
          <section className="mt-5 space-y-2">
            <div className="flex items-end justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/55">
                {g.amount}
              </label>
              <span className="text-xs text-ink/55">
                {g.balanceLabel}:{" "}
                <span className="font-mono-num text-ink">{formatLek(balance)}</span>
              </span>
            </div>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={g.amountPlaceholder}
              className={`w-full rounded-2xl border bg-parchment px-4 py-3 font-mono-num text-2xl outline-none ${
                overBalance ? "border-red-500" : "border-[var(--hairline)] focus:border-ink/50"
              }`}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-ink/55">
                {g.quickAmounts}
              </span>
              {[500, 1000, 2000, 5000].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  disabled={q > balance}
                  className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-3 py-1 font-mono-num text-xs disabled:opacity-40"
                >
                  {formatLek(q)}
                </button>
              ))}
            </div>
            {overBalance && <p className="text-xs font-medium text-red-600">{g.insufficient}</p>}
          </section>
        ) : (
          <section className="mt-5">
            <div className="flex items-end justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-ink/55">
                {g.pickPackage}
              </label>
              <span className="text-xs text-ink/55">
                {g.balanceLabel}:{" "}
                <span className="font-mono-num text-ink">{formatLek(balance)}</span>
              </span>
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-parchment p-2">
              {offers.length === 0 ? (
                <div className="p-3 text-sm text-ink/55">{g.noPackages}</div>
              ) : (
                <ul className="space-y-1">
                  {offers.map((o) => {
                    const checked = selectedOfferIds.includes(o.id);
                    return (
                      <li key={o.id}>
                        <button
                          onClick={() =>
                            setSelectedOfferIds((curr) =>
                              curr.includes(o.id)
                                ? curr.filter((x) => x !== o.id)
                                : [...curr, o.id],
                            )
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                            checked ? "bg-copper-light/60" : "hover:bg-paper"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {locale === "sq" ? o.title_sq : o.title_en}
                            </div>
                            <div className="truncate text-[11px] uppercase tracking-wider text-ink/55">
                              {o.category}
                            </div>
                          </div>
                          <span className="font-mono-num text-sm">{formatLek(o.price_l)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-parchment px-3 py-2 text-sm">
              <span className="text-ink/70">{g.packageTotal}</span>
              <span
                className={`font-mono-num text-lg ${overBalance ? "text-red-600" : "text-ink"}`}
              >
                {formatLek(packageTotal)}
              </span>
            </div>
            {overBalance && (
              <p className="mt-2 text-xs font-medium text-red-600">{g.insufficient}</p>
            )}
          </section>
        )}

        {/* Message */}
        <section className="mt-5">
          <label className="text-xs font-medium uppercase tracking-wider text-ink/55">
            {g.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder={g.messagePlaceholder}
            rows={2}
            className="mt-2 w-full resize-none rounded-2xl border border-[var(--hairline)] bg-parchment px-4 py-3 text-sm outline-none focus:border-ink/50"
          />
        </section>

        {/* Footer */}
        <footer className="sticky bottom-0 mt-6 flex items-center justify-end gap-2 bg-paper/95 pt-3 backdrop-blur">
          <button
            onClick={onClose}
            className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-sm font-medium text-ink/75 hover:text-ink"
          >
            {g.cancel}
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-parchment shadow-sm transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendMut.isPending ? g.sending : g.send}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Avatar({ c }: { c: Colleague }) {
  return (
    <div
      className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-copper to-copper-dark font-display text-sm font-medium text-parchment shadow-sm"
      aria-hidden
    >
      {initials(c)}
    </div>
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function burstCoins() {
  if (prefersReducedMotion()) return;
  const defaults = {
    spread: 70,
    ticks: 90,
    gravity: 1.1,
    decay: 0.92,
    startVelocity: 35,
    colors: ["#FF7A33", "#E0A458", "#C75C3D", "#F5E6C8"],
    shapes: ["circle"] as ("circle" | "square")[],
    scalar: 1.1,
  };
  confetti({ ...defaults, particleCount: 60, origin: { x: 0.5, y: 0.7 } });
  setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.2, y: 0.8 } }), 120);
  setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.8, y: 0.8 } }), 220);
}
