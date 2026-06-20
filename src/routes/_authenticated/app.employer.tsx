import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { applyCompanyBrand, clearCompanyBrand } from "@/lib/brand-theme";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useProfile } from "@/lib/use-profile";
import {
  useMyCompany,
  useCompanyEmployees,
  useCompanySelections,
  useOffers,
  useProviders,
  formatLek,
  type Offer,
  type Provider,
  type Selection,
} from "@/lib/use-marketplace";
import { AppShell, Card, Stat } from "@/components/app-shell";
import { EmployerTeamPanel } from "@/components/employer-team-panel";

export const Route = createFileRoute("/_authenticated/app/employer")({
  head: () => ({
    meta: [
      { title: "Punëdhënësi · PERX" },
      { name: "description", content: "Paneli i punëdhënësit në PERX." },
    ],
  }),
  component: EmployerDashboard,
});

function EmployerDashboard() {
  const { t, locale } = useLocale();
  const e = t.dashboard.employer;
  const { data: profile } = useProfile();
  const ownerId = profile?.id;
  const qc = useQueryClient();

  const companyQ = useMyCompany(ownerId);
  const company = companyQ.data;

  useEffect(() => {
    applyCompanyBrand(company?.brand_primary ?? null);
    return () => {
      clearCompanyBrand();
    };
  }, [company?.brand_primary]);

  const employeesQ = useCompanyEmployees(company?.id);
  const employeeIds = useMemo(
    () => (employeesQ.data ?? []).map((emp: any) => emp.id as string),
    [employeesQ.data],
  );
  const selectionsQ = useCompanySelections(employeeIds);
  const offersQ = useOffers();
  const providersQ = useProviders();

  const offerById = useMemo(() => {
    const m = new Map<string, Offer>();
    (offersQ.data ?? []).forEach((o) => m.set(o.id, o));
    return m;
  }, [offersQ.data]);
  const providerById = useMemo(() => {
    const m = new Map<string, Provider>();
    (providersQ.data ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [providersQ.data]);

  const employeeInfo = useMemo(() => {
    const m = new Map<string, { name: string; job: string }>();
    (employeesQ.data ?? []).forEach((emp: any) =>
      m.set(emp.id, {
        name: emp.full_name || emp.email || "—",
        job: emp.job_title || (emp.department ?? ""),
      }),
    );
    return m;
  }, [employeesQ.data]);

  const selections = selectionsQ.data ?? [];
  const pending = selections.filter((s) => s.status === "pending");
  const paid = selections.filter((s) => s.status === "paid");
  const spent = paid.reduce((s, x) => s + x.total_l, 0);
  const headcount = company?.employee_count ?? employeesQ.data?.length ?? 0;
  const monthlyPool = (company?.monthly_budget_per_employee_lek ?? 0) * headcount;
  const annualPool = monthlyPool * 12;

  // Analysis
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selections.forEach((s) =>
      s.offer_ids.forEach((id) => {
        const cat = offerById.get(id)?.category;
        if (!cat) return;
        counts.set(cat, (counts.get(cat) ?? 0) + 1);
      }),
    );
    return counts;
  }, [selections, offerById]);

  const allCategories = useMemo(
    () => Array.from(new Set((offersQ.data ?? []).map((o) => o.category))),
    [offersQ.data],
  );
  const topCategory = useMemo(() => {
    const arr = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
    return arr[0]?.[0];
  }, [categoryCounts]);
  const unusedCategories = allCategories.filter((c) => !categoryCounts.has(c));

  const onRefresh = () => qc.invalidateQueries({ queryKey: ["selections", "company"] });

  return (
    <AppShell
      kicker={t.pages.employer.kicker}
      title={company?.name ?? t.pages.employer.title}
      subtitle={t.pages.employer.body}
    >
      {!company ? (
        <Card>
          <p className="text-sm text-ink/70">{e.noCompany}</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={e.employees} value={headcount} />
            <Stat
              label={e.annualBudget}
              value={formatLek(annualPool)}
              hint={`${formatLek(monthlyPool)} / ${locale === "sq" ? "muaj" : "mo"}`}
            />
            <Stat label={e.pendingCount} value={pending.length} />
            <Stat label={e.spentThisCycle} value={formatLek(spent)} hint={e.paid} />
          </div>

          <Card title={e.approvals}>
            {pending.length === 0 ? (
              <p className="text-sm text-ink/60">{e.empty}</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((s) => (
                  <ApprovalRow
                    key={s.id}
                    selection={s}
                    offerById={offerById}
                    providerById={providerById}
                    employeeInfo={employeeInfo.get(s.employee_id)}
                    locale={locale}
                    t={t}
                    onDone={onRefresh}
                  />
                ))}
              </ul>
            )}
          </Card>

          <EmployerTeamPanel
            company={{
              id: company.id,
              monthly_budget_per_employee_lek: company.monthly_budget_per_employee_lek,
              employee_count: company.employee_count,
            }}
            annualWelfare={annualPool}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={e.analysis}>
              <AnalysisBlock
                topCategory={topCategory}
                unusedCategories={unusedCategories}
                categoryCounts={categoryCounts}
                t={t}
              />
            </Card>
            <Card title={e.savingsCalc} hint={e.savingsCalcHint}>
              <EmployerSavingsCalc t={t} />
            </Card>
          </div>

          <Card title={e.recentActivity}>
            {selections.length === 0 ? (
              <p className="text-sm text-ink/60">{e.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
                    <tr>
                      <th className="py-2 pr-4">{e.employee}</th>
                      <th className="py-2 pr-4">{t.dashboard.employee.browse}</th>
                      <th className="py-2 pr-4">{e.total}</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)]">
                    {selections.slice(0, 12).map((s) => {
                      const o = offerById.get(s.offer_ids[0]);
                      return (
                        <tr key={s.id}>
                          <td className="py-3 pr-4">
                            {employeeInfo.get(s.employee_id)?.name ?? "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {o ? (locale === "sq" ? o.title_sq : o.title_en) : "—"}
                            {s.offer_ids.length > 1 ? ` +${s.offer_ids.length - 1}` : ""}
                          </td>
                          <td className="py-3 pr-4 font-mono-num">{formatLek(s.total_l)}</td>
                          <td className="py-3 pr-4">
                            <StatusPill status={s.status} t={t} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}

function StatusPill({
  status,
  t,
}: {
  status: Selection["status"];
  t: ReturnType<typeof useLocale>["t"];
}) {
  const palette: Record<Selection["status"], string> = {
    pending: "bg-copper-light text-copper-dark",
    approved: "bg-copper-light text-copper-dark",
    paid: "bg-emerald-100 text-emerald-800",
    rejected: "bg-ink/10 text-ink/60",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${palette[status]}`}>
      {t.dashboard.employee.status[status]}
    </span>
  );
}

function ApprovalRow({
  selection,
  offerById,
  providerById,
  employeeInfo,
  locale,
  t,
  onDone,
}: {
  selection: Selection;
  offerById: Map<string, Offer>;
  providerById: Map<string, Provider>;
  employeeInfo?: { name: string; job: string };
  locale: "sq" | "en";
  t: ReturnType<typeof useLocale>["t"];
  onDone: () => void;
}) {
  const e = t.dashboard.employer;
  const [busy, setBusy] = useState(false);
  const [routing, setRouting] = useState<string | null>(null);

  const offers = selection.offer_ids.map((id) => offerById.get(id)).filter((x): x is Offer => !!x);

  const providers = useMemo(() => {
    const names = new Set<string>();
    offers.forEach((o) => {
      const p = providerById.get(o.provider_id);
      if (p) names.add(p.business_name);
    });
    return Array.from(names);
  }, [offers, providerById]);

  async function handleApprove() {
    setBusy(true);
    try {
      for (const name of providers) {
        setRouting(e.routingPayment.replace("{provider}", name));

        await new Promise((r) => setTimeout(r, 700));
      }

      const { error } = await (supabase.rpc as any)("approve_and_pay_selection", {
        _selection_id: selection.id,
        _simulate_payment: true,
      });
      if (error) throw error;

      burstConfetti();
      toast.success(e.approvedToast);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setRouting(null);
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    await supabase.from("selections").update({ status: "rejected" }).eq("id", selection.id);
    setBusy(false);
    toast(e.rejectedToast);
    onDone();
  }

  return (
    <li className="hairline rounded-2xl bg-parchment p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{employeeInfo?.name ?? "—"}</div>
          {employeeInfo?.job ? <div className="text-xs text-ink/55">{employeeInfo.job}</div> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {offers.map((o) => (
              <span
                key={o.id}
                className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink/80 hairline"
              >
                {locale === "sq" ? o.title_sq : o.title_en}
                <span className="ml-1.5 font-mono-num text-ink/55">{formatLek(o.price_l)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono-num text-lg">{formatLek(selection.total_l)}</span>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={busy}
              className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-3.5 py-1.5 text-sm font-medium text-ink/70 hover:text-ink disabled:opacity-50"
            >
              {e.reject}
            </button>
            <button
              onClick={handleApprove}
              disabled={busy}
              className="btn-press rounded-full bg-copper px-4 py-1.5 text-sm font-medium text-parchment hover:bg-copper-dark disabled:opacity-50"
            >
              {e.approve}
            </button>
          </div>
        </div>
      </div>
      {routing ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-copper-light px-3 py-2 text-sm text-copper-dark">
          <span className="inline-block size-2 animate-pulse rounded-full bg-copper-dark" />
          {routing}
        </div>
      ) : null}
    </li>
  );
}

function AnalysisBlock({
  topCategory,
  unusedCategories,
  categoryCounts,
  t,
}: {
  topCategory: string | undefined;
  unusedCategories: string[];
  categoryCounts: Map<string, number>;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const e = t.dashboard.employer;
  if (!topCategory) return <p className="text-sm text-ink/60">{e.analysisEmpty}</p>;
  const sorted = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];
  const topLabel = t.categories[topCategory] ?? topCategory;
  const unusedLabels = unusedCategories
    .map((c) => t.categories[c] ?? c)
    .slice(0, 3)
    .join(", ");
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-ink/55">{e.mostPopular}</div>
        <div className="mt-1 font-display text-2xl text-copper-dark">{topLabel}</div>
      </div>
      <ul className="space-y-2">
        {sorted.map(([cat, count]) => (
          <li key={cat}>
            <div className="flex items-baseline justify-between text-sm">
              <span>{t.categories[cat] ?? cat}</span>
              <span className="font-mono-num text-ink/60">{count}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-parchment">
              <div className="h-full bg-copper" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {unusedCategories.length > 0 ? (
        <div>
          <div className="text-xs uppercase tracking-wide text-ink/55">{e.goingUnused}</div>
          <div className="mt-1 text-sm text-ink/70">{unusedLabels}</div>
        </div>
      ) : null}
      <div className="rounded-xl bg-parchment p-3 text-sm text-ink/75">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/55">
          {e.summaryLabel}.{" "}
        </span>
        {e.summary.replace("{top}", topLabel).replace("{unused}", unusedLabels || "—")}
      </div>
    </div>
  );
}

function EmployerSavingsCalc({ t }: { t: ReturnType<typeof useLocale>["t"] }) {
  const e = t.dashboard.employer;
  const [value, setValue] = useState(20_000);
  const benefitCost = value;
  const cashCost = Math.round(value * 1.165);
  const saving = cashCost - benefitCost;
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <label className="text-sm text-ink/70">{e.valuePerEmployee}</label>
          <span className="font-mono-num text-lg">{formatLek(value)}</span>
        </div>
        <input
          type="range"
          min={5000}
          max={80000}
          step={1000}
          value={value}
          onChange={(ev) => setValue(Number(ev.target.value))}
          className="mt-2 w-full accent-copper"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="hairline rounded-xl bg-parchment p-3">
          <div className="text-xs uppercase tracking-wide text-ink/55">{e.asBenefit}</div>
          <div className="mt-1 font-mono-num text-xl">{formatLek(benefitCost)}</div>
        </div>
        <div className="hairline rounded-xl bg-parchment p-3">
          <div className="text-xs uppercase tracking-wide text-ink/55">{e.asCashRaise}</div>
          <div className="mt-1 font-mono-num text-xl">{formatLek(cashCost)}</div>
        </div>
      </div>
      <div className="rounded-xl bg-copper-light p-4">
        <div className="text-xs uppercase tracking-wide text-copper-dark">{e.youSave}</div>
        <div className="mt-1 font-mono-num text-3xl text-copper-dark">{formatLek(saving)}</div>
      </div>
      <p className="text-xs text-ink/55">{e.illustrative}</p>
    </div>
  );
}

function burstConfetti() {
  try {
    confetti({
      particleCount: 90,
      spread: 70,
      startVelocity: 38,
      origin: { y: 0.3 },
      colors: ["#B86B3E", "#E6C9A8", "#7C9A92", "#1F1B16"],
      scalar: 0.9,
    });
  } catch {
    /* noop */
  }
}
