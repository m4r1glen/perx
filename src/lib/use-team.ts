import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CompanyInvitation = {
  id: string;
  company_id: string;
  email: string;
  invited_by: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  token: string;
  created_at: string;
  expires_at: string;
};

export type CompanyJoinRequest = {
  id: string;
  company_id: string;
  employee_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  created_at: string;
  decided_at: string | null;
};

export type TeamEmployee = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  department: string | null;
};

export type Applicant = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  department: string | null;
};

export function useCompanyInvitations(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companyInvitations", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<CompanyInvitation[]> => {
      const { data, error } = await (supabase.from("company_invitations") as any)
        .select("id, company_id, email, invited_by, status, token, created_at, expires_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CompanyInvitation[];
    },
  });
}

export function useCompanyJoinRequests(companyId: string | undefined) {
  return useQuery({
    queryKey: ["companyJoinRequests", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<{ request: CompanyJoinRequest; applicant: Applicant | null }[]> => {
      const { data, error } = await (supabase.rpc as any)("list_company_applicants");
      if (error) throw error;
      const rows = (data as any[]) ?? [];
      return rows.map((r) => ({
        request: {
          id: r.request_id,
          company_id: r.company_id,
          employee_id: r.employee_id,
          status: r.status,
          message: r.message,
          created_at: r.request_created_at,
          decided_at: r.decided_at,
        } as CompanyJoinRequest,
        applicant: {
          id: r.employee_id,
          full_name: r.full_name,
          job_title: r.job_title,
          department: r.department,
        } as Applicant,
      }));
    },
  });
}

export function useMyJoinRequest(userId: string | undefined) {
  return useQuery({
    queryKey: ["myJoinRequest", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("company_join_requests") as any)
        .select("id, company_id, status, created_at")
        .eq("employee_id", userId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; company_id: string; status: string; created_at: string } | null;
    },
  });
}

export function useEmployeePointsBalances(employeeIds: string[] | undefined) {
  return useQuery({
    queryKey: ["pointsBalances", employeeIds?.join(",")],
    enabled: !!employeeIds && employeeIds.length > 0,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("employee_id, delta")
        .in("employee_id", employeeIds!);
      if (error) throw error;
      const m = new Map<string, number>();
      ((data as any) ?? []).forEach((row: any) => {
        m.set(row.employee_id, (m.get(row.employee_id) ?? 0) + (row.delta ?? 0));
      });
      return m;
    },
  });
}

export function useCompaniesList() {
  return useQuery({
    queryKey: ["companiesList"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("public_companies")
        .select("id, name, industry, brand_primary")
        .order("name");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        name: string;
        industry: string | null;
        brand_primary: string | null;
      }[];
    },
  });
}
