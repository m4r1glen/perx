import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/use-profile";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00").getTime();
  const b = new Date(bISO + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Bumps the user's streak when the feed opens.
 * - same day: no change
 * - 1 day later: +1
 * - older or null: reset to 1
 * Calls onIncrease(newCount, prevCount) only when streak grew.
 */
export function useStreakOnOpen(
  profile: Profile | null | undefined,
  onIncrease: (next: number, prev: number) => void,
) {
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!profile || ran.current) return;
    ran.current = true;

    const today = todayISO();
    const prev = profile.streak_count ?? 0;
    const last = profile.last_active_date;
    let next = prev;
    if (!last) next = 1;
    else {
      const diff = daysBetween(last, today);
      if (diff === 0) return; // already counted today
      if (diff === 1) next = prev + 1;
      else next = 1;
    }

    (async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ streak_count: next, last_active_date: today })
        .eq("id", profile.id);
      if (error) return;
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (next > prev) onIncrease(next, prev);
    })();
  }, [profile, qc, onIncrease]);
}
