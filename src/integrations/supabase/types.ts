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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      discrepancies: {
        Row: {
          account_name: string
          amount: number | null
          created_at: string
          discrepancy_type: string | null
          equifax_status: string | null
          experian_status: string | null
          has_conflict: boolean | null
          id: string
          recommended_action: string | null
          report_id: string
          resolved: boolean | null
          severity: string | null
          success_probability: number | null
          transunion_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          amount?: number | null
          created_at?: string
          discrepancy_type?: string | null
          equifax_status?: string | null
          experian_status?: string | null
          has_conflict?: boolean | null
          id?: string
          recommended_action?: string | null
          report_id: string
          resolved?: boolean | null
          severity?: string | null
          success_probability?: number | null
          transunion_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          amount?: number | null
          created_at?: string
          discrepancy_type?: string | null
          equifax_status?: string | null
          experian_status?: string | null
          has_conflict?: boolean | null
          id?: string
          recommended_action?: string | null
          report_id?: string
          resolved?: boolean | null
          severity?: string | null
          success_probability?: number | null
          transunion_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discrepancies_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          account_name: string | null
          bureau: string
          content: string
          created_at: string
          discrepancy_id: string | null
          id: string
          report_id: string | null
          resolution_status: string | null
          response_content: string | null
          response_due_date: string | null
          sent_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          bureau: string
          content: string
          created_at?: string
          discrepancy_id?: string | null
          id?: string
          report_id?: string | null
          resolution_status?: string | null
          response_content?: string | null
          response_due_date?: string | null
          sent_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          bureau?: string
          content?: string
          created_at?: string
          discrepancy_id?: string | null
          id?: string
          report_id?: string | null
          resolution_status?: string | null
          response_content?: string | null
          response_due_date?: string | null
          sent_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_discrepancy_id_fkey"
            columns: ["discrepancy_id"]
            isOneToOne: false
            referencedRelation: "discrepancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notification_analysis_complete: boolean | null
          notification_email_enabled: boolean | null
          notification_response_received: boolean | null
          phone: string | null
          ssn_last_four: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notification_analysis_complete?: boolean | null
          notification_email_enabled?: boolean | null
          notification_response_received?: boolean | null
          phone?: string | null
          ssn_last_four?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notification_analysis_complete?: boolean | null
          notification_email_enabled?: boolean | null
          notification_response_received?: boolean | null
          phone?: string | null
          ssn_last_four?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          equifax_file_path: string | null
          experian_file_path: string | null
          id: string
          potential_score_increase: number | null
          raw_analysis: Json | null
          status: string
          total_discrepancies: number | null
          total_letters: number | null
          transunion_file_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equifax_file_path?: string | null
          experian_file_path?: string | null
          id?: string
          potential_score_increase?: number | null
          raw_analysis?: Json | null
          status?: string
          total_discrepancies?: number | null
          total_letters?: number | null
          transunion_file_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equifax_file_path?: string | null
          experian_file_path?: string | null
          id?: string
          potential_score_increase?: number | null
          raw_analysis?: Json | null
          status?: string
          total_discrepancies?: number | null
          total_letters?: number | null
          transunion_file_path?: string | null
          updated_at?: string
          user_id?: string
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
