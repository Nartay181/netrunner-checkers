import type { BoardState, NodeSide } from "./checkers";
import { createClient } from "@/utils/supabase/client";
import type { Database, Json } from "@/utils/supabase/types";

export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GameRow = Database["public"]["Tables"]["games"]["Row"];
export type GameUpdate = Database["public"]["Tables"]["games"]["Update"];
export type { Json };

export type RemotePlayer = {
  id: string;
  name: string;
  side: NodeSide;
};

export function getSupabaseClient() {
  return createClient();
}
