export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      approvals: {
        Row: {
          action: string
          approval_id: number
          approver_id: number
          comments: string | null
          decision_date: string
          request_id: number
          ticket_option_id: number | null
        }
        Insert: {
          action: string
          approval_id?: number
          approver_id: number
          comments?: string | null
          decision_date?: string
          request_id: number
          ticket_option_id?: number | null
        }
        Update: {
          action?: string
          approval_id?: number
          approver_id?: number
          comments?: string | null
          decision_date?: string
          request_id?: number
          ticket_option_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          after_state: Json
          before_state: Json
          ip_address: string
          log_id: number
          request_id: number
          timestamp: string
          user_id: number
        }
        Insert: {
          action_type: string
          after_state: Json
          before_state: Json
          ip_address: string
          log_id?: number
          request_id: number
          timestamp?: string
          user_id: number
        }
        Update: {
          action_type?: string
          after_state?: Json
          before_state?: Json
          ip_address?: string
          log_id?: number
          request_id?: number
          timestamp?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          message: string
          read: boolean
          request_id: number | null
          title: string
          type: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          read?: boolean
          request_id?: number | null
          title: string
          type: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          read?: boolean
          request_id?: number | null
          title?: string
          type?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          approval_chain: Json
          created_at: string
          current_status: string
          request_id: number
          requester_id: number
          selected_ticket_id: number | null
          travel_details: Json
          updated_at: string
          version_history: Json
        }
        Insert: {
          approval_chain: Json
          created_at?: string
          current_status: string
          request_id?: number
          requester_id: number
          selected_ticket_id?: number | null
          travel_details: Json
          updated_at?: string
          version_history: Json
        }
        Update: {
          approval_chain?: Json
          created_at?: string
          current_status?: string
          request_id?: number
          requester_id?: number
          selected_ticket_id?: number | null
          travel_details?: Json
          updated_at?: string
          version_history?: Json
        }
        Relationships: [
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_options: {
        Row: {
          added_by_admin_id: number
          added_date: string
          arrival_time: string | null
          carrier: string
          carrier_rating: number | null
          class: string
          departure_time: string | null
          flight_duration: string | null
          option_id: number
          price: number
          refundable: boolean
          request_id: number
          stops: number | null
          validity_end: string
          validity_start: string
        }
        Insert: {
          added_by_admin_id: number
          added_date?: string
          arrival_time?: string | null
          carrier: string
          carrier_rating?: number | null
          class: string
          departure_time?: string | null
          flight_duration?: string | null
          option_id?: number
          price: number
          refundable?: boolean
          request_id: number
          stops?: number | null
          validity_end: string
          validity_start: string
        }
        Update: {
          added_by_admin_id?: number
          added_date?: string
          arrival_time?: string | null
          carrier?: string
          carrier_rating?: number | null
          class?: string
          departure_time?: string | null
          flight_duration?: string | null
          option_id?: number
          price?: number
          refundable?: boolean
          request_id?: number
          stops?: number | null
          validity_end?: string
          validity_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_options_added_by_admin_id_fkey"
            columns: ["added_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_options_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          department: string
          email: string
          hierarchy_chain: number[]
          id: number
          name: string
          role: string
        }
        Insert: {
          avatar?: string | null
          department: string
          email: string
          hierarchy_chain: number[]
          id?: number
          name: string
          role: string
        }
        Update: {
          avatar?: string | null
          department?: string
          email?: string
          hierarchy_chain?: number[]
          id?: number
          name?: string
          role?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
