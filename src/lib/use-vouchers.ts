import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Voucher = {
  id: string;
  selection_id: string;
  offer_id: string;
  employee_id: string;
  provider_id: string;
  code: string;
  status: "valid" | "redeemed" | "expired" | "cancelled";
  value_l: number;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by_provider_id: string | null;
  created_at: string;
};

export function useVouchersForSelection(selectionId: string | undefined) {
  return useQuery({
    queryKey: ["vouchers", "selection", selectionId],
    enabled: !!selectionId,
    queryFn: async (): Promise<Voucher[]> => {
      const { data, error } = await supabase
        .from("vouchers")
        .select(
          "id, selection_id, offer_id, employee_id, provider_id, code, status, value_l, expires_at, redeemed_at, redeemed_by_provider_id, created_at",
        )
        .eq("selection_id", selectionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Voucher[];
    },
  });
}

export function useRedeemedVouchersForProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: ["vouchers", "provider-redeemed", providerId],
    enabled: !!providerId,
    queryFn: async (): Promise<Voucher[]> => {
      const { data, error } = await supabase
        .from("vouchers")
        .select(
          "id, selection_id, offer_id, employee_id, provider_id, code, status, value_l, expires_at, redeemed_at, redeemed_by_provider_id, created_at",
        )
        .eq("provider_id", providerId!)
        .eq("status", "redeemed")
        .order("redeemed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Voucher[];
    },
  });
}

export type SignedVoucher = {
  ok: boolean;
  token?: string;
  code?: string;
  status?: Voucher["status"];
  value_l?: number;
  expires_at?: string;
  reason?: string;
};

export async function fetchSignedToken(voucherId: string): Promise<SignedVoucher> {
  const { data, error } = await supabase.functions.invoke("voucher-sign", {
    body: { voucher_id: voucherId },
  });
  if (error) throw error;
  return data as SignedVoucher;
}

export type VerifyResult = {
  ok: boolean;
  reason?:
    | "invalid_token_format"
    | "invalid_signature"
    | "invalid_payload"
    | "expired"
    | "not_found"
    | "tampered"
    | "wrong_provider"
    | "already_redeemed"
    | "cancelled"
    | "not_valid"
    | "not_redeemable"
    | "not_a_provider"
    | "unauthenticated"
    | "server_misconfigured"
    | "server_error";
  redeemed_at?: string;
  voucher?: {
    id: string;
    code: string;
    value_l: number;
    offer_title_sq?: string;
    offer_title_en?: string;
    employee_name?: string;
    redeemed_at?: string;
  };
};

export async function verifyVoucher(input: {
  token?: string;
  code?: string;
}): Promise<VerifyResult> {
  const { data, error } = await supabase.functions.invoke("voucher-verify", {
    body: input,
  });
  if (error) {
    // supabase-js throws on non-2xx; the function still returns JSON in many cases
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const j = await ctx.json();
        return j as VerifyResult;
      } catch {
        /* fall through */
      }
    }
    return { ok: false, reason: "server_error" };
  }
  return data as VerifyResult;
}
