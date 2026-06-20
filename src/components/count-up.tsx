import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/use-marketplace";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function CountUp({
  value,
  duration = 500,
  className,
  format = formatNumber,
  pulseOnChange = false,
}: {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
  pulseOnChange?: boolean;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (display === value) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const to = value;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    if (pulseOnChange && pulseRef.current) {
      pulseRef.current.classList.remove("points-pulse");
      // reflow to restart animation
      void pulseRef.current.offsetWidth;
      pulseRef.current.classList.add("points-pulse");
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span ref={pulseRef} className={className} style={{ display: "inline-block" }}>
      {format(display)}
    </span>
  );
}
