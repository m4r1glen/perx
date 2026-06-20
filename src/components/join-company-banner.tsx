import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { joinDict } from "@/lib/team-i18n";
import { useCompaniesList, useMyJoinRequest } from "@/lib/use-team";
import { Building2, Hourglass, Search } from "lucide-react";

export function JoinCompanyBanner({ userId }: { userId: string }) {
  const { locale } = useLocale();
  const T = joinDict[locale];
  const qc = useQueryClient();
  const myReqQ = useMyJoinRequest(userId);
  const companiesQ = useCompaniesList();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const pending = myReqQ.data?.status === "pending";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (companiesQ.data ?? [])
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [companiesQ.data, search]);

  async function send() {
    if (!pickedId) {
      toast(T.pickFirst);
      return;
    }
    setSending(true);
    const { error } = await (supabase.rpc as any)("request_join_company", {
      _company_id: pickedId,
      _message: message,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(T.requestSent);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["myJoinRequest", userId] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  if (pending) {
    return (
      <div className="hairline mb-6 flex items-start gap-3 rounded-2xl bg-copper-light p-4 text-copper-dark">
        <Hourglass size={18} className="mt-0.5 shrink-0" />
        <div>
          <div className="font-medium">{T.pendingTitle}</div>
          <div className="text-sm opacity-80">{T.pendingBody}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hairline mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-parchment">
            <Building2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-copper-dark">
              {T.bannerKicker}
            </div>
            <div className="font-display text-lg leading-tight">{T.bannerTitle}</div>
            <div className="text-xs text-ink/60">{T.bannerBody}</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="btn-press rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark"
        >
          {T.bannerCta}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="hairline w-full max-w-lg rounded-2xl bg-paper p-6"
          >
            <h3 className="font-display text-xl">{T.bannerTitle}</h3>
            <div className="mt-4">
              <label className="text-xs font-medium uppercase tracking-wide text-ink/55">
                {T.pickCompany}
              </label>
              <div className="relative mt-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={T.searchPlaceholder}
                  className="block w-full rounded-xl border border-[var(--hairline)] bg-parchment py-2.5 pl-9 pr-3 text-sm outline-none focus:border-copper"
                />
              </div>
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[var(--hairline)]">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setPickedId(c.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-parchment ${pickedId === c.id ? "bg-copper-light text-copper-dark" : ""}`}
                    >
                      <div className="font-medium">{c.name}</div>
                      {c.industry ? <div className="text-xs text-ink/55">{c.industry}</div> : null}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-ink/55">—</li>
                ) : null}
              </ul>
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium uppercase tracking-wide text-ink/55">
                {T.messageLabel}
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={T.messagePlaceholder}
                className="mt-2 block w-full rounded-xl border border-[var(--hairline)] bg-parchment px-4 py-2.5 text-sm outline-none focus:border-copper"
                maxLength={300}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={sending}
                className="btn-press rounded-full border border-[var(--hairline)] px-4 py-2 text-sm"
              >
                {joinDict[locale === "sq" ? "sq" : "en"].pendingTitle
                  ? locale === "sq"
                    ? "Anulo"
                    : "Cancel"
                  : "Cancel"}
              </button>
              <button
                onClick={send}
                disabled={sending || !pickedId}
                className="btn-press rounded-full bg-copper px-4 py-2 text-sm font-medium text-white hover:bg-copper-dark disabled:opacity-60"
              >
                {sending ? T.sending : T.sendRequest}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
