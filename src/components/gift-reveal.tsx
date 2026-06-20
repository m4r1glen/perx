import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Gift } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { Offer } from "@/lib/use-marketplace";
import { formatLek } from "@/lib/use-marketplace";
import {
  useMyTransfers,
  useClaimGift,
  displayName,
  initials,
  type TransferWithPeople,
} from "@/lib/use-gifts";

export function GiftReveal({
  myId,
  offerById,
  locale,
}: {
  myId: string | undefined;
  offerById: Map<string, Offer>;
  locale: "sq" | "en";
}) {
  const { t } = useLocale();
  const g = t.dashboard.employee.gifts;
  const transfersQ = useMyTransfers(myId);
  const claim = useClaimGift();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const reveal: TransferWithPeople | undefined = useMemo(() => {
    return (transfersQ.data ?? []).find(
      (tr) => tr.recipient_id === myId && tr.status === "sent" && !dismissed.has(tr.id),
    );
  }, [transfersQ.data, myId, dismissed]);

  useEffect(() => {
    if (!reveal) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 90,
        startVelocity: 40,
        gravity: 1.1,
        colors: ["#0E7C66", "#16A34A", "#D5EDE6", "#16171D"],
        origin: { x: 0.5, y: 0.5 },
      });
    }, 150);
    return () => clearTimeout(id);
  }, [reveal?.id]);

  if (!reveal) return null;

  const senderName = displayName(reveal.sender);
  const detail =
    reveal.type === "points"
      ? `${formatLek(reveal.points_amount)} pts`
      : reveal.offer_ids
          .map((id) => {
            const o = offerById.get(id);
            return o ? (locale === "sq" ? o.title_sq : o.title_en) : null;
          })
          .filter(Boolean)
          .join(" · ");

  async function handleClaim() {
    try {
      await claim.mutateAsync(reveal!.id);
      setDismissed((s) => new Set(s).add(reveal!.id));
    } catch {
      setDismissed((s) => new Set(s).add(reveal!.id));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setDismissed((s) => new Set(s).add(reveal.id));
      }}
    >
      <div className="paper-card relative w-full max-w-md overflow-hidden rounded-3xl bg-paper p-8 text-center shadow-2xl animate-scale-in">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-light/70 via-transparent to-brand-soft" />
        <div className="relative">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-brand-foreground shadow-lg">
            <Gift className="size-9" aria-hidden />
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.2em] text-brand">
            {g.revealKicker}
          </div>
          <h3 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight">
            {g.revealTitle.replace("{name}", senderName)}
          </h3>

          <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-parchment p-3">
            {reveal.sender && (
              <div className="grid size-9 place-items-center rounded-full bg-ink font-display text-xs font-medium text-parchment">
                {initials(reveal.sender)}
              </div>
            )}
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider text-ink/55">{g.from}</div>
              <div className="text-sm font-medium">{senderName}</div>
            </div>
          </div>

          <p className="mt-4 font-mono-num text-lg text-ink">{detail || "—"}</p>

          {reveal.gift_message && (
            <p className="mt-3 rounded-xl bg-brand-light/60 px-4 py-3 text-sm italic text-ink/80">
              “{reveal.gift_message}”
            </p>
          )}

          <button
            onClick={handleClaim}
            disabled={claim.isPending}
            className="btn-press mt-6 w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-parchment shadow-sm hover:bg-ink/90 disabled:opacity-60"
          >
            {claim.isPending ? "…" : g.revealClaim}
          </button>
        </div>
      </div>
    </div>
  );
}
