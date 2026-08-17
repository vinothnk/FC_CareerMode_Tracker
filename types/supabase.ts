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
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["career_saves"]["Insert"]>;
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
