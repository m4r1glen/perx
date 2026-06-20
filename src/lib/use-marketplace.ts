import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Offer = {
  id: string;
  provider_id: string;
  title_sq: string;
  title_en: string;
  description_sq: string | null;
  description_en: string | null;
  price_l: number;
  category: string;
  mood: string[];
};

export type Provider = {
  id: string;
  owner_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  description: string | null;
  brand_color?: string | null;
  logo_url?: string | null;
};

export type Selection = {
  id: string;
  employee_id: string;
  offer_ids: string[];
  total_l: number;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string | null;
  employee_count: number | null;
  monthly_budget_per_employee_lek: number | null;
  brand_primary: string | null;
  brand_secondary: string | null;
  employee_email_domains: string[] | null;
  plan_status: "trial" | "active" | null;
};

export function useOffers() {
  return useQuery({
    queryKey: ["offers"],
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, provider_id, title_sq, title_en, description_sq, description_en, price_l, category, mood",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
  });
}

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, owner_id, business_name, category, city, description, brand_color, logo_url");
      if (error) throw error;
      return (data ?? []) as Provider[];
    },
  });
}

export function useMySelections(userId: string | undefined) {
  return useQuery({
    queryKey: ["selections", "mine", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Selection[]> => {
      const { data, error } = await supabase
        .from("selections")
        .select("id, employee_id, offer_ids, total_l, status, created_at")
        .eq("employee_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Selection[];
    },
  });
}

export function useMyPoints(userId: string | undefined) {
  return useQuery({
    queryKey: ["points", userId],
    enabled: !!userId,
    queryFn: async (): Promise<{ balance: number; entries: LedgerEntry[] }> => {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("id, delta, reason, created_at")
        .eq("employee_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const entries = (data ?? []) as LedgerEntry[];
      const balance = entries.reduce((s, e) => s + e.delta, 0);
      return { balance, entries };
    },
  });
}

export function useMyCompany(ownerId: string | undefined) {
  return useQuery({
    queryKey: ["company", "mine", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, industry, employee_count, monthly_budget_per_employee_lek, brand_primary, brand_secondary, employee_email_domains, plan_status",
        )
        .eq("owner_id", ownerId!)
        .maybeSingle();
      if (error) throw error;
      return data as Company | null;
    },
  });
}

export function useCompanyEmployees(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companyEmployees", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      // Use SECURITY DEFINER RPC that excludes employee email addresses.
      const { data, error } = await (supabase.rpc as any)("list_company_employees");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        full_name: string | null;
        job_title: string | null;
        department: string | null;
      }[];
    },
  });
}

export function useCompanySelections(employeeIds: string[] | undefined) {
  return useQuery({
    queryKey: ["selections", "company", employeeIds?.join(",")],
    enabled: !!employeeIds && employeeIds.length > 0,
    queryFn: async (): Promise<Selection[]> => {
      const { data, error } = await supabase
        .from("selections")
        .select("id, employee_id, offer_ids, total_l, status, created_at")
        .in("employee_id", employeeIds!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Selection[];
    },
  });
}

export function useMyProvider(ownerId: string | undefined) {
  return useQuery({
    queryKey: ["provider", "mine", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<Provider | null> => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, owner_id, business_name, category, city, description, brand_color, logo_url")
        .eq("owner_id", ownerId!)
        .maybeSingle();
      if (error) throw error;
      return data as Provider | null;
    },
  });
}

/**
 * Single source of truth for number formatting across the app.
 * Albanian convention: space as thousands separator, " L" suffix for Lek.
 * Applied to EVERY amount (including 4-digit ones) so 6300 → "6 300 L"
 * and 1200 → "1 200 L", matching the financial-precision feel.
 */
export function formatNumber(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatLek(n: number): string {
  return formatNumber(n) + " L";
}

export function formatEur(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  return sign + "€" + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
