import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/i18n";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role | null;
  onboarding_complete: boolean;
  interests: string[];
  job_title: string | null;
  department: string | null;
  streak_count: number;
  last_active_date: string | null;
  company_id: string | null;
  company_status: "none" | "pending" | "active";
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return null;
      const { data, error } = await (supabase.from("profiles") as any)
        .select(
          "id, email, full_name, role, onboarding_complete, interests, job_title, department, streak_count, last_active_date, company_id, company_status",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    staleTime: 30_000,
  });
}

export function dashboardPathForRole(
  role: Role | null | undefined,
): "/app/employee" | "/app/employer" | "/app/provider" {
  switch (role) {
    case "employer":
      return "/app/employer";
    case "provider":
      return "/app/provider";
    default:
      return "/app/employee";
  }
}
