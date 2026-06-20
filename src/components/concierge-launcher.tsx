import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { ConciergePanel } from "@/components/concierge-panel";
import type { Offer, Selection } from "@/lib/use-marketplace";
import type { Profile } from "@/lib/use-profile";

type Props = {
  offers: Offer[];
  profile: Profile | null | undefined;
  balance: number;
  selections: Selection[];
  locale: "sq" | "en";
  onAddBundle: (items: Offer[]) => void;
  onOpenDetails?: (offers: Offer[], bundleTitle?: { sq: string; en: string }) => void;
};

export function ConciergeLauncher(props: Props) {
  const [open, setOpen] = useState(false);
  const label = props.locale === "sq" ? "Pyet asistentin" : "Ask the concierge";
  const closeLabel = props.locale === "sq" ? "Mbyll" : "Close";

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Floating launcher — bottom-right, above the demo switcher pill */}
      <div
        className={`fixed bottom-20 right-4 z-[55] transition-opacity duration-200 sm:bottom-24 sm:right-6 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="group relative">
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-parchment opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
          >
            {label}
          </span>

          <span
            aria-hidden
            className="concierge-fab-halo pointer-events-none absolute inset-0 rounded-full"
          />

          <button
            type="button"
            aria-label={label}
            onClick={() => setOpen(true)}
            className="concierge-fab-btn btn-press relative grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--brand)_70%,transparent)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_color-mix(in_oklab,var(--brand)_80%,transparent)] sm:h-[60px] sm:w-[60px]"
          >
            <Sparkles className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {open && (
        <>
          {/* Mobile backdrop (sm:hidden) */}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="concierge-backdrop fixed inset-0 z-[65] bg-ink/50 backdrop-blur-sm sm:hidden"
          />

          {/* Desktop click-catcher (transparent, so backdrop tap closes) */}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            tabIndex={-1}
            className="fixed inset-0 z-[65] hidden cursor-default sm:block"
          />

          {/* Panel: bottom sheet on mobile, anchored popover on desktop */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Benefits Concierge"
            className="concierge-sheet fixed inset-x-0 bottom-0 z-[70] flex max-h-[88vh] flex-col sm:hidden"
          >
            <PanelInner onClose={() => setOpen(false)} closeLabel={closeLabel} {...props} />
          </div>

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Benefits Concierge"
            className="concierge-pop fixed z-[70] hidden origin-bottom-right sm:bottom-24 sm:right-6 sm:flex sm:h-[640px] sm:max-h-[calc(100vh-8rem)] sm:w-[400px] sm:flex-col"
          >
            <PanelInner onClose={() => setOpen(false)} closeLabel={closeLabel} {...props} />
          </div>
        </>
      )}
    </>
  );
}

function PanelInner({
  onClose,
  closeLabel,
  ...props
}: Props & { onClose: () => void; closeLabel: string }) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-2xl">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="btn-press absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-parchment/10 text-parchment backdrop-blur-md hover:bg-parchment/20"
      >
        <X className="h-4 w-4" />
      </button>
      <ConciergePanel {...props} compact />
    </div>
  );
}
