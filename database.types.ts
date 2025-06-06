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
          instagram: string | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          player1_id: string | null
          player2_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player1_id?: string | null
          player2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          couple_id: string | null
          created_at: string | null
          id: string
          is_pending: boolean | null
          phone: string | null
          player_id: string
          tournament_id: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string | null
          id?: string
          is_pending?: boolean | null
          phone?: string | null
          player_id: string
          tournament_id: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string | null
          id?: string
          is_pending?: boolean | null
          phone?: string | null
          player_id?: string
          tournament_id?: string
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
      matches: {
        Row: {
          couple1_id: string | null
          couple2_id: string | null
          created_at: string
          id: string
          order: number | null
          result_couple1: string | null
          result_couple2: string | null
          round: Database["public"]["Enums"]["ROUND"] | null
          status: string | null
          tournament_id: string | null
          winner_id: string | null
          zone_id: string | null
        }
        Insert: {
          couple1_id?: string | null
          couple2_id?: string | null
          created_at?: string
          id?: string
          order?: number | null
          result_couple1?: string | null
          result_couple2?: string | null
          round?: Database["public"]["Enums"]["ROUND"] | null
          status?: string | null
          tournament_id?: string | null
          winner_id?: string | null
          zone_id?: string | null
        }
        Update: {
          couple1_id?: string | null
          couple2_id?: string | null
          created_at?: string
          id?: string
          order?: number | null
          result_couple1?: string | null
          result_couple2?: string | null
          round?: Database["public"]["Enums"]["ROUND"] | null
          status?: string | null
          tournament_id?: string | null
          winner_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_couple1_id_fkey"
            columns: ["couple1_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_couple2_id_fkey"
            columns: ["couple2_id"]
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
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          category_name: string | null
          club_id: string | null
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
          category_name?: string | null
          club_id?: string | null
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
          category_name?: string | null
          club_id?: string | null
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
            foreignKeyName: "players_category_name_fkey"
            columns: ["category_name"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      services_clubes: {
        Row: {
          club_id: string
          service_id: string
        }
        Insert: {
          club_id: string
          service_id: string
        }
        Update: {
          club_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_clubes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_clubes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_couple_seeds: {
        Row: {
          couple_id: string
          seed: number
          tournament_id: string
          zone_id: string
        }
        Insert: {
          couple_id?: string
          seed: number
          tournament_id?: string
          zone_id?: string
        }
        Update: {
          couple_id?: string
          seed?: number
          tournament_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tournament_couple_seeds_couple_id"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category_name: string | null
          club_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          gender: Database["public"]["Enums"]["GENDER"] | null
          id: string
          max_participants: number | null
          name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["status_tournament"] | null
          type: Database["public"]["Enums"]["tournament_type"] | null
          winner_id: string | null
        }
        Insert: {
          category_name?: string | null
          club_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          max_participants?: number | null
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_tournament"] | null
          type?: Database["public"]["Enums"]["tournament_type"] | null
          winner_id?: string | null
        }
        Update: {
          category_name?: string | null
          club_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          gender?: Database["public"]["Enums"]["GENDER"] | null
          id?: string
          max_participants?: number | null
          name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["status_tournament"] | null
          type?: Database["public"]["Enums"]["tournament_type"] | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_category_name_fkey"
            columns: ["category_name"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "tournaments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["ROLE"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["ROLE"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["ROLE"] | null
        }
        Relationships: []
      }
      zone_couples: {
        Row: {
          couple_id: string
          created_at: string
          zone_id: string
        }
        Insert: {
          couple_id?: string
          created_at?: string
          zone_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_couples_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_couples_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          id: string
          name: string | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_tournament_id_fkey"
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
      ROUND:
        | "ZONE"
        | "32VOS"
        | "16VOS"
        | "8VOS"
        | "4TOS"
        | "SEMIFINAL"
        | "FINAL"
      status_tournament:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "FINISHED"
        | "PAIRING"
        | "CANCELED"
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
      ROUND: ["ZONE", "32VOS", "16VOS", "8VOS", "4TOS", "SEMIFINAL", "FINAL"],
      status_tournament: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "FINISHED",
        "PAIRING",
        "CANCELED",
      ],
      tournament_type: ["LONG", "AMERICAN"],
    },
  },
} as const
