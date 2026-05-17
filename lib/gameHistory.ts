import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/types";

export type MatchHistoryRow =
  Database["public"]["Tables"]["match_history"]["Row"];
export type MatchHistoryInsert =
  Database["public"]["Tables"]["match_history"]["Insert"];

export type ArchivedMatchInput = {
  eloChange: number;
  playerBlackId: string | null;
  playerBlackName: string;
  playerRedId: string | null;
  playerRedName: string;
  winnerId: string | null;
};

export async function archiveCompletedMatch(
  supabase: SupabaseClient<Database> | null,
  match: ArchivedMatchInput
) {
  if (!supabase) {
    return { error: "Supabase client unavailable." };
  }

  const payload: MatchHistoryInsert = {
    elo_change: match.eloChange,
    player_black_id: match.playerBlackId,
    player_black_name: match.playerBlackName,
    player_red_id: match.playerRedId,
    player_red_name: match.playerRedName,
    winner_id: match.winnerId
  };

  const { error } = await supabase.from("match_history").insert(payload);

  return { error: error?.message ?? null };
}

export async function fetchUserMatchHistory(
  supabase: SupabaseClient<Database> | null,
  userId: string
) {
  if (!supabase) {
    return {
      data: [],
      error: "Supabase client unavailable."
    };
  }

  const { data, error } = await supabase
    .from("match_history")
    .select("*")
    .or(`player_red_id.eq.${userId},player_black_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    data: data ?? [],
    error: error?.message ?? null
  };
}
