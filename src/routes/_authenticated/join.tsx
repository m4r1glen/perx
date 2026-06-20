import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale-context";
import { useProfile } from "@/lib/use-profile";
import { joinDict } from "@/lib/team-i18n";
import { Check, Loader2 } from "lucide-react";
import { Wordmark, LangToggle } from "@/components/site-header";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/_authenticated/join")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [{ title: "Ftesë · PERX" }],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = useSearch({ from: "/_authenticated/join" });
  const { locale } = useLocale();
  const T = joinDict[locale];
  const navigate = useNavigate();
  const { data: profile, refetch } = useProfile();
  const [state, setState] = useState<"idle" | "working" | "ok" | "err">("idle");
  const [invitation, setInvitation] = useState<{ email: string; company_id: string } | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await (supabase.from("company_invitations") as any)
        .select("email, company_id, status, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (
        error ||
        !data ||
        data.status !== "pending" ||
        new Date(data.expires_at).getTime() < Date.now()
      ) {
        setErrMsg(T.inviteInvalid);
        return;
      }
      setInvitation({ email: data.email, company_id: data.company_id });
      const { data: c } = await (supabase as any)
        .from("public_companies")
        .select("name")
        .eq("id", data.company_id)
        .maybeSingle();
      setCompanyName((c as any)?.name ?? "");
    })();
  }, [token, T.inviteInvalid]);

  async function accept() {
    if (!token) return;
    if (!profile) {
      toast.error(T.inviteNeedAuth);
      return;
    }
    if (invitation && profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      setErrMsg(T.inviteWrongEmail);
      return;
    }
    setState("working");
    const { error } = await (supabase.rpc as any)("accept_invitation", { _token: token });
    if (error) {
      setState("err");
      setErrMsg(error.message);
      return;
    }
    setState("ok");
    toast.success(T.inviteAccepted);
    await refetch();
    setTimeout(() => navigate({ to: "/app/employee" }), 900);
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-[var(--hairline)] bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Wordmark />
          <LangToggle />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-16">
        <div className="hairline rounded-3xl bg-paper p-8 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper-dark">
            {T.bannerKicker}
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">{T.inviteTitle}</h1>
          {invitation ? (
            <p className="mt-3 text-sm text-ink/65">
              {T.inviteSubtitle.replace("{company}", companyName || "—")}
            </p>
          ) : null}
          {errMsg ? (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errMsg}</p>
          ) : null}

          {state === "ok" ? (
            <div className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check />
            </div>
          ) : (
            <button
              onClick={accept}
              disabled={!invitation || state === "working" || !!errMsg}
              className="btn-press mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-white hover:bg-copper-dark disabled:opacity-60"
            >
              {state === "working" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> {T.inviteAccepting}
                </>
              ) : (
                T.inviteAccept
              )}
            </button>
          )}

          <div className="mt-6 text-xs text-ink/55">
            <Link to="/app/employee" className="hover:text-copper-dark">
              → /app
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
