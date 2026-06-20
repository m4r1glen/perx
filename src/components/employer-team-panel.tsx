import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Mail, Trash2, UserPlus, X, Check, Sparkles, Coins, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { teamDict } from "@/lib/team-i18n";
import {
  useCompanyInvitations,
  useCompanyJoinRequests,
  useEmployeePointsBalances,
  type CompanyInvitation,
} from "@/lib/use-team";
import {
  useCompanyEmployees,
  useCompanySelections,
  formatLek,
  formatNumber,
} from "@/lib/use-marketplace";
import { Card, Stat } from "@/components/app-shell";
import { CountUp } from "@/components/count-up";

type Tab = "employees" | "requests" | "invitations";

export function EmployerTeamPanel({
  company,
  annualWelfare,
}: {
  company: {
    id: string;
    monthly_budget_per_employee_lek: number | null;
    employee_count: number | null;
  };
  annualWelfare: number;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale];
  const qc = useQueryClient();

  const employeesQ = useCompanyEmployees(company.id);
  const employees = useMemo(() => (employeesQ.data ?? []) as any[], [employeesQ.data]);
  const employeeIds = useMemo(() => employees.map((e) => e.id as string), [employees]);
  const selectionsQ = useCompanySelections(employeeIds);
  const balancesQ = useEmployeePointsBalances(employeeIds);
  const invitationsQ = useCompanyInvitations(company.id);
  const requestsQ = useCompanyJoinRequests(company.id);

  const last30Cutoff = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const spendByEmployee = useMemo(() => {
    const m = new Map<string, number>();
    (selectionsQ.data ?? []).forEach((s: any) => {
      if (s.status !== "paid") return;
      if (new Date(s.created_at).getTime() < last30Cutoff) return;
      m.set(s.employee_id, (m.get(s.employee_id) ?? 0) + (s.total_l ?? 0));
    });
    return m;
  }, [selectionsQ.data, last30Cutoff]);

  const totalSpentLast30 = useMemo(
    () => Array.from(spendByEmployee.values()).reduce((a, b) => a + b, 0),
    [spendByEmployee],
  );

  const pendingRequests = (requestsQ.data ?? []).filter((r) => r.request.status === "pending");
  const pendingInvites = (invitationsQ.data ?? []).filter((i) => i.status === "pending");

  const [tab, setTab] = useState<Tab>("employees");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["companyEmployees", company.id] });
    qc.invalidateQueries({ queryKey: ["companyInvitations", company.id] });
    qc.invalidateQueries({ queryKey: ["companyJoinRequests", company.id] });
    qc.invalidateQueries({ queryKey: ["selections", "company"] });
    qc.invalidateQueries({ queryKey: ["pointsBalances"] });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={T.summary.activeEmployees} value={employees.length} />
        <Stat label={T.summary.yearlyBudget} value={formatLek(annualWelfare)} />
        <Stat label={T.summary.spentLast30} value={formatLek(totalSpentLast30)} />
      </div>

      <Card title={T.sectionTitle} hint={T.sectionHint}>
        <div className="mb-5 flex flex-wrap items-center gap-1.5 rounded-full bg-parchment p-1 text-sm">
          {(["employees", "requests", "invitations"] as Tab[]).map((k) => {
            const active = tab === k;
            const badge =
              k === "requests" && pendingRequests.length
                ? pendingRequests.length
                : k === "invitations" && pendingInvites.length
                  ? pendingInvites.length
                  : null;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`btn-press inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors ${
                  active ? "bg-paper text-ink shadow-sm" : "text-ink/60 hover:text-ink"
                }`}
              >
                {T.tabs[k]}
                {badge ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-copper px-1.5 text-[11px] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {tab === "employees" && (
          <EmployeesTab
            employees={employees}
            balances={balancesQ.data ?? new Map()}
            spend={spendByEmployee}
            onChanged={refresh}
            onGoToInvite={() => setTab("invitations")}
          />
        )}
        {tab === "requests" && <RequestsTab data={requestsQ.data ?? []} onChanged={refresh} />}
        {tab === "invitations" && (
          <InvitationsTab
            invitations={invitationsQ.data ?? []}
            companyId={company.id}
            onChanged={refresh}
          />
        )}
      </Card>
    </>
  );
}

/* ============== Employees ============== */

function EmployeesTab({
  employees,
  balances,
  spend,
  onChanged,
  onGoToInvite,
}: {
  employees: any[];
  balances: Map<string, number>;
  spend: Map<string, number>;
  onChanged: () => void;
  onGoToInvite: () => void;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale].employees;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "spend">("spend");
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);
  const [grantTarget, setGrantTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = employees.filter((e) => {
      if (!q) return true;
      return (
        (e.full_name ?? "").toLowerCase().includes(q) ||
        (e.job_title ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
      );
    });
    r = r
      .slice()
      .sort((a, b) =>
        sort === "name"
          ? (a.full_name ?? "").localeCompare(b.full_name ?? "")
          : (spend.get(b.id) ?? 0) - (spend.get(a.id) ?? 0),
      );
    return r;
  }, [employees, search, sort, spend]);

  async function handleRemove() {
    if (!confirm) return;
    setBusy(true);
    const { error } = await (supabase.rpc as any)("remove_employee", { _employee_id: confirm.id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(T.removed.replace("{name}", confirm.name));
    setConfirm(null);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={T.searchPlaceholder}
          className="min-w-[200px] flex-1 rounded-full border border-[var(--hairline)] bg-parchment px-4 py-2 text-sm outline-none focus:border-copper"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-full border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm"
        >
          <option value="spend">{T.sortSpend}</option>
          <option value="name">{T.sortName}</option>
        </select>
        <button
          onClick={() => setBulkOpen(true)}
          disabled={rows.length === 0}
          className="btn-press ml-auto inline-flex items-center gap-1.5 rounded-full border border-copper bg-copper-light px-4 py-2 text-sm font-medium text-copper-dark hover:bg-copper hover:text-white disabled:opacity-50"
        >
          <Users size={14} /> {T.bulkBtn}
        </button>
        <button
          onClick={onGoToInvite}
          className="btn-press inline-flex items-center gap-1.5 rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark"
        >
          <UserPlus size={14} /> {T.addBtn}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/60">{T.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
              <tr>
                <th className="py-2 pr-4">{T.colName}</th>
                <th className="py-2 pr-4">{T.colRole}</th>
                <th className="py-2 pr-4 text-right">{T.colBalance}</th>
                <th className="py-2 pr-4 text-right">{T.colSpend}</th>
                <th className="py-2 text-right">{T.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="py-3 pr-4 font-medium">{e.full_name || "—"}</td>
                  <td className="py-3 pr-4 text-ink/70">{e.job_title || e.department || "—"}</td>
                  <td className="py-3 pr-4 text-right font-mono-num">
                    <CountUp value={balances.get(e.id) ?? 0} pulseOnChange />
                  </td>
                  <td className="py-3 pr-4 text-right font-mono-num">
                    {formatLek(spend.get(e.id) ?? 0)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setGrantTarget({ id: e.id, name: e.full_name || "—" })}
                        className="btn-press inline-flex items-center gap-1 rounded-full bg-copper px-3 py-1 text-xs font-medium text-white hover:bg-copper-dark"
                      >
                        <Sparkles size={12} /> {T.grant}
                      </button>
                      <button
                        onClick={() => setConfirm({ id: e.id, name: e.full_name || "—" })}
                        className="btn-press inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] px-3 py-1 text-xs text-ink/70 hover:text-red-600"
                      >
                        <Trash2 size={12} /> {T.remove}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-ink/55">{T.addHint}</p>

      {confirm ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="hairline w-full max-w-md rounded-2xl bg-paper p-6"
          >
            <h3 className="font-display text-lg">
              {T.removeTitle.replace("{name}", confirm.name)}
            </h3>
            <p className="mt-2 text-sm text-ink/65">{T.removeBody}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="btn-press rounded-full border border-[var(--hairline)] px-4 py-2 text-sm"
              >
                {T.cancel}
              </button>
              <button
                onClick={handleRemove}
                disabled={busy}
                className="btn-press rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {T.confirmRemove}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {grantTarget ? (
        <GrantPointsModal
          employee={grantTarget}
          onClose={() => setGrantTarget(null)}
          onGranted={() => {
            setGrantTarget(null);
            onChanged();
          }}
        />
      ) : null}

      {bulkOpen ? (
        <BulkGrantPointsModal
          employees={rows.map((e) => ({ id: e.id, name: e.full_name || "—" }))}
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setBulkOpen(false);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

/* ============== Grant points ============== */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-copper-light font-display text-copper-dark"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsOf(name)}
    </div>
  );
}

const QUICK_AMOUNTS = [1000, 5000, 10000];

function GrantPointsModal({
  employee,
  onClose,
  onGranted,
}: {
  employee: { id: string; name: string };
  onClose: () => void;
  onGranted: () => void;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale].employees;
  const presets = [T.grantPreset1, T.grantPreset2, T.grantPreset3, T.grantPreset4];
  const [amount, setAmount] = useState<string>("1000");
  const [reasonChoice, setReasonChoice] = useState<string>(presets[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const parsed = Number(amount);
  const isCustom = reasonChoice === "__custom__";
  const finalReason = (isCustom ? customReason : reasonChoice).trim();
  const validAmount =
    Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0 && parsed <= 1_000_000;
  const validReason = finalReason.length > 0;
  const canSubmit = validAmount && validReason && !busy;
  const amountError = amount && !validAmount;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const { error } = await (supabase.rpc as any)("grant_points", {
      _employee_id: employee.id,
      _amount: parsed,
      _reason: finalReason,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      T.granted.replace("{amount}", formatNumber(parsed)).replace("{name}", employee.name),
    );
    onGranted();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={() => !busy && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="hairline w-full max-w-md space-y-4 rounded-2xl bg-paper p-6"
      >
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg">
              {T.grantTitle.replace("{name}", employee.name)}
            </h3>
            <p className="text-xs text-ink/60">{T.grantBody}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-ink/55">{T.grantAmount}</span>
          <input
            type="number"
            min={1}
            max={1_000_000}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`mt-1 w-full rounded-xl border bg-parchment px-3 py-2 font-mono-num text-lg outline-none focus:border-copper ${
              amountError ? "border-red-500" : "border-[var(--hairline)]"
            }`}
            autoFocus
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className={amountError ? "text-red-600" : "text-ink/55"}>
              {amountError
                ? locale === "sq"
                  ? "Vendos një numër pozitiv (≤ 1,000,000)."
                  : "Enter a positive number (≤ 1,000,000)."
                : T.grantHint.replace("{lek}", formatLek(validAmount ? parsed : 0))}
            </span>
          </div>
        </label>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(String(v))}
              className="btn-press rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1 text-xs text-ink/70 hover:text-ink"
            >
              +{formatNumber(v)}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-ink/55">{T.grantReason}</span>
          <select
            value={reasonChoice}
            onChange={(e) => setReasonChoice(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm outline-none focus:border-copper"
          >
            {presets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value="__custom__">{T.grantPresetCustom}</option>
          </select>
        </label>

        {isCustom ? (
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder={T.grantReasonPlaceholder}
            maxLength={120}
            className="w-full rounded-xl border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm outline-none focus:border-copper"
          />
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-press rounded-full border border-[var(--hairline)] px-4 py-2 text-sm"
          >
            {T.cancel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-60"
          >
            <Coins size={14} /> {busy ? T.grantSubmitting : T.grantConfirm}
          </button>
        </div>
      </form>
    </div>
  );
}

function BulkGrantPointsModal({
  employees,
  onClose,
  onDone,
}: {
  employees: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale].employees;
  const presets = [T.grantPreset1, T.grantPreset2, T.grantPreset3, T.grantPreset4];
  const [amount, setAmount] = useState<string>("1000");
  const [reasonChoice, setReasonChoice] = useState<string>(presets[1]);
  const [customReason, setCustomReason] = useState<string>("");
  const [step, setStep] = useState<"compose" | "confirm">("compose");
  const [busy, setBusy] = useState(false);

  const parsed = Number(amount);
  const isCustom = reasonChoice === "__custom__";
  const finalReason = (isCustom ? customReason : reasonChoice).trim();
  const validAmount =
    Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0 && parsed <= 1_000_000;
  const validReason = finalReason.length > 0;
  const canContinue = validAmount && validReason && employees.length > 0;

  async function runBulk() {
    setBusy(true);
    let ok = 0;
    let err = 0;
    for (const emp of employees) {
      const { error } = await (supabase.rpc as any)("grant_points", {
        _employee_id: emp.id,
        _amount: parsed,
        _reason: finalReason,
      });
      if (error) err += 1;
      else ok += 1;
    }
    setBusy(false);
    if (err === 0) {
      toast.success(
        T.bulkSuccess.replace("{amount}", formatNumber(parsed)).replace("{count}", String(ok)),
      );
    } else {
      toast(
        T.bulkPartial
          .replace("{ok}", String(ok))
          .replace("{count}", String(employees.length))
          .replace("{err}", String(err)),
      );
    }
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hairline w-full max-w-md space-y-4 rounded-2xl bg-paper p-6"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-copper-light text-copper-dark">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-display text-lg">{T.bulkTitle}</h3>
            <p className="text-xs text-ink/60">
              {T.bulkBody.replace("{count}", String(employees.length))}
            </p>
          </div>
        </div>

        {step === "compose" ? (
          <>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink/55">{T.grantAmount}</span>
              <input
                type="number"
                min={1}
                max={1_000_000}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--hairline)] bg-parchment px-3 py-2 font-mono-num text-lg outline-none focus:border-copper"
                autoFocus
              />
              <span className="mt-1 block text-xs text-ink/55">
                {T.grantHint.replace("{lek}", formatLek(validAmount ? parsed : 0))}
              </span>
            </label>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className="btn-press rounded-full border border-[var(--hairline)] bg-parchment px-3 py-1 text-xs text-ink/70 hover:text-ink"
                >
                  +{formatNumber(v)}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink/55">{T.grantReason}</span>
              <select
                value={reasonChoice}
                onChange={(e) => setReasonChoice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm outline-none focus:border-copper"
              >
                {presets.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="__custom__">{T.grantPresetCustom}</option>
              </select>
            </label>

            {isCustom ? (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={T.grantReasonPlaceholder}
                maxLength={120}
                className="w-full rounded-xl border border-[var(--hairline)] bg-parchment px-3 py-2 text-sm outline-none focus:border-copper"
              />
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-press rounded-full border border-[var(--hairline)] px-4 py-2 text-sm"
              >
                {T.cancel}
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep("confirm")}
                className="btn-press inline-flex items-center gap-1.5 rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-60"
              >
                <Users size={14} />{" "}
                {T.bulkConfirm
                  .replace("{amount}", formatNumber(validAmount ? parsed : 0))
                  .replace("{count}", String(employees.length))}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-parchment p-4 text-sm text-ink/80">
              <div className="font-medium text-ink">
                {T.bulkConfirm
                  .replace("{amount}", formatNumber(parsed))
                  .replace("{count}", String(employees.length))}
              </div>
              <div className="mt-1 text-xs text-ink/60">
                {T.grantReason}: <span className="text-ink/80">{finalReason}</span>
              </div>
              <div className="mt-1 text-xs text-ink/60">
                {T.grantHint.replace("{lek}", formatLek(parsed * employees.length))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep("compose")}
                disabled={busy}
                className="btn-press rounded-full border border-[var(--hairline)] px-4 py-2 text-sm"
              >
                {T.cancel}
              </button>
              <button
                type="button"
                onClick={runBulk}
                disabled={busy}
                className="btn-press inline-flex items-center gap-1.5 rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-60"
              >
                <Coins size={14} /> {busy ? T.bulkSubmitting : T.grantConfirm}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============== Requests ============== */

function RequestsTab({
  data,
  onChanged,
}: {
  data: { request: any; applicant: any }[];
  onChanged: () => void;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale].requests;
  const pending = data.filter((r) => r.request.status === "pending");
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(requestId: string, name: string, action: "approve" | "reject") {
    setBusy(requestId);
    const fn = action === "approve" ? "approve_join_request" : "reject_join_request";
    const { error } = await (supabase.rpc as any)(fn, { _request_id: requestId });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (action === "approve") toast.success(T.approved.replace("{name}", name));
    else toast(T.rejected);
    onChanged();
  }

  if (pending.length === 0) {
    return <p className="py-6 text-center text-sm text-ink/60">{T.empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {pending.map(({ request, applicant }) => {
        const name = applicant?.full_name || "—";
        return (
          <li key={request.id} className="hairline rounded-2xl bg-parchment p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{name}</div>
                <div className="text-xs text-ink/55">
                  {applicant?.job_title || applicant?.department || "—"}
                </div>
                {request.message ? (
                  <div className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink/75">
                    <span className="text-[11px] uppercase tracking-wide text-ink/45">
                      {T.messageLabel}:{" "}
                    </span>
                    {request.message}
                  </div>
                ) : null}
                <div className="mt-1.5 text-[11px] text-ink/50">
                  {T.sentAgo} {formatRelative(request.created_at, locale)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => decide(request.id, name, "reject")}
                  disabled={busy === request.id}
                  className="btn-press rounded-full border border-[var(--hairline)] bg-paper px-3.5 py-1.5 text-sm text-ink/70 hover:text-ink disabled:opacity-50"
                >
                  {T.reject}
                </button>
                <button
                  onClick={() => decide(request.id, name, "approve")}
                  disabled={busy === request.id}
                  className="btn-press rounded-full bg-copper px-4 py-1.5 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-50"
                >
                  {T.approve}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ============== Invitations ============== */

function InvitationsTab({
  invitations,
  companyId,
  onChanged,
}: {
  invitations: CompanyInvitation[];
  companyId: string;
  onChanged: () => void;
}) {
  const { locale } = useLocale();
  const T = teamDict[locale].invitations;
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);

  function parseEmails(raw: string): string[] {
    return Array.from(
      new Set(
        raw
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  async function send() {
    const list = parseEmails(emails);
    if (list.length === 0) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const e of list) {
      if (!emailRe.test(e)) {
        toast.error(T.invalidEmail.replace("{email}", e));
        return;
      }
    }
    const existing = new Set(
      invitations.filter((i) => i.status === "pending").map((i) => i.email.toLowerCase()),
    );
    const toInsert = list.filter((e) => !existing.has(e));
    if (toInsert.length === 0) {
      toast(T.duplicate.replace("{email}", list[0]));
      return;
    }
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id;
    const rows = toInsert.map((email) => ({
      company_id: companyId,
      email,
      invited_by: userId,
    }));
    const { error } = await (supabase.from("company_invitations") as any).insert(rows);
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(T.sent.replace("{n}", String(toInsert.length)));
    setEmails("");
    onChanged();
  }

  async function revoke(id: string) {
    const { error } = await (supabase.rpc as any)("revoke_invitation", { _invitation_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast(T.revoked);
    onChanged();
  }

  function inviteLink(token: string) {
    return `${typeof window !== "undefined" ? window.location.origin : ""}/join?token=${encodeURIComponent(token)}`;
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(inviteLink(token));
      toast.success(T.copied);
    } catch {
      toast.error("Copy failed");
    }
  }

  const statusLabel: Record<CompanyInvitation["status"], string> = {
    pending: T.statusPending,
    accepted: T.statusAccepted,
    revoked: T.statusRevoked,
    expired: T.statusExpired,
  };

  return (
    <div className="space-y-5">
      <div className="hairline rounded-2xl bg-parchment p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink/80">
          <Mail size={14} /> {T.sendTitle}
        </div>
        <p className="mt-1 text-xs text-ink/55">{T.sendHint}</p>
        <textarea
          rows={2}
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder={T.placeholder}
          className="mt-3 block w-full rounded-xl border border-[var(--hairline)] bg-paper px-4 py-3 text-sm outline-none focus:border-copper"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-ink/50">{T.shareNote}</span>
          <button
            onClick={send}
            disabled={sending || !emails.trim()}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-60"
          >
            {sending ? T.sending : T.send}
          </button>
        </div>
      </div>

      {invitations.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/60">{T.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/55">
              <tr>
                <th className="py-2 pr-4">{T.colEmail}</th>
                <th className="py-2 pr-4">{T.colSent}</th>
                <th className="py-2 pr-4">{T.colExpires}</th>
                <th className="py-2 pr-4">{T.colStatus}</th>
                <th className="py-2 text-right">{/* actions */}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 pr-4 font-medium">{inv.email}</td>
                  <td className="py-3 pr-4 text-ink/60">{formatDate(inv.created_at, locale)}</td>
                  <td className="py-3 pr-4 text-ink/60">{formatDate(inv.expires_at, locale)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        inv.status === "pending"
                          ? "bg-copper-light text-copper-dark"
                          : inv.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {statusLabel[inv.status]}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {inv.status === "pending" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => copy(inv.token)}
                          className="btn-press inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] px-3 py-1 text-xs hover:text-copper-dark"
                        >
                          <Copy size={12} /> {T.copyLink}
                        </button>
                        <button
                          onClick={() => revoke(inv.id)}
                          className="btn-press inline-flex items-center gap-1 rounded-full border border-[var(--hairline)] px-3 py-1 text-xs text-ink/60 hover:text-red-600"
                        >
                          <X size={12} /> {T.revoke}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============== helpers ============== */

function formatDate(iso: string, locale: "sq" | "en") {
  try {
    return new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatRelative(iso: string, locale: "sq" | "en") {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return locale === "sq" ? "tani" : "just now";
  if (hours < 24) return locale === "sq" ? `${hours} orë më parë` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return locale === "sq" ? `${days} ditë më parë` : `${days}d ago`;
}

// suppress unused import warnings for icons used conditionally
void Check;
