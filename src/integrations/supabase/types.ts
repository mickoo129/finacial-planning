export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      mpf_funds: {
        Row: {
          category: string | null
          created_at: string
          data_date: string | null
          etnet_fund_id: string
          etnet_plan_id: string | null
          etnet_provider_id: string | null
          fee_ratio: number | null
          fer: number | null
          fund_size: number | null
          id: string
          launch_date: string | null
          mpfa_name: string | null
          name: string
          name_zh: string | null
          return_10y: number | null
          return_1m: number | null
          return_1y: number | null
          return_2021: number | null
          return_2022: number | null
          return_2023: number | null
          return_2024: number | null
          return_2025: number | null
          return_3m: number | null
          return_3y: number | null
          return_5y: number | null
          return_since_launch: number | null
          return_ytd: number | null
          risk_level: string | null
          scheme_name: string | null
          sub_category: string | null
          trustee_name: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          data_date?: string | null
          etnet_fund_id: string
          etnet_plan_id?: string | null
          etnet_provider_id?: string | null
          fee_ratio?: number | null
          fer?: number | null
          fund_size?: number | null
          id?: string
          launch_date?: string | null
          mpfa_name?: string | null
          name: string
          name_zh?: string | null
          return_10y?: number | null
          return_1m?: number | null
          return_1y?: number | null
          return_2021?: number | null
          return_2022?: number | null
          return_2023?: number | null
          return_2024?: number | null
          return_2025?: number | null
          return_3m?: number | null
          return_3y?: number | null
          return_5y?: number | null
          return_since_launch?: number | null
          return_ytd?: number | null
          risk_level?: string | null
          scheme_name?: string | null
          sub_category?: string | null
          trustee_name?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          data_date?: string | null
          etnet_fund_id?: string
          etnet_plan_id?: string | null
          etnet_provider_id?: string | null
          fee_ratio?: number | null
          fer?: number | null
          fund_size?: number | null
          id?: string
          launch_date?: string | null
          mpfa_name?: string | null
          name?: string
          name_zh?: string | null
          return_10y?: number | null
          return_1m?: number | null
          return_1y?: number | null
          return_2021?: number | null
          return_2022?: number | null
          return_2023?: number | null
          return_2024?: number | null
          return_2025?: number | null
          return_3m?: number | null
          return_3y?: number | null
          return_5y?: number | null
          return_since_launch?: number | null
          return_ytd?: number | null
          risk_level?: string | null
          scheme_name?: string | null
          sub_category?: string | null
          trustee_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mpf_scrape_logs: {
        Row: {
          created_at: string
          error_message: string | null
          funds_count: number | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          funds_count?: number | null
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          funds_count?: number | null
          id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
