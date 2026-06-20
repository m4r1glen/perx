import type { Offer } from "@/lib/use-marketplace";

const MOOD_WORDS: Record<string, string[]> = {
  relax: ["relax", "relaks", "qetë", "qetesi", "qetësi", "spa", "calm", "rileks"],
  energy: ["energy", "energji", "gym", "fitness", "run", "vrap", "stërvitje", "sport"],
  adventure: [
    "adventure",
    "aventure",
    "aventurë",
    "travel",
    "udhetim",
    "udhëtim",
    "trip",
    "shtegtim",
  ],
  focus: ["focus", "fokus", "work", "punë", "produktivitet", "concentration", "kafe"],
};

function detectMoods(msg: string): string[] {
  const m = msg.toLowerCase();
  const out: string[] = [];
  for (const [mood, words] of Object.entries(MOOD_WORDS)) {
    if (words.some((w) => m.includes(w))) out.push(mood);
  }
  return out;
}

function detectBudget(msg: string): number | null {
  // Match "8000", "8.000", "8,000", optionally followed by "L" / "Lek" / "Lekë"
  const m = msg.replace(/[.,](?=\d{3}\b)/g, "").match(/(\d{3,7})\s*(l|lek|lekë|leke)?/i);
  return m ? parseInt(m[1], 10) : null;
}

export type FallbackPick = { offer_id: string; reason: string };
export type FallbackResult = { intro: string; picks: FallbackPick[] };

export function localRecommend(
  message: string,
  offers: Offer[],
  balance: number,
  locale: "sq" | "en",
): FallbackResult {
  const moods = detectMoods(message);
  const budget = Math.min(detectBudget(message) ?? balance, balance || Infinity);

  const matchesMood = (o: Offer) =>
    moods.length === 0 || (o.mood ?? []).some((m) => moods.includes(m));

  // Rank: mood-match first, then by price ascending (more variety per budget)
  const ranked = [...offers]
    .filter((o) => o.price_l <= budget)
    .sort((a, b) => {
      const am = matchesMood(a) ? 0 : 1;
      const bm = matchesMood(b) ? 0 : 1;
      if (am !== bm) return am - bm;
      return a.price_l - b.price_l;
    });

  const picks: Offer[] = [];
  const seenCats = new Set<string>();
  let total = 0;
  for (const o of ranked) {
    if (picks.length >= 4) break;
    if (total + o.price_l > budget) continue;
    // Prefer category diversity
    if (seenCats.has(o.category) && picks.length >= 2) continue;
    picks.push(o);
    seenCats.add(o.category);
    total += o.price_l;
  }
  // Ensure at least 2 if catalog allows
  if (picks.length < 2) {
    for (const o of ranked) {
      if (picks.length >= 2) break;
      if (picks.includes(o)) continue;
      if (total + o.price_l > budget) continue;
      picks.push(o);
      total += o.price_l;
    }
  }

  const budgetStr = Math.round(budget)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const intro =
    locale === "sq"
      ? moods.length
        ? `Një paketë ${moods.join(" + ")} brenda ${budgetStr} L:`
        : "Ja një paketë e zgjedhur posaçërisht për ty:"
      : moods.length
        ? `A ${moods.join(" + ")} bundle within ${budgetStr} L:`
        : "Here's a bundle picked for you:";

  const reasonFor = (o: Offer): string => {
    if (locale === "sq") {
      if (matchesMood(o)) return `Përputhet me humorin ${(o.mood ?? []).join(", ")}.`;
      return `Brenda buxhetit dhe i kërkuar nga kolegët.`;
    }
    if (matchesMood(o)) return `Matches your ${(o.mood ?? []).join(", ")} mood.`;
    return `Within budget and popular with peers.`;
  };

  return {
    intro,
    picks: picks.map((o) => ({ offer_id: o.id, reason: reasonFor(o) })),
  };
}
