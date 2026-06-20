import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Colleague = {
  id: string;
  full_name: string | null;
  email?: string | null;
  job_title: string | null;
  department: string | null;
};

export type Transfer = {
  id: string;
  sender_id: string;
  recipient_id: string;
  type: "points" | "package";
  points_amount: number;
  offer_ids: string[];
  gift_message: string | null;
  status: "sent" | "claimed";
  created_at: string;
};

export type TransferWithPeople = Transfer & {
  sender: Colleague | null;
  recipient: Colleague | null;
};

export function useColleagues(myId: string | undefined) {
  return useQuery({
    queryKey: ["colleagues", myId],
    enabled: !!myId,
    queryFn: async (): Promise<Colleague[]> => {
      // Colleagues are returned by a SECURITY DEFINER RPC that omits email
      // to prevent same-company email harvesting.
      const { data, error } = await (supabase as any).rpc("list_colleagues");
      if (error) throw error;
      return (
        (data ?? []) as Array<{
          id: string;
          full_name: string | null;
          job_title: string | null;
          department: string | null;
          role: string | null;
        }>
      )
        .filter((p) => p.role !== "provider")
        .map((p) => ({
          id: p.id,
          full_name: p.full_name,
          job_title: p.job_title,
          department: p.department,
        }));
    },
    staleTime: 30_000,
  });
}

export function useMyTransfers(myId: string | undefined) {
  return useQuery({
    queryKey: ["transfers", myId],
    enabled: !!myId,
    queryFn: async (): Promise<TransferWithPeople[]> => {
      const { data: transfers, error } = await supabase
        .from("transfers")
        .select("*")
        .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (transfers ?? []) as Transfer[];
      const peopleIds = Array.from(new Set(rows.flatMap((r) => [r.sender_id, r.recipient_id])));
      const people: Record<string, Colleague> = {};
      if (peopleIds.length) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("id, full_name, job_title, department")
          .in("id", peopleIds);
        (ps ?? []).forEach((p: any) => {
          people[p.id] = {
            id: p.id,
            full_name: p.full_name,
            job_title: p.job_title,
            department: p.department,
          };
        });
      }
      return rows.map((r) => ({
        ...r,
        sender: people[r.sender_id] ?? null,
        recipient: people[r.recipient_id] ?? null,
      }));
    },
    staleTime: 15_000,
  });
}

export type SendGiftArgs = {
  recipientId: string;
  type: "points" | "package";
  points?: number;
  offerIds?: string[];
  message?: string;
};

export function useSendGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: SendGiftArgs): Promise<string> => {
      const { data, error } = await supabase.rpc("send_gift", {
        _recipient: args.recipientId,
        _type: args.type,
        _points: args.points ?? 0,
        _offer_ids: args.offerIds ?? [],
        _message: args.message ?? "",
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["points"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      qc.invalidateQueries({ queryKey: ["selections"] });
    },
  });
}

export function useClaimGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from("transfers")
        .update({ status: "claimed" })
        .eq("id", transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function displayName(c: Colleague | null | undefined): string {
  if (!c) return "—";
  return (c.full_name?.trim() || c.email?.split("@")[0] || "—").trim();
}

export function initials(c: Colleague | null | undefined): string {
  const name = displayName(c);
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
