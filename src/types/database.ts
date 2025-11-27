// Auto-generated types for Supabase database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: 'employee' | 'manager'
          level: string
          hourly_rate: number
          manager_id: string | null
          telegram_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'employee' | 'manager'
          level: string
          hourly_rate: number
          manager_id?: string | null
          telegram_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'employee' | 'manager'
          level?: string
          hourly_rate?: number
          manager_id?: string | null
          telegram_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      levels: {
        Row: {
          id: string
          name: string
          hourly_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          hourly_rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      objects: {
        Row: {
          id: string
          name: string
          is_business_trip: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          is_business_trip?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_business_trip?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      process_types: {
        Row: {
          id: string
          name: string
          object: string | null
          rate: number
          unit: string
          planned_volume: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          object?: string | null
          rate: number
          unit: string
          planned_volume?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          object?: string | null
          rate?: number
          unit?: string
          planned_volume?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      hours: {
        Row: {
          id: string
          user_id: string
          date: string
          hours: number
          object: string
          is_business_trip: boolean
          salary: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          date: string
          hours: number
          object: string
          is_business_trip?: boolean
          salary: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          hours?: number
          object?: string
          is_business_trip?: boolean
          salary?: number
          created_at?: string
          updated_at?: string
        }
      }
      processes: {
        Row: {
          id: string
          user_id: string
          date: string
          process_name: string
          object: string | null
          volume: number
          unit: string
          rate: number
          salary: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          date: string
          process_name: string
          object?: string | null
          volume: number
          unit: string
          rate: number
          salary: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          process_name?: string
          object?: string | null
          volume?: number
          unit?: string
          rate?: number
          salary?: number
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          user_id: string
          date: string
          object: string
          material_name: string
          quantity: number
          unit: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          date: string
          object: string
          material_name: string
          quantity: number
          unit: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          object?: string
          material_name?: string
          quantity?: number
          unit?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          employee_id: string
          manager_id: string
          date: string
          description: string
          notes: string | null
          status: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          employee_id: string
          manager_id: string
          date: string
          description: string
          notes?: string | null
          status: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          manager_id?: string
          date?: string
          description?: string
          notes?: string | null
          status?: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed'
          created_at?: string
          updated_at?: string
        }
      }
      additional_works: {
        Row: {
          id: string
          user_id: string
          manager_id: string
          object_name: string
          date: string
          work_name: string
          description: string | null
          unit: string
          volume: number
          rate: number
          salary: number
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          manager_id: string
          object_name: string
          date: string
          work_name: string
          description?: string | null
          unit: string
          volume: number
          rate: number
          salary: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          manager_id?: string
          object_name?: string
          date?: string
          work_name?: string
          description?: string | null
          unit?: string
          volume?: number
          rate?: number
          salary?: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_current_user_id: {
        Args: {
          user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
