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
      profiles: {
        Row: {
          avatar_url: string | null;
          city: string | null;
          country: string;
          created_at: string;
          display_name: string | null;
          draws: number;
          elo: number;
          games_played: number;
          hack_rating: number;
          id: string;
          is_pro: boolean;
          losses: number;
          updated_at: string;
          username: string;
          wins: number;
        };
        Insert: {
          avatar_url?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          display_name?: string | null;
          draws?: number;
          elo?: number;
          games_played?: number;
          hack_rating?: number;
          id: string;
          is_pro?: boolean;
          losses?: number;
          updated_at?: string;
          username: string;
          wins?: number;
        };
        Update: {
          avatar_url?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          display_name?: string | null;
          draws?: number;
          elo?: number;
          games_played?: number;
          hack_rating?: number;
          id?: string;
          is_pro?: boolean;
          losses?: number;
          updated_at?: string;
          username?: string;
          wins?: number;
        };
        Relationships: [];
      };
      games: {
        Row: {
          board_state: Json;
          created_at: string;
          current_player: "runner" | "daemon";
          daemon_user_id: string | null;
          ended_at: string | null;
          host_user_id: string;
          id: string;
          last_move: Json | null;
          logs: Json;
          move_history: Json;
          players: Json;
          room_code: string;
          runner_user_id: string;
          started_at: string | null;
          status: "waiting" | "active" | "complete" | "abandoned";
          updated_at: string;
          winner: "runner" | "daemon" | "draw" | null;
        };
        Insert: {
          board_state?: Json;
          created_at?: string;
          current_player?: "runner" | "daemon";
          daemon_user_id?: string | null;
          ended_at?: string | null;
          host_user_id?: string;
          id?: string;
          last_move?: Json | null;
          logs?: Json;
          move_history?: Json;
          players?: Json;
          room_code: string;
          runner_user_id?: string;
          started_at?: string | null;
          status?: "waiting" | "active" | "complete" | "abandoned";
          updated_at?: string;
          winner?: "runner" | "daemon" | "draw" | null;
        };
        Update: {
          board_state?: Json;
          created_at?: string;
          current_player?: "runner" | "daemon";
          daemon_user_id?: string | null;
          ended_at?: string | null;
          host_user_id?: string;
          id?: string;
          last_move?: Json | null;
          logs?: Json;
          move_history?: Json;
          players?: Json;
          room_code?: string;
          runner_user_id?: string;
          started_at?: string | null;
          status?: "waiting" | "active" | "complete" | "abandoned";
          updated_at?: string;
          winner?: "runner" | "daemon" | "draw" | null;
        };
        Relationships: [];
      };
      game_history: {
        Row: {
          coach_analysis: Json;
          created_at: string;
          daemon_user_id: string | null;
          duration_seconds: number | null;
          ended_at: string;
          final_board_state: Json;
          game_id: string | null;
          id: string;
          logs: Json;
          move_history: Json;
          rating_delta: Json;
          room_code: string | null;
          runner_user_id: string | null;
          started_at: string | null;
          winner: "runner" | "daemon" | "draw" | null;
        };
        Insert: {
          coach_analysis?: Json;
          created_at?: string;
          daemon_user_id?: string | null;
          duration_seconds?: number | null;
          ended_at?: string;
          final_board_state?: Json;
          game_id?: string | null;
          id?: string;
          logs?: Json;
          move_history?: Json;
          rating_delta?: Json;
          room_code?: string | null;
          runner_user_id?: string | null;
          started_at?: string | null;
          winner?: "runner" | "daemon" | "draw" | null;
        };
        Update: {
          coach_analysis?: Json;
          created_at?: string;
          daemon_user_id?: string | null;
          duration_seconds?: number | null;
          ended_at?: string;
          final_board_state?: Json;
          game_id?: string | null;
          id?: string;
          logs?: Json;
          move_history?: Json;
          rating_delta?: Json;
          room_code?: string | null;
          runner_user_id?: string | null;
          started_at?: string | null;
          winner?: "runner" | "daemon" | "draw" | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
