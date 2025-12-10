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
    }
    Views: {
      upcoming_fixtures: {
        Row: {
          match_id: string | null
          match_date: string | null
          venue: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          home_team_id: string | null
          home_team_name: string | null
          away_team_id: string | null
          away_team_name: string | null
        }
        Insert: {
          match_id?: string | null
          match_date?: string | null
          venue?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          home_team_id?: string | null
          home_team_name?: string | null
          away_team_id?: string | null
          away_team_name?: string | null
        }
        Update: {
          match_id?: string | null
          match_date?: string | null
          venue?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          home_team_id?: string | null
          home_team_name?: string | null
          away_team_id?: string | null
          away_team_name?: string | null
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
      team_standings: {
        Row: {
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
        }
        Insert: {
          team_id?: string | null
          name?: string | null
          played?: number | null
          wins?: number | null
          draws?: number | null
          losses?: number | null
          goals_for?: number | null
          goals_against?: number | null
          goal_difference?: number | null
          points?: number | null
        }
        Update: {
          team_id?: string | null
          name?: string | null
          played?: number | null
          wins?: number | null
          draws?: number | null
          losses?: number | null
          goals_for?: number | null
          goals_against?: number | null
          goal_difference?: number | null
          points?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
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
        Args: { match_row: Database["public"]["Tables"]["matches"]["Row"]; operation: string }
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
        Returns: TABLE_team_standings_fn
      }
    }
    Enums: {
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
      app_role: "admin" | "captain" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

type TABLE_team_standings_fn = {
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
}

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
      app_role: ["admin", "captain", "viewer"],
    },
  },
} as const