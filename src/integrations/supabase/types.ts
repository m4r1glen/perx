export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      companies: {
        Row: {
          brand_primary: string | null;
          brand_secondary: string | null;
          created_at: string;
          employee_count: number | null;
          employee_email_domains: string[];
          id: string;
          industry: string | null;
          monthly_budget_per_employee_lek: number | null;
          name: string;
          owner_id: string;
          plan_amount_l: number | null;
          plan_employees_count: number | null;
          plan_paid_at: string | null;
          plan_renews_at: string | null;
          plan_status: string;
          updated_at: string;
        };
        Insert: {
          brand_primary?: string | null;
          brand_secondary?: string | null;
          created_at?: string;
          employee_count?: number | null;
          employee_email_domains?: string[];
          id?: string;
          industry?: string | null;
          monthly_budget_per_employee_lek?: number | null;
          name: string;
          owner_id: string;
          plan_amount_l?: number | null;
          plan_employees_count?: number | null;
          plan_paid_at?: string | null;
          plan_renews_at?: string | null;
          plan_status?: string;
          updated_at?: string;
        };
        Update: {
          brand_primary?: string | null;
          brand_secondary?: string | null;
          created_at?: string;
          employee_count?: number | null;
          employee_email_domains?: string[];
          id?: string;
          industry?: string | null;
          monthly_budget_per_employee_lek?: number | null;
          name?: string;
          owner_id?: string;
          plan_amount_l?: number | null;
          plan_employees_count?: number | null;
          plan_paid_at?: string | null;
          plan_renews_at?: string | null;
          plan_status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_invitations: {
        Row: {
          company_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          status: string;
          token: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          status?: string;
          token?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_invitations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "public_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_join_requests: {
        Row: {
          company_id: string;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          employee_id: string;
          id: string;
          message: string | null;
          status: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          employee_id: string;
          id?: string;
          message?: string | null;
          status?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          employee_id?: string;
          id?: string;
          message?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_join_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_join_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "public_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_join_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_join_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offer_locations: {
        Row: {
          address: string | null;
          city: string;
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          offer_id: string;
          provider_id: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city: string;
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          offer_id: string;
          provider_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string;
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          offer_id?: string;
          provider_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offer_locations_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offer_locations_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          category: string;
          created_at: string;
          description_en: string | null;
          description_sq: string | null;
          id: string;
          mood: string[];
          price_l: number;
          provider_id: string;
          title_en: string;
          title_sq: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description_en?: string | null;
          description_sq?: string | null;
          id?: string;
          mood?: string[];
          price_l: number;
          provider_id: string;
          title_en: string;
          title_sq: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description_en?: string | null;
          description_sq?: string | null;
          id?: string;
          mood?: string[];
          price_l?: number;
          provider_id?: string;
          title_en?: string;
          title_sq?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      points_ledger: {
        Row: {
          company_id: string | null;
          created_at: string;
          delta: number;
          employee_id: string;
          granted_by: string | null;
          id: string;
          reason: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          delta: number;
          employee_id: string;
          granted_by?: string | null;
          id?: string;
          reason: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          delta?: number;
          employee_id?: string;
          granted_by?: string | null;
          id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_ledger_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "public_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          company_id: string | null;
          company_status: string;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string | null;
          id: string;
          interests: string[];
          job_title: string | null;
          last_active_date: string | null;
          onboarding_complete: boolean;
          role: Database["public"]["Enums"]["user_role"] | null;
          streak_count: number;
          updated_at: string;
        };
        Insert: {
          company_id?: string | null;
          company_status?: string;
          created_at?: string;
          department?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          interests?: string[];
          job_title?: string | null;
          last_active_date?: string | null;
          onboarding_complete?: boolean;
          role?: Database["public"]["Enums"]["user_role"] | null;
          streak_count?: number;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          company_status?: string;
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          interests?: string[];
          job_title?: string | null;
          last_active_date?: string | null;
          onboarding_complete?: boolean;
          role?: Database["public"]["Enums"]["user_role"] | null;
          streak_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "public_companies";
            referencedColumns: ["id"];
          },
        ];
      };
      provider_contacts: {
        Row: {
          contact_email: string | null;
          provider_id: string;
          updated_at: string;
        };
        Insert: {
          contact_email?: string | null;
          provider_id: string;
          updated_at?: string;
        };
        Update: {
          contact_email?: string | null;
          provider_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_contacts_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: true;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      providers: {
        Row: {
          brand_color: string | null;
          business_name: string;
          category: string | null;
          city: string | null;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number | null;
          logo_url: string | null;
          longitude: number | null;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          brand_color?: string | null;
          business_name: string;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          logo_url?: string | null;
          longitude?: number | null;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          brand_color?: string | null;
          business_name?: string;
          category?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          logo_url?: string | null;
          longitude?: number | null;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      selections: {
        Row: {
          created_at: string;
          employee_id: string;
          id: string;
          offer_ids: string[];
          status: Database["public"]["Enums"]["selection_status"];
          total_l: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          id?: string;
          offer_ids?: string[];
          status?: Database["public"]["Enums"]["selection_status"];
          total_l?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          id?: string;
          offer_ids?: string[];
          status?: Database["public"]["Enums"]["selection_status"];
          total_l?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      transfers: {
        Row: {
          created_at: string;
          gift_message: string | null;
          id: string;
          offer_ids: string[];
          points_amount: number;
          recipient_id: string;
          sender_id: string;
          status: Database["public"]["Enums"]["transfer_status"];
          type: Database["public"]["Enums"]["transfer_type"];
        };
        Insert: {
          created_at?: string;
          gift_message?: string | null;
          id?: string;
          offer_ids?: string[];
          points_amount?: number;
          recipient_id: string;
          sender_id: string;
          status?: Database["public"]["Enums"]["transfer_status"];
          type: Database["public"]["Enums"]["transfer_type"];
        };
        Update: {
          created_at?: string;
          gift_message?: string | null;
          id?: string;
          offer_ids?: string[];
          points_amount?: number;
          recipient_id?: string;
          sender_id?: string;
          status?: Database["public"]["Enums"]["transfer_status"];
          type?: Database["public"]["Enums"]["transfer_type"];
        };
        Relationships: [];
      };
      vouchers: {
        Row: {
          code: string;
          created_at: string;
          employee_id: string;
          expires_at: string;
          id: string;
          offer_id: string;
          provider_id: string;
          redeemed_at: string | null;
          redeemed_by_provider_id: string | null;
          selection_id: string;
          status: Database["public"]["Enums"]["voucher_status"];
          value_l: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          employee_id: string;
          expires_at: string;
          id?: string;
          offer_id: string;
          provider_id: string;
          redeemed_at?: string | null;
          redeemed_by_provider_id?: string | null;
          selection_id: string;
          status?: Database["public"]["Enums"]["voucher_status"];
          value_l: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          employee_id?: string;
          expires_at?: string;
          id?: string;
          offer_id?: string;
          provider_id?: string;
          redeemed_at?: string | null;
          redeemed_by_provider_id?: string | null;
          selection_id?: string;
          status?: Database["public"]["Enums"]["voucher_status"];
          value_l?: number;
        };
        Relationships: [
          {
            foreignKeyName: "vouchers_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_redeemed_by_provider_id_fkey";
            columns: ["redeemed_by_provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vouchers_selection_id_fkey";
            columns: ["selection_id"];
            isOneToOne: false;
            referencedRelation: "selections";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_companies: {
        Row: {
          brand_primary: string | null;
          id: string | null;
          industry: string | null;
          name: string | null;
        };
        Insert: {
          brand_primary?: string | null;
          id?: string | null;
          industry?: string | null;
          name?: string | null;
        };
        Update: {
          brand_primary?: string | null;
          id?: string | null;
          industry?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string };
      approve_join_request: {
        Args: { _request_id: string };
        Returns: undefined;
      };
      generate_voucher_code: { Args: never; Returns: string };
      grant_points: {
        Args: { _amount: number; _employee_id: string; _reason: string };
        Returns: string;
      };
      is_employer_of: { Args: { _employee: string }; Returns: boolean };
      list_colleagues: {
        Args: never;
        Returns: {
          company_id: string;
          department: string;
          full_name: string;
          id: string;
          job_title: string;
          role: Database["public"]["Enums"]["user_role"];
        }[];
      };
      list_company_applicants: {
        Args: never;
        Returns: {
          company_id: string;
          decided_at: string;
          department: string;
          employee_id: string;
          full_name: string;
          job_title: string;
          message: string;
          request_created_at: string;
          request_id: string;
          status: string;
        }[];
      };
      list_company_employees: {
        Args: never;
        Returns: {
          company_status: string;
          department: string;
          full_name: string;
          id: string;
          job_title: string;
          role: Database["public"]["Enums"]["user_role"];
        }[];
      };
      my_company_id: { Args: never; Returns: string };
      redeem_voucher: {
        Args: { _provider_id: string; _voucher_id: string };
        Returns: {
          code: string;
          created_at: string;
          employee_id: string;
          expires_at: string;
          id: string;
          offer_id: string;
          provider_id: string;
          redeemed_at: string | null;
          redeemed_by_provider_id: string | null;
          selection_id: string;
          status: Database["public"]["Enums"]["voucher_status"];
          value_l: number;
        };
        SetofOptions: {
          from: "*";
          to: "vouchers";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reject_join_request: { Args: { _request_id: string }; Returns: undefined };
      remove_employee: { Args: { _employee_id: string }; Returns: undefined };
      request_join_company: {
        Args: { _company_id: string; _message: string };
        Returns: string;
      };
      revoke_invitation: {
        Args: { _invitation_id: string };
        Returns: undefined;
      };
      send_gift: {
        Args: {
          _message: string;
          _offer_ids: string[];
          _points: number;
          _recipient: string;
          _type: Database["public"]["Enums"]["transfer_type"];
        };
        Returns: string;
      };
    };
    Enums: {
      selection_status: "pending" | "approved" | "paid" | "rejected";
      transfer_status: "sent" | "claimed";
      transfer_type: "points" | "package";
      user_role: "employee" | "employer" | "provider";
      voucher_status: "valid" | "redeemed" | "expired" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      selection_status: ["pending", "approved", "paid", "rejected"],
      transfer_status: ["sent", "claimed"],
      transfer_type: ["points", "package"],
      user_role: ["employee", "employer", "provider"],
      voucher_status: ["valid", "redeemed", "expired", "cancelled"],
    },
  },
} as const;
