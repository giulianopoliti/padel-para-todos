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
      categories: {
        Row: {
          lower_range: number
          name: string
          upper_range: number | null
        }
        Insert: {
          lower_range: number
          name: string
          upper_range?: number | null
        }
        Update: {
          lower_range?: number
          name?: string
          upper_range?: number | null
        }
        Relationships: []
      }
      clubes: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          created_at: string
          id: string
          last_name: string | null
          name: string | null
          player_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_name?: string | null
          name?: string | null
          player_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_name?: string | null
          name?: string | null
          player_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coachs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          player_1: string | null
          player_2: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_1?: string | null
          player_2?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_1?: string | null
          player_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_player_1_fkey"
            columns: ["player_1"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_player_2_fkey"
            columns: ["player_2"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          couple_1: string | null
          couple_2: string | null
          created_at: string
          id: string
          result_couple_1: string | null
          result_couple_2: string | null
          tournament_id: string | null
        }
        Insert: {
          couple_1?: string | null
          couple_2?: string | null
          created_at?: string
          id?: string
          result_couple_1?: string | null
          result_couple_2?: string | null
          tournament_id?: string | null
        }
        Update: {
          couple_1?: string | null
          couple_2?: string | null
          created_at?: string
          id?: string
          result_couple_1?: string | null
          result_couple_2?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_couple_1_fkey"
            columns: ["couple_1"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_couple_2_fkey"
            columns: ["couple_2"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          category: string | null
          club: string | null
          created_at: string
          date_of_birth: string | null
          dni: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["GENDER"] | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_hand: string | null
          preferred_side: Database["public"]["Enums"]["PREFERRED_SIDE"] | null
          racket: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          club?: string | null
          created_at?: string
          date_of_birth?: string | null
          dni?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_hand?: string | null
          preferred_side?: Database["public"]["Enums"]["PREFERRED_SIDE"] | null
          racket?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          club?: string | null
          created_at?: string
          date_of_birth?: string | null
          dni?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_hand?: string | null
          preferred_side?: Database["public"]["Enums"]["PREFERRED_SIDE"] | null
          racket?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "players_club_fkey"
            columns: ["club"]
            isOneToOne: false
            referencedRelation: "clubes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category: string | null
          club: string | null
          created_at: string
          end_date: string | null
          gender: Database["public"]["Enums"]["GENDER"] | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["status_tournament"] | null
          type: Database["public"]["Enums"]["tournament_type"] | null
        }
        Insert: {
          category?: string | null
          club?: string | null
          created_at?: string
          end_date?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_tournament"] | null
          type?: Database["public"]["Enums"]["tournament_type"] | null
        }
        Update: {
          category?: string | null
          club?: string | null
          created_at?: string
          end_date?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_tournament"] | null
          type?: Database["public"]["Enums"]["tournament_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "tournament_club_fkey"
            columns: ["club"]
            isOneToOne: false
            referencedRelation: "clubes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["ROLE"] | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["ROLE"] | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["ROLE"] | null
        }
        Relationships: []
      }
      inscriptions: {
        Row: {
          created_at: string
          id: string
          player_id: string
          tournament_id: string
          couple_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id?: string
          tournament_id?: string
          couple_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          tournament_id?: string
          couple_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
            },
          {
            foreignKeyName: "inscriptions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
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
      GENDER: "MALE" | "SHEMALE" | "MIXED"
      PREFERRED_SIDE: "DRIVE" | "REVES"
      ROLE: "PLAYER" | "COACH" | "CLUB"
      status_tournament: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED"
      tournament_type: "LONG" | "AMERICAN"
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
    Enums: {
      GENDER: ["MALE", "SHEMALE", "MIXED"],
      PREFERRED_SIDE: ["DRIVE", "REVES"],
      ROLE: ["PLAYER", "COACH", "CLUB"],
      status_tournament: ["NOT_STARTED", "IN_PROGRESS", "FINISHED"],
      tournament_type: ["LONG", "AMERICAN"],
    },
  },
} as const
