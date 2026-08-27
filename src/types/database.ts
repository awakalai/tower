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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          new_values: Json | null
          old_values: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          code: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          latitude: number | null
          location: unknown
          longitude: number | null
          name: string
          organization_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          code: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name: string
          organization_id: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          code?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: string
          organization_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string
          alternate_phone: string
          assigned_to: string | null
          branch_id: string | null
          company_name: string
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          created_by: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          nationality: string
          notes: string
          organization_id: string
          phone: string
          source: Database["public"]["Enums"]["lead_source"]
          updated_at: string
        }
        Insert: {
          address?: string
          alternate_phone?: string
          assigned_to?: string | null
          branch_id?: string | null
          company_name?: string
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          created_by?: string | null
          email?: string
          first_name: string
          id?: string
          last_name?: string
          nationality?: string
          notes?: string
          organization_id?: string
          phone?: string
          source?: Database["public"]["Enums"]["lead_source"]
          updated_at?: string
        }
        Update: {
          address?: string
          alternate_phone?: string
          assigned_to?: string | null
          branch_id?: string | null
          company_name?: string
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string
          notes?: string
          organization_id?: string
          phone?: string
          source?: Database["public"]["Enums"]["lead_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          closed_at: string | null
          contact_id: string
          contract_number: string
          created_at: string
          created_by: string | null
          currency: string
          discount: number
          down_payment: number
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          project_id: string | null
          property_id: string | null
          signed_on: string | null
          status: Database["public"]["Enums"]["deal_status"]
          total_value: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          closed_at?: string | null
          contact_id: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          down_payment?: number
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          project_id?: string | null
          property_id?: string | null
          signed_on?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_value: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          closed_at?: string | null
          contact_id?: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount?: number
          down_payment?: number
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          project_id?: string | null
          property_id?: string | null
          signed_on?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          mime_type: string
          name: string
          organization_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          mime_type: string
          name: string
          organization_id?: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          attachment_url: string | null
          branch_id: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          id: string
          incurred_on: string
          notes: string
          organization_id: string
          project_id: string | null
          property_id: string | null
          updated_at: string
          vendor: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          attachment_url?: string | null
          branch_id?: string | null
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incurred_on?: string
          notes?: string
          organization_id?: string
          project_id?: string | null
          property_id?: string | null
          updated_at?: string
          vendor: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          attachment_url?: string | null
          branch_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          incurred_on?: string
          notes?: string
          organization_id?: string
          project_id?: string | null
          property_id?: string | null
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          locale: string
          message: string
          name: string
          organization_id: string
          phone: string
          property_id: string
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          message?: string
          name: string
          organization_id: string
          phone?: string
          property_id: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          message?: string
          name?: string
          organization_id?: string
          phone?: string
          property_id?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deal_id: string
          due_date: string
          id: string
          notes: string
          organization_id: string
          paid_amount: number
          paid_at: string | null
          receipt_id: string | null
          sequence_number: number
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deal_id: string
          due_date: string
          id?: string
          notes?: string
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          receipt_id?: string | null
          sequence_number: number
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deal_id?: string
          due_date?: string
          id?: string
          notes?: string
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          receipt_id?: string | null
          sequence_number?: number
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_financial_summary"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "installments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          budget_max: number | null
          budget_min: number | null
          contact_id: string
          created_at: string
          created_by: string | null
          currency: string
          desired_property_types: Database["public"]["Enums"]["property_type"][]
          id: string
          lost_reason: string
          next_follow_up_at: string | null
          notes: string
          organization_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          desired_property_types?: Database["public"]["Enums"]["property_type"][]
          id?: string
          lost_reason?: string
          next_follow_up_at?: string | null
          notes?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          desired_property_types?: Database["public"]["Enums"]["property_type"][]
          id?: string
          lost_reason?: string
          next_follow_up_at?: string | null
          notes?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          branch_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          branch_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          branch_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          branch_id: string | null
          is_active: boolean
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          created_at: string
          default_currency: string
          email: string
          id: string
          is_active: boolean
          legal_name: string
          logo_url: string | null
          name: string
          phone: string
          registration_number: string
          slug: string
          tax_number: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          default_currency?: string
          email?: string
          id?: string
          is_active?: boolean
          legal_name?: string
          logo_url?: string | null
          name: string
          phone?: string
          registration_number?: string
          slug: string
          tax_number?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          default_currency?: string
          email?: string
          id?: string
          is_active?: boolean
          legal_name?: string
          logo_url?: string | null
          name?: string
          phone?: string
          registration_number?: string
          slug?: string
          tax_number?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          job_title: string
          last_seen_at: string | null
          locale: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          job_title?: string
          last_seen_at?: string | null
          locale?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          job_title?: string
          last_seen_at?: string | null
          locale?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string
          branch_id: string | null
          budget: number
          code: string
          completed_on: string | null
          completion_percent: number
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          latitude: number | null
          location: unknown
          longitude: number | null
          manager_id: string | null
          name: string
          organization_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_completion: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          branch_id?: string | null
          budget?: number
          code: string
          completed_on?: string | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          manager_id?: string | null
          name: string
          organization_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_completion?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          branch_id?: string | null
          budget?: number
          code?: string
          completed_on?: string | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          manager_id?: string | null
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_completion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          area_m2: number
          bathrooms: number | null
          bedrooms: number | null
          branch_id: string | null
          completion_percent: number
          created_at: string
          created_by: string | null
          currency: string
          description: Json
          features: Json
          floors: number | null
          gallery: string[]
          id: string
          image_url: string
          internal_notes: string
          is_published: boolean
          latitude: number
          location: unknown
          longitude: number
          organization_id: string
          owner_contact_id: string | null
          parking_spaces: number | null
          payment_options: Database["public"]["Enums"]["payment_method"][]
          price: number
          project_id: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          reference_code: string
          status: Database["public"]["Enums"]["property_status"]
          title: Json
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address: string
          area_m2: number
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          features?: Json
          floors?: number | null
          gallery?: string[]
          id?: string
          image_url: string
          internal_notes?: string
          is_published?: boolean
          latitude: number
          location?: unknown
          longitude: number
          organization_id?: string
          owner_contact_id?: string | null
          parking_spaces?: number | null
          payment_options?: Database["public"]["Enums"]["payment_method"][]
          price: number
          project_id?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          reference_code?: string
          status?: Database["public"]["Enums"]["property_status"]
          title: Json
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          area_m2?: number
          bathrooms?: number | null
          bedrooms?: number | null
          branch_id?: string | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          features?: Json
          floors?: number | null
          gallery?: string[]
          id?: string
          image_url?: string
          internal_notes?: string
          is_published?: boolean
          latitude?: number
          location?: unknown
          longitude?: number
          organization_id?: string
          owner_contact_id?: string | null
          parking_spaces?: number | null
          payment_options?: Database["public"]["Enums"]["payment_method"][]
          price?: number
          project_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          reference_code?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: Json
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_contact_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          authorized_by: string
          balance_due: number
          branch_id: string | null
          contact_id: string | null
          contract_total: number | null
          created_at: string
          currency: string
          customer_address: string
          customer_name: string
          customer_phone: string
          deal_id: string | null
          id: string
          installment_number: number | null
          issued_by: string | null
          next_due_date: string | null
          notes: string
          organization_id: string
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
          branch_id?: string | null
          contact_id?: string | null
          contract_total?: number | null
          created_at?: string
          currency?: string
          customer_address?: string
          customer_name: string
          customer_phone?: string
          deal_id?: string | null
          id?: string
          installment_number?: number | null
          issued_by?: string | null
          next_due_date?: string | null
          notes?: string
          organization_id?: string
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
          branch_id?: string | null
          contact_id?: string | null
          contract_total?: number | null
          created_at?: string
          currency?: string
          customer_address?: string
          customer_name?: string
          customer_phone?: string
          deal_id?: string | null
          id?: string
          installment_number?: number | null
          issued_by?: string | null
          next_due_date?: string | null
          notes?: string
          organization_id?: string
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_method"]
          property_id?: string | null
          receipt_number?: string
          status?: Database["public"]["Enums"]["receipt_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_financial_summary"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "receipts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          branch_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string
          due_at: string | null
          id: string
          lead_id: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          branch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deal_financial_summary"
            referencedColumns: ["deal_id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      deal_financial_summary: {
        Row: {
          collected_amount: number | null
          contract_number: string | null
          currency: string | null
          deal_id: string | null
          discount: number | null
          down_payment: number | null
          next_due_date: string | null
          organization_id: string | null
          outstanding_amount: number | null
          overdue_count: number | null
          scheduled_amount: number | null
          status: Database["public"]["Enums"]["deal_status"] | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_organization_invite: {
        Args: { invite_token: string }
        Returns: string
      }
      submit_property_inquiry: {
        Args: {
          p_email?: string
          p_locale?: string
          p_message?: string
          p_name: string
          p_phone: string
          p_property_id: string
        }
        Returns: string
      }
    }
    Enums: {
      contact_type:
        | "buyer"
        | "seller"
        | "tenant"
        | "landlord"
        | "investor"
        | "vendor"
        | "partner"
      deal_status:
        | "draft"
        | "reserved"
        | "contracted"
        | "completed"
        | "cancelled"
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "permits"
        | "operations"
        | "other"
      inquiry_status: "new" | "contacted" | "converted" | "closed"
      installment_status: "pending" | "partial" | "paid" | "overdue" | "waived"
      lead_source:
        | "website"
        | "referral"
        | "social"
        | "walk_in"
        | "campaign"
        | "portal"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing"
        | "negotiation"
        | "won"
        | "lost"
      organization_role:
        | "owner"
        | "admin"
        | "manager"
        | "sales_agent"
        | "accountant"
        | "project_manager"
        | "viewer"
      payment_method: "cash" | "installment" | "advance"
      priority_level: "low" | "normal" | "high" | "urgent"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      property_status: "available" | "reserved" | "sold" | "construction"
      property_type: "land" | "house" | "apartment"
      receipt_status: "issued" | "voided"
      task_status: "open" | "in_progress" | "completed" | "cancelled"
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
      contact_type: [
        "buyer",
        "seller",
        "tenant",
        "landlord",
        "investor",
        "vendor",
        "partner",
      ],
      deal_status: [
        "draft",
        "reserved",
        "contracted",
        "completed",
        "cancelled",
      ],
      expense_category: [
        "materials",
        "labor",
        "equipment",
        "permits",
        "operations",
        "other",
      ],
      inquiry_status: ["new", "contacted", "converted", "closed"],
      installment_status: ["pending", "partial", "paid", "overdue", "waived"],
      lead_source: [
        "website",
        "referral",
        "social",
        "walk_in",
        "campaign",
        "portal",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "viewing",
        "negotiation",
        "won",
        "lost",
      ],
      organization_role: [
        "owner",
        "admin",
        "manager",
        "sales_agent",
        "accountant",
        "project_manager",
        "viewer",
      ],
      payment_method: ["cash", "installment", "advance"],
      priority_level: ["low", "normal", "high", "urgent"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      property_status: ["available", "reserved", "sold", "construction"],
      property_type: ["land", "house", "apartment"],
      receipt_status: ["issued", "voided"],
      task_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"]
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
export type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"]
export type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"]
export type BranchRow = Database["public"]["Tables"]["branches"]["Row"]
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"]
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"]
export type DealRow = Database["public"]["Tables"]["deals"]["Row"]
export type InstallmentRow = Database["public"]["Tables"]["installments"]["Row"]
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]
export type MembershipRow = Database["public"]["Tables"]["organization_members"]["Row"]
export type InviteRow = Database["public"]["Tables"]["organization_invites"]["Row"]
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type InquiryRow = Database["public"]["Tables"]["inquiries"]["Row"]
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"]
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
export type DealFinancialSummaryRow = Database["public"]["Views"]["deal_financial_summary"]["Row"]
