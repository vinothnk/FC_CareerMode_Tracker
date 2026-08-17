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
      career_saves: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          club: string;
          manager_name: string;
          platform: "console" | "pc";
          season_label: string;
          difficulty: string | null;
          currency: string;
          transfer_budget: number;
          visibility: "private" | "public";
          reference_club_id: string | null;
          game_version_id: string | null;
          status: "active" | "archived" | "completed";
          started_on: string | null;
          last_played_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          club: string;
          manager_name: string;
          platform?: "console" | "pc";
          season_label: string;
          difficulty?: string | null;
          currency?: string;
          transfer_budget?: number;
          visibility?: "private" | "public";
          reference_club_id?: string | null;
          game_version_id?: string | null;
          status?: "active" | "archived" | "completed";
          started_on?: string | null;
          last_played_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["career_saves"]["Insert"]>;
        Relationships: [];
      };
      squad_players: {
        Row: {
          id: string;
          save_id: string;
          user_id: string;
          name: string;
          position: string;
          overall: number;
          potential: number | null;
          squad_role: string;
          value_amount: number | null;
          wage_amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          save_id: string;
          user_id: string;
          name: string;
          position: string;
          overall: number;
          potential?: number | null;
          squad_role?: string;
          value_amount?: number | null;
          wage_amount?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["squad_players"]["Insert"]>;
        Relationships: [];
      };
      fixtures: {
        Row: {
          id: string;
          save_id: string;
          user_id: string;
          played_on: string | null;
          competition: string;
          opponent: string;
          venue: "home" | "away" | "neutral";
          goals_for: number;
          goals_against: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          save_id: string;
          user_id: string;
          played_on?: string | null;
          competition: string;
          opponent: string;
          venue: "home" | "away" | "neutral";
          goals_for?: number;
          goals_against?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fixtures"]["Insert"]>;
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          country_id: string | null;
          league_id: string | null;
          name: string;
          short_name: string | null;
          city: string | null;
          founded_year: number | null;
          stadium_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clubs"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
        Relationships: [];
      };
      game_versions: {
        Row: {
          id: string;
          game_code: string;
          platform: "console" | "pc" | "web" | "mobile";
          title: string;
          version_label: string;
          roster_date: string | null;
          release_date: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["game_versions"]["Row"]> & {
          game_code: string;
          platform: "console" | "pc" | "web" | "mobile";
          title: string;
          version_label: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_versions"]["Insert"]>;
        Relationships: [];
      };
      save_seasons: {
        Row: {
          id: string;
          save_id: string;
          user_id: string;
          season_number: number;
          label: string;
          starts_on: string | null;
          ends_on: string | null;
          transfer_budget: number;
          wage_budget: number;
          board_expectations: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["save_seasons"]["Row"]> & {
          save_id: string;
          user_id: string;
          season_number: number;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["save_seasons"]["Insert"]>;
        Relationships: [];
      };
      save_players: {
        Row: {
          id: string;
          save_id: string;
          user_id: string;
          reference_player_id: string | null;
          current_club_id: string | null;
          display_name: string;
          primary_position: string;
          squad_number: number | null;
          status: "active" | "loaned_out" | "sold" | "released" | "retired";
          joined_on: string | null;
          left_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["save_players"]["Row"]> & {
          save_id: string;
          user_id: string;
          display_name: string;
          primary_position: string;
        };
        Update: Partial<Database["public"]["Tables"]["save_players"]["Insert"]>;
        Relationships: [];
      };
      player_snapshots: {
        Row: {
          id: string;
          save_player_id: string;
          save_id: string;
          user_id: string;
          season_id: string | null;
          snapshot_date: string;
          overall: number;
          potential: number | null;
          age: number | null;
          morale: string | null;
          form: string | null;
          value_amount: number | null;
          wage_amount: number | null;
          contract_end_year: number | null;
          attributes: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["player_snapshots"]["Row"]> & {
          save_player_id: string;
          save_id: string;
          user_id: string;
          overall: number;
        };
        Update: Partial<Database["public"]["Tables"]["player_snapshots"]["Insert"]>;
        Relationships: [];
      };
      save_settings: {
        Row: {
          id: string;
          save_id: string;
          user_id: string;
          setting_key: string;
          setting_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["save_settings"]["Row"]> & {
          save_id: string;
          user_id: string;
          setting_key: string;
          setting_value: Json;
        };
        Update: Partial<Database["public"]["Tables"]["save_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_career_save_with_initial_data: {
        Args: {
          p_name: string;
          p_club_name: string;
          p_manager_name: string;
          p_season_label: string;
          p_platform: string;
          p_difficulty: string | null;
          p_currency: string;
          p_transfer_budget: number;
          p_wage_budget: number;
          p_visibility: string;
          p_game_version_id: string | null;
          p_reference_club_id: string | null;
          p_house_rules: string;
          p_board_expectations: Json;
          p_import_reference_squad: boolean;
          p_manual_players: Json;
        };
        Returns: {
          save_id: string;
          season_id: string;
          imported_players: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
