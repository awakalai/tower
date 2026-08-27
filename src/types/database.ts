export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          reference_code: string;
          title: Json;
          description: Json;
          property_type: Database["public"]["Enums"]["property_type"];
          status: Database["public"]["Enums"]["property_status"];
          price: number;
          currency: string;
          area_m2: number;
          address: string;
          latitude: number;
          longitude: number;
          location: unknown;
          image_url: string;
          gallery: string[];
          payment_options: Database["public"]["Enums"]["payment_method"][];
          completion_percent: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code?: string;
          title: Json;
          description?: Json;
          property_type: Database["public"]["Enums"]["property_type"];
          status?: Database["public"]["Enums"]["property_status"];
          price: number;
          currency?: string;
          area_m2: number;
          address: string;
          latitude: number;
          longitude: number;
          location?: unknown;
          image_url: string;
          gallery?: string[];
          payment_options?: Database["public"]["Enums"]["payment_method"][];
          completion_percent?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          property_id: string | null;
          category: Database["public"]["Enums"]["expense_category"];
          amount: number;
          currency: string;
          incurred_on: string;
          vendor: string;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          category: Database["public"]["Enums"]["expense_category"];
          amount: number;
          currency?: string;
          incurred_on: string;
          vendor: string;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          receipt_number: string;
          property_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_address: string;
          payment_type: Database["public"]["Enums"]["payment_method"];
          amount: number;
          contract_total: number | null;
          balance_due: number;
          currency: string;
          payment_date: string;
          next_due_date: string | null;
          installment_number: number | null;
          notes: string;
          authorized_by: string;
          issued_by: string | null;
          status: Database["public"]["Enums"]["receipt_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          receipt_number?: string;
          property_id?: string | null;
          customer_name: string;
          customer_phone?: string;
          customer_address?: string;
          payment_type: Database["public"]["Enums"]["payment_method"];
          amount: number;
          contract_total?: number | null;
          balance_due?: number;
          currency?: string;
          payment_date: string;
          next_due_date?: string | null;
          installment_number?: number | null;
          notes?: string;
          authorized_by: string;
          issued_by?: string | null;
          status?: Database["public"]["Enums"]["receipt_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["receipts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      property_type: "land" | "house" | "apartment";
      property_status: "available" | "reserved" | "sold" | "construction";
      payment_method: "cash" | "installment" | "advance";
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "permits"
        | "operations"
        | "other";
      receipt_status: "issued" | "voided";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"];
