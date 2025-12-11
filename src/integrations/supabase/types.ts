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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      gallery_photos: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          match_id: string | null
          player_id: string | null
          team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          match_id?: string | null
          player_id?: string | null
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          match_id?: string | null
          player_id?: string | null
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      match_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          match_id: string
          minute: number
          player_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          match_id: string
          minute: number
          player_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          match_id?: string
          minute?: number
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          assistant_1: string | null
          assistant_2: string | null
          away_score: number | null
          away_team_id: string
          created_at: string
          fourth_official: string | null
          home_score: number | null
          home_team_id: string
          id: string
          match_date: string
          referee: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          updated_at: string
          venue: string | null
          live_stream_url: string | null
        }
        Insert: {
          assistant_1?: string | null
          assistant_2?: string | null
          away_score?: number | null
          away_team_id: string
          created_at?: string
          fourth_official?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          match_date: string
          referee?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          venue?: string | null
          live_stream_url?: string | null
        }
        Update: {
          assistant_1?: string | null
          assistant_2?: string | null
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          fourth_official?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          match_date?: string
          referee?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          updated_at?: string
          venue?: string | null
          live_stream_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      motm_awards: {
        Row: {
          id: string
          match_id: string
          player_id: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "motm_awards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motm_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
      players: {
        Row: {
          assists: number | null
          clean_sheets: number | null
          created_at: string
          goals: number | null
          id: string
          is_captain: boolean | null
          jersey_number: number
          motm_awards: number | null
          name: string
          photo_url: string | null
          position: Database["public"]["Enums"]["player_position"]
          red_cards: number | null
          team_id: string
          updated_at: string
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          is_captain?: boolean | null
          jersey_number: number
          motm_awards?: number | null
          name: string
          photo_url?: string | null
          position: Database["public"]["Enums"]["player_position"]
          red_cards?: number | null
          team_id: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          clean_sheets?: number | null
          created_at?: string
          goals?: number | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number
          motm_awards?: number | null
          name?: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["player_position"]
          red_cards?: number | null
          team_id?: string
          updated_at?: string
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          _types_ping: boolean
          captain_name: string
          color: string
          created_at: string
          id: string
          logo_url: string
          name: string
          updated_at: string
          wins: number
          draws: number
          losses: number
          goals_for: number
          goals_against: number
          played: number
        }
        Insert: {
          _types_ping?: boolean
          captain_name: string
          color: string
          created_at?: string
          id?: string
          logo_url: string
          name: string
          updated_at?: string
          wins?: number
          draws?: number
          losses?: number
          goals_for?: number
          goals_against?: number
          played?: number
        }
        Update: {
          _types_ping?: boolean
          captain_name?: string
          color?: string
          created_at?: string
          id?: string
          logo_url?: string
          name?: string
          updated_at?: string
          wins?: number
          draws?: number
          losses?: number
          goals_for?: number
          goals_against?: number
          played?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _user_id: string, _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      increment_player_motm_awards: {
        Args: { p_player_id: string }
        Returns: void
      }
      update_team_stats_after_match: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_team_stats_from_match_result: {
        Args: { match_row: Database["public"]["Tables"]["matches"]["Row"], operation: string }
        Returns: void
      }
      recalculate_team_stats: {
        Args: { p_team_id: string }
        Returns: void
      }
      update_player_motm_count: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_match_stats_update: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      matches_broadcast_trigger: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      team_standings_fn: {
        Args: Record<PropertyKey, never>
        Returns: {
          team_id: string | null
          name: string | null
          played: number | null
          wins: number | null
          draws: number | null
          losses: number | null
          goals_for: number | null
          goals_against: number | null
          goal_difference: number | null
          points: number | null
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "captain" | "viewer"
      event_type:
        | "goal"
        | "assist"
        | "yellow_card"
        | "red_card"
        | "substitution"
      match_status: "scheduled" | "live" | "finished"
      player_position:
        | "Goalkeeper"
        | "Defender"
        | "Midfielder"
        | "Forward"
        | "Winger"
        | "Striker"
      user_role: "admin" | "captain" | "viewer"
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
      event_type: ["goal", "assist", "yellow_card", "red_card", "substitution"],
      match_status: ["scheduled", "live", "finished"],
      player_position: [
        "Goalkeeper",
        "Defender",
        "Midfielder",
        "Forward",
        "Winger",
        "Striker",
      ],
      user_role: ["admin", "captain", "viewer"],
      app_role: ["admin", "captain", "viewer"],
    },
  },
} as const