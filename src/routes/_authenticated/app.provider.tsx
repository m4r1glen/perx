import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useProfile } from "@/lib/use-profile";
import { useMyProvider, useOffers, formatLek } from "@/lib/use-marketplace";
import { useRedeemedVouchersForProvider } from "@/lib/use-vouchers";
import { AppShell, Card, Stat } from "@/components/app-shell";
import { ProviderScanModal } from "@/components/provider-scan-modal";
import { ProviderMark } from "@/components/provider-mark";

export const Route = createFileRoute("/_authenticated/app/provider")({
  head: () => ({
    meta: [
      { title: "Ofruesi · PERX" },
      { name: "description", content: "Paneli i ofruesit në PERX." },
    ],
  }),
  component: ProviderDashboard,
});

const CATEGORY_VALUES = ["fitness", "wellness", "travel", "food", "health", "learning", "telecom"];
const MOOD_VALUES = ["relax", "energy", "adventure", "focus"];

function ProviderDashboard() {
  const { t, locale } = useLocale();
  const p = t.dashboard.provider;
  const { data: profile } = useProfile();
  const ownerId = profile?.id;
  const qc = useQueryClient();

  const providerQ = useMyProvider(ownerId);
  const provider = providerQ.data;
  const offersAllQ = useOffers();

  const myOffers = useMemo(
    () => (offersAllQ.data ?? []).filter((o) => provider && o.provider_id === provider.id),
    [offersAllQ.data, provider],
  );
  const myOfferIds = useMemo(() => myOffers.map((o) => o.id), [myOffers]);

  const demandQ = useQuery({
    queryKey: ["selections", "provider", myOfferIds.join(",")],
    enabled: myOfferIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selections")
        .select("id, employee_id, offer_ids, total_l, status, created_at")
        .overlaps("offer_ids", myOfferIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Revenue this month: sum price_l of THIS provider's offers in paid selections this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenueThisMonth = useMemo(() => {
    let sum = 0;
    (demandQ.data ?? [])
      .filter((s) => s.status === "paid" && new Date(s.created_at) >= monthStart)
      .forEach((s) => {
        s.offer_ids.forEach((oid) => {
          const o = myOffers.find((x) => x.id === oid);
          if (o) sum += o.price_l;
        });
      });
    return sum;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandQ.data, myOffers]);

  const activeRedemptions = (demandQ.data ?? []).filter(
    (s) => s.status === "paid" || s.status === "approved",
  ).length;

  const pickCounts = useMemo(() => {
    const m = new Map<string, number>();
    (demandQ.data ?? []).forEach((s) =>
      s.offer_ids.forEach((id) => {
        if (myOfferIds.includes(id)) m.set(id, (m.get(id) ?? 0) + 1);
      }),
    );
    return m;
  }, [demandQ.data, myOfferIds]);

  const popular = useMemo(
    () =>
      [...myOffers]
        .map((o) => ({ o, n: pickCounts.get(o.id) ?? 0 }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 5),
    [myOffers, pickCounts],
  );

  const [showNew, setShowNew] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const redeemedQ = useRedeemedVouchersForProvider(provider?.id);

  return (
    <AppShell
      kicker={t.pages.provider.kicker}
      title={provider?.business_name ?? t.pages.provider.title}
      headerMark={
        provider ? (
          <ProviderMark
            name={provider.business_name}
            logoUrl={provider.logo_url}
            brandColor={provider.brand_color}
            size="md"
            className="!size-11 !rounded-xl"
          />
        ) : undefined
      }
      subtitle={
        provider?.category
          ? `${t.categories[provider.category] ?? provider.category}${provider.city ? " · " + provider.city : ""}`
          : t.pages.provider.body
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowScan(true)}
          disabled={!provider}
          className="btn-press inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:opacity-90 disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
          {p.scan.cta}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={p.revenueThisMonth} value={formatLek(revenueThisMonth)} />
        <Stat label={p.activeRedemptions} value={activeRedemptions} />
        <Stat label={p.yourOffers} value={myOffers.length} />
      </div>

      <Card
        title={p.yourOffers}
        hint={
          provider
            ? ((
                <button
                  onClick={() => setShowNew(true)}
                  className="btn-press rounded-full bg-copper px-3.5 py-1.5 text-xs font-medium text-parchment hover:bg-copper-dark"
                >
                  + {p.addOffer}
                </button>
              ) as any)
            : undefined
        }
      >
        {myOffers.length === 0 ? (
          <p className="text-sm text-ink/60">{p.noOffers}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myOffers.map((o) => (
              <article key={o.id} className="hairline rounded-2xl bg-parchment p-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ink/55">
                  <span>{t.categories[o.category] ?? o.category}</span>
                  <span className="font-mono-num text-ink">{formatLek(o.price_l)}</span>
                </div>
                <h3 className="mt-3 font-display text-xl leading-tight">
                  {locale === "sq" ? o.title_sq : o.title_en}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-ink/70">
                  {locale === "sq" ? o.description_sq : o.description_en}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.mood.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-copper-light px-2 py-0.5 text-[11px] font-medium text-copper-dark"
                    >
                      {t.moods[m] ?? m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card title={p.whatPicking}>
        {popular.every((x) => x.n === 0) ? (
          <p className="text-sm text-ink/60">{p.whatPickingEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {popular.map(({ o, n }) => {
              const max = popular[0].n || 1;
              return (
                <li key={o.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{locale === "sq" ? o.title_sq : o.title_en}</span>
                    <span className="font-mono-num text-ink/60">
                      {p.timesPicked.replace("{n}", String(n))}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-parchment">
                    <div className="h-full bg-copper" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={p.recentDemand}>
        {!demandQ.data || demandQ.data.length === 0 ? (
          <p className="text-sm text-ink/60">{p.noDemand}</p>
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {demandQ.data.slice(0, 10).map((s) => {
              const o = myOffers.find((x) => s.offer_ids.includes(x.id));
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">
                      {o ? (locale === "sq" ? o.title_sq : o.title_en) : "—"}
                    </div>
                    <div className="text-xs text-ink/55">
                      {new Date(s.created_at).toLocaleDateString(
                        locale === "sq" ? "sq-AL" : "en-GB",
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num text-sm">{formatLek(s.total_l)}</span>
                    <span className="rounded-full border border-[var(--hairline)] bg-parchment px-2.5 py-1 text-xs">
                      {
                        t.dashboard.employee.status[
                          s.status as keyof typeof t.dashboard.employee.status
                        ]
                      }
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={p.scan.redeemedLog}>
        {!redeemedQ.data || redeemedQ.data.length === 0 ? (
          <p className="text-sm text-ink/60">{p.scan.redeemedLogEmpty}</p>
        ) : (
          <ul className="divide-y divide-[var(--hairline)]">
            {redeemedQ.data.map((v) => {
              const o = myOffers.find((x) => x.id === v.offer_id);
              const when = v.redeemed_at ? new Date(v.redeemed_at) : null;
              return (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {o ? (locale === "sq" ? o.title_sq : o.title_en) : "—"}
                    </div>
                    <div className="font-mono-num text-xs text-ink/55">{v.code}</div>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="font-mono-num text-sm">{formatLek(v.value_l)}</span>
                    <span className="text-xs text-ink/55">
                      {when
                        ? when.toLocaleString(locale === "sq" ? "sq-AL" : "en-GB", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {showNew && provider ? (
        <NewOfferDialog
          providerId={provider.id}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["offers"] });
            setShowNew(false);
          }}
        />
      ) : null}

      <ProviderScanModal
        open={showScan}
        onClose={() => setShowScan(false)}
        providerName={provider?.business_name ?? ""}
        onRedeemed={() => {
          qc.invalidateQueries({ queryKey: ["vouchers", "provider-redeemed", provider?.id] });
          qc.invalidateQueries({ queryKey: ["vouchers"] });
        }}
      />
    </AppShell>
  );
}

function NewOfferDialog({
  providerId,
  onClose,
  onCreated,
}: {
  providerId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useLocale();
  const p = t.dashboard.provider;
  const [titleSq, setTitleSq] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [price, setPrice] = useState<number>(2000);
  const [category, setCategory] = useState<string>(CATEGORY_VALUES[0]);
  const [moods, setMoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleMood(m: string) {
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function handleSave() {
    if (!titleSq.trim() || !titleEn.trim() || !price) {
      toast.error("…");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("offers").insert({
      provider_id: providerId,
      title_sq: titleSq.trim(),
      title_en: titleEn.trim(),
      price_l: price,
      category,
      mood: moods,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(p.created);
    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="hairline w-full max-w-lg rounded-3xl bg-paper p-6 sm:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className="font-display text-2xl font-medium tracking-tight">{p.newOffer}</h3>
        <div className="mt-5 grid gap-4">
          <Field label={p.titleSq}>
            <input
              value={titleSq}
              onChange={(ev) => setTitleSq(ev.target.value)}
              className="hairline w-full rounded-lg bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
            />
          </Field>
          <Field label={p.titleEn}>
            <input
              value={titleEn}
              onChange={(ev) => setTitleEn(ev.target.value)}
              className="hairline w-full rounded-lg bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={p.priceL}>
              <input
                type="number"
                value={price}
                min={100}
                step={100}
                onChange={(ev) => setPrice(Number(ev.target.value))}
                className="hairline w-full rounded-lg bg-parchment px-3 py-2 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-copper/40"
              />
            </Field>
            <Field label={p.categoryLabel}>
              <select
                value={category}
                onChange={(ev) => setCategory(ev.target.value)}
                className="hairline w-full rounded-lg bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
              >
                {CATEGORY_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {t.categories[c] ?? c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={p.moodsLabel}>
            <div className="flex flex-wrap gap-2">
              {MOOD_VALUES.map((m) => {
                const active = moods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMood(m)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-copper text-parchment"
                        : "bg-parchment text-ink/70 hairline hover:text-ink"
                    }`}
                  >
                    {t.moods[m] ?? m}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink"
          >
            {p.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-press rounded-full bg-copper px-5 py-2 text-sm font-medium text-parchment hover:bg-copper-dark disabled:opacity-50"
          >
            {saving ? p.saving : p.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/55">
        {label}
      </span>
      {children}
    </label>
  );
}
