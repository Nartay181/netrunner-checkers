import type { BoardState, NodeSide } from "./checkers";

export type GameRow = {
  id?: string;
  room_code: string;
  board_state: BoardState;
  current_turn: NodeSide;
  logs: string[];
  players: Record<string, string>;
  status: "waiting" | "active" | "complete";
};

type RealtimeChannel = {
  on: (
    event: "postgres_changes",
    filter: Record<string, string>,
    callback: (payload: { new: GameRow }) => void
  ) => RealtimeChannel;
  subscribe: () => { unsubscribe?: () => void };
};

export type SupabaseClientLike = {
  channel: (name: string) => RealtimeChannel;
  from: (table: "games") => {
    upsert: (row: Partial<GameRow> & { room_code: string }) => Promise<unknown>;
  };
};

// TODO: Replace this shim with your configured Supabase export, for example:
// import { supabase } from "./supabase";
// export { supabase };
export const supabase: SupabaseClientLike | null = null;
