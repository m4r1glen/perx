// PERX AI Benefits Concierge — powered by Google Gemini.
// GEMINI_API_KEY is a Supabase secret; it never leaves the server.
// Swap models here in one place:
const GEMINI_MODEL = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Offer = {
  id: string;
  title_sq: string;
  title_en: string;
  price_l: number;
  category: string;
  mood: string[] | null;
};

type PriorPick = { offer_id: string; reason: string };
type HistoryTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; intro: string; picks: PriorPick[] };

type Payload = {
  message: string;
  locale: "sq" | "en";
  profile: {
    full_name?: string | null;
    job_title?: string | null;
    department?: string | null;
    interests?: string[] | null;
  };
  balance: number;
  spendByCategory: Record<string, number>;
  recentOfferIds?: string[];
  offers: Offer[];
  history?: HistoryTurn[];
};

type UserProfileBlock = {
  name: string;
  job: string;
  department: string;
  interests: string[];
  balance_l: number;
  spending: { category: string; spent_l: number }[];
  most_used_category: string | null;
  least_touched_categories: string[];
  recent_titles: string[];
};

function buildUserProfile(p: Payload): UserProfileBlock {
  const allCats = Array.from(new Set(p.offers.map((o) => o.category)));
  const spending = Object.entries(p.spendByCategory)
    .map(([category, spent_l]) => ({ category, spent_l }))
    .sort((a, b) => b.spent_l - a.spent_l);
  const mostUsed = spending[0]?.category ?? null;
  const touched = new Set(spending.map((s) => s.category));
  const leastTouched = allCats.filter((c) => !touched.has(c)).slice(0, 5);
  const offerById = new Map(p.offers.map((o) => [o.id, o]));
  const recentTitles = (p.recentOfferIds ?? [])
    .slice(0, 3)
    .map((id) => offerById.get(id))
    .filter((o): o is Offer => !!o)
    .map((o) => (p.locale === "sq" ? o.title_sq : o.title_en));

  return {
    name: p.profile.full_name ?? "—",
    job: p.profile.job_title ?? "—",
    department: p.profile.department ?? "—",
    interests: p.profile.interests ?? [],
    balance_l: p.balance,
    spending,
    most_used_category: mostUsed,
    least_touched_categories: leastTouched,
    recent_titles: recentTitles,
  };
}

const SYSTEM_PROMPT = `You are PERX Concierge, a warm, sharp, concise benefits advisor for employees in Albania. You are given a specific employee's profile: their job, what they enjoy, how many points (Lek) they can spend, and exactly what they've spent points on before. Your job is to recommend a curated package of 2–4 complementary, REAL offers from the provided catalog that this particular person would actually be happy with — reasoning from their job, their stated interests, their past spending pattern, and their budget.

Rules:
- Personalize concretely. Reference their reality: if they're an engineer who spends heavily on wellness, lean into recovery/focus; if they picked travel interests but never redeemed travel, gently surface an affordable travel option. Make it feel like you KNOW them.
- Respect budget: the package total must fit their available points unless they explicitly ask to stretch; if over, say so and offer a within-budget alternative.
- Complementary, not redundant: bundle things that work together (e.g. gym + massage + healthy meals), don't recommend three near-identical items.
- Balance: if they always pick one category, suggest mostly that PLUS one fresh complementary nudge they're likely to enjoy — help discovery without ignoring their taste.
- Be honest and non-pushy. Short, friendly reasons. No hype, no emojis-as-filler.
- If a prior recommendation is included in the conversation, REFINE it based on the user's latest message rather than starting from scratch.
- Reply ONLY as strict JSON, no markdown, no text outside it, with this exact shape:
{ "intro": "one warm sentence, in the user's language", "package": [ { "offer_id": "...", "reason": "one concrete personalized sentence" } ], "total_l": <sum>, "within_budget": <true|false>, "note": "optional one-line note, e.g. a stretch suggestion or savings hint" }
- Respond in the user's current language (sq or en) for all human-readable text. Use only offer_ids present in the supplied catalog.`;

function buildContextMessage(p: Payload, userProfile: UserProfileBlock): string {
  const lang = p.locale === "sq" ? "Albanian (Shqip)" : "English";
  const catalog = p.offers.slice(0, 100).map((o) => ({
    id: o.id,
    title: p.locale === "sq" ? o.title_sq : o.title_en,
    price_l: o.price_l,
    category: o.category,
    mood: o.mood ?? [],
    within_budget: o.price_l <= p.balance,
  }));
  return `LANGUAGE: ${lang}

USER_PROFILE:
${JSON.stringify(userProfile, null, 2)}

CATALOG (only recommend offer_ids from this list):
${JSON.stringify(catalog)}`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object found");
  return JSON.parse(body.slice(start, end + 1));
}

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

function historyToContents(history: HistoryTurn[] | undefined): GeminiContent[] {
  if (!history?.length) return [];
  return history.map((h) =>
    h.role === "user"
      ? { role: "user", parts: [{ text: h.text }] }
      : {
          role: "model",
          parts: [
            {
              text: JSON.stringify({
                intro: h.intro,
                package: h.picks,
              }),
            },
          ],
        },
  );
}

function localFallback(p: Payload): {
  intro: string;
  picks: { offer_id: string; reason: string }[];
} {
  const moods: string[] = [];
  const m = p.message.toLowerCase();
  const MOOD_WORDS: Record<string, string[]> = {
    relax: ["relax", "relaks", "qetë", "qetesi", "qetësi", "spa", "calm"],
    energy: ["energy", "energji", "gym", "fitness", "sport", "vrap"],
    adventure: ["adventure", "aventure", "aventurë", "travel", "udhetim", "udhëtim"],
    focus: ["focus", "fokus", "work", "punë", "produktivitet", "kafe"],
  };
  for (const [k, ws] of Object.entries(MOOD_WORDS)) {
    if (ws.some((w) => m.includes(w))) moods.push(k);
  }
  const budgetMatch = m.replace(/[.,](?=\d{3}\b)/g, "").match(/(\d{3,7})/);
  const budget = Math.min(
    budgetMatch ? parseInt(budgetMatch[1], 10) : p.balance,
    p.balance || Infinity,
  );
  const matchMood = (o: Offer) =>
    moods.length === 0 || (o.mood ?? []).some((mm) => moods.includes(mm));
  const ranked = [...p.offers]
    .filter((o) => o.price_l <= budget)
    .sort((a, b) => {
      const am = matchMood(a) ? 0 : 1;
      const bm = matchMood(b) ? 0 : 1;
      if (am !== bm) return am - bm;
      return a.price_l - b.price_l;
    });
  const picks: Offer[] = [];
  const seenCats = new Set<string>();
  let total = 0;
  for (const o of ranked) {
    if (picks.length >= 4) break;
    if (total + o.price_l > budget) continue;
    if (seenCats.has(o.category) && picks.length >= 2) continue;
    picks.push(o);
    seenCats.add(o.category);
    total += o.price_l;
  }
  const intro =
    p.locale === "sq"
      ? "Ja një paketë e zgjedhur posaçërisht për ty:"
      : "Here's a bundle picked for you:";
  return {
    intro,
    picks: picks.map((o) => ({
      offer_id: o.id,
      reason:
        p.locale === "sq"
          ? matchMood(o)
            ? `Përputhet me humorin që kërkove.`
            : `Brenda buxhetit dhe i pëlqyer nga kolegët.`
          : matchMood(o)
            ? `Matches the mood you asked for.`
            : `Within your budget and a peer favorite.`,
    })),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: "bad_request" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const offerById = new Map(payload.offers.map((o) => [o.id, o]));
  const userProfile = buildUserProfile(payload);
  console.log("concierge_profile", {
    job: userProfile.job,
    department: userProfile.department,
    interests_n: userProfile.interests.length,
    balance_l: userProfile.balance_l,
    most_used: userProfile.most_used_category,
    least_touched: userProfile.least_touched_categories,
    recent: userProfile.recent_titles,
    catalog_n: payload.offers.length,
    history_n: payload.history?.length ?? 0,
  });

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  let source: "ai" | "fallback" = "fallback";
  let intro = "";
  let picks: { offer_id: string; reason: string }[] = [];
  let note: string | undefined;
  let within_budget: boolean | undefined;

  if (apiKey) {
    try {
      const contextMsg = buildContextMessage(payload, userProfile);
      const contents: GeminiContent[] = [
        { role: "user", parts: [{ text: contextMsg }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will recommend only from the catalog and reply as strict JSON.",
            },
          ],
        },
        ...historyToContents(payload.history),
        { role: "user", parts: [{ text: payload.message }] },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        console.error("gemini_http", res.status, await res.text().catch(() => ""));
        throw new Error("gemini_http_" + res.status);
      }
      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";
      const parsed = extractJson(text) as {
        intro?: string;
        package?: { offer_id: string; reason: string }[];
        note?: string;
        within_budget?: boolean;
      };
      const validPicks = (parsed.package ?? [])
        .filter((p) => p && typeof p.offer_id === "string" && offerById.has(p.offer_id))
        .slice(0, 4);
      if (validPicks.length >= 2) {
        intro = typeof parsed.intro === "string" ? parsed.intro : "";
        picks = validPicks;
        note = typeof parsed.note === "string" ? parsed.note : undefined;
        within_budget =
          typeof parsed.within_budget === "boolean" ? parsed.within_budget : undefined;
        source = "ai";
      } else {
        console.warn("concierge_invalid_ai_picks", { got: parsed.package?.length ?? 0 });
      }
    } catch (e) {
      console.error("concierge_ai_error", String(e));
    }
  } else {
    console.warn("concierge_missing_key");
  }

  if (source === "fallback") {
    const fb = localFallback(payload);
    intro = fb.intro;
    picks = fb.picks;
  }

  const total_l = picks.reduce((s, p) => {
    const o = offerById.get(p.offer_id);
    return s + (o?.price_l ?? 0);
  }, 0);
  if (within_budget === undefined) within_budget = total_l <= payload.balance;

  console.log("concierge_result", { source, picks: picks.length, total_l, within_budget });

  return new Response(JSON.stringify({ intro, picks, total_l, within_budget, note, source }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
