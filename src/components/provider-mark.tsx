import { useState } from "react";

type Size = "xs" | "sm" | "md";

const SIZE_CLASS: Record<Size, string> = {
  xs: "size-6 rounded-md text-[10px]",
  sm: "size-7 rounded-lg text-[11px]",
  md: "size-8 rounded-lg text-xs",
};

const IMG_PAD: Record<Size, string> = {
  xs: "p-[2px]",
  sm: "p-[3px]",
  md: "p-[3px]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Small, consistent provider identity mark.
 * - Rounded-square container with hairline border + neutral background.
 * - Shows logo (object-contain, padded, lazy-loaded) when available.
 * - Falls back to a tinted monogram on image error or missing logo.
 */
export function ProviderMark({
  name,
  logoUrl,
  brandColor,
  size = "sm",
  className = "",
}: {
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  size?: Size;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = !!logoUrl && !failed;
  const color = brandColor || "#FF7A33";
  const base =
    "inline-grid shrink-0 place-items-center overflow-hidden border border-[var(--hairline)] bg-white";
  return (
    <span
      aria-hidden
      title={name}
      className={`${base} ${SIZE_CLASS[size]} ${className}`}
      style={
        showImg
          ? undefined
          : {
              background: `color-mix(in oklab, ${color} 14%, var(--paper))`,
              color: `color-mix(in oklab, ${color} 75%, #1a140e)`,
            }
      }
    >
      {showImg ? (
        <img
          src={logoUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-full w-full object-contain ${IMG_PAD[size]}`}
        />
      ) : (
        <span className="font-semibold leading-none tracking-tight">{initials(name)}</span>
      )}
    </span>
  );
}
