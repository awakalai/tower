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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          id: string
          incurred_on: string
          notes: string
          property_id: string | null
          updated_at: string
          vendor: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incurred_on?: string
          notes?: string
          property_id?: string | null
          updated_at?: string
          vendor: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incurred_on?: string
          notes?: string
          property_id?: string | null
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          area_m2: number
          completion_percent: number
          created_at: string
          created_by: string | null
          currency: string
          description: Json
          gallery: string[]
          id: string
          image_url: string
          is_published: boolean
          latitude: number
          location: unknown
          longitude: number
          payment_options: Database["public"]["Enums"]["payment_method"][]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          reference_code: string
          status: Database["public"]["Enums"]["property_status"]
          title: Json
          updated_at: string
        }
        Insert: {
          address: string
          area_m2: number
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          gallery?: string[]
          id?: string
          image_url: string
          is_published?: boolean
          latitude: number
          location?: unknown
          longitude: number
          payment_options?: Database["public"]["Enums"]["payment_method"][]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          reference_code?: string
          status?: Database["public"]["Enums"]["property_status"]
          title: Json
          updated_at?: string
        }
        Update: {
          address?: string
          area_m2?: number
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          gallery?: string[]
          id?: string
          image_url?: string
          is_published?: boolean
          latitude?: number
          location?: unknown
          longitude?: number
          payment_options?: Database["public"]["Enums"]["payment_method"][]
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          reference_code?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          authorized_by: string
          balance_due: number
          contract_total: number | null
          created_at: string
          currency: string
          customer_address: string
          customer_name: string
          customer_phone: string
          id: string
          installment_number: number | null
          issued_by: string | null
          next_due_date: string | null
          notes: string
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_method"]
          property_id: string | null
          receipt_number: string
          status: Database["public"]["Enums"]["receipt_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          authorized_by: string
          balance_due?: number
          contract_total?: number | null
          created_at?: string
          currency?: string
          customer_address?: string
          customer_name: string
          customer_phone?: string
          id?: string
          installment_number?: number | null
          issued_by?: string | null
          next_due_date?: string | null
          notes?: string
          payment_date?: string
          payment_type: Database["public"]["Enums"]["payment_method"]
          property_id?: string | null
          receipt_number?: string
          status?: Database["public"]["Enums"]["receipt_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          authorized_by?: string
          balance_due?: number
          contract_total?: number | null
          created_at?: string
          currency?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          installment_number?: number | null
          issued_by?: string | null
          next_due_date?: string | null
          notes?: string
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_method"]
          property_id?: string | null
          receipt_number?: string
          status?: Database["public"]["Enums"]["receipt_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "permits"
        | "operations"
        | "other"
      payment_method: "cash" | "installment" | "advance"
      property_status: "available" | "reserved" | "sold" | "construction"
      property_type: "land" | "house" | "apartment"
      receipt_status: "issued" | "voided"
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
    Enums: {
      expense_category: [
        "materials",
        "labor",
        "equipment",
        "permits",
        "operations",
        "other",
      ],
      payment_method: ["cash", "installment", "advance"],
      property_status: ["available", "reserved", "sold", "construction"],
      property_type: ["land", "house", "apartment"],
      receipt_status: ["issued", "voided"],
    },
  },
} as const

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"]
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"]

