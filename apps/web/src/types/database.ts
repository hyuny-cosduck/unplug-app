// Supabase Database Types
// This file defines the schema for the Supabase database

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          group_id: string
          name: string
          emoji: string
          user_id: string | null
          joined_at: string
          dti_type: string | null
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          emoji: string
          user_id?: string | null
          joined_at?: string
          dti_type?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          emoji?: string
          user_id?: string | null
          joined_at?: string
          dti_type?: string | null
        }
      }
      challenges: {
        Row: {
          id: string
          group_id: string
          title: string
          description: string
          goal_type: 'reduce_percent' | 'max_hours' | 'no_sns_hours'
          goal_value: number
          start_date: string
          end_date: string
          penalty: string | null
          reward: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          description: string
          goal_type: 'reduce_percent' | 'max_hours' | 'no_sns_hours'
          goal_value: number
          start_date: string
          end_date: string
          penalty?: string | null
          reward?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          description?: string
          goal_type?: 'reduce_percent' | 'max_hours' | 'no_sns_hours'
          goal_value?: number
          start_date?: string
          end_date?: string
          penalty?: string | null
          reward?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          member_id: string
          group_id: string
          date: string
          minutes: number
          screenshot_url: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          group_id: string
          date: string
          minutes: number
          screenshot_url?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          group_id?: string
          date?: string
          minutes?: number
          screenshot_url?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      nudges: {
        Row: {
          id: string
          from_member_id: string
          to_member_id: string
          group_id: string
          message: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          from_member_id: string
          to_member_id: string
          group_id: string
          message?: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          from_member_id?: string
          to_member_id?: string
          group_id?: string
          message?: string
          created_at?: string
          read_at?: string | null
        }
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
  }
}

// Helper types for easier usage
export type Group = Database['public']['Tables']['groups']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Challenge = Database['public']['Tables']['challenges']['Row']
export type Progress = Database['public']['Tables']['progress']['Row']
export type Nudge = Database['public']['Tables']['nudges']['Row']

export type InsertGroup = Database['public']['Tables']['groups']['Insert']
export type InsertMember = Database['public']['Tables']['members']['Insert']
export type InsertChallenge = Database['public']['Tables']['challenges']['Insert']
export type InsertProgress = Database['public']['Tables']['progress']['Insert']
export type InsertNudge = Database['public']['Tables']['nudges']['Insert']
