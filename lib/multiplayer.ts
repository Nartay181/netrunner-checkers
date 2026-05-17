import { createInitialBoard, type BoardState, type NodeSide } from "./checkers";
import { supabase, type GameRow } from "./supabaseClient";

/*
Supabase `games` table sketch:
- id uuid primary key default gen_random_uuid()
- room_code text unique not null
- board_state jsonb not null
- current_turn text not null
- logs jsonb not null default '[]'::jsonb
- players jsonb not null default '{}'::jsonb
- status text not null check (status in ('waiting', 'active', 'complete'))
- created_at timestamptz default now()
- updated_at timestamptz default now()
*/

export type RoomSnapshot = {
  boardState: BoardState;
  currentTurn: NodeSide;
  logs: string[];
  players: Record<string, string>;
  roomCode: string;
  status: "waiting" | "active" | "complete";
};

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  ).join("");

  return `ROOM-0x${suffix}`;
}

export function createInitialRoomSnapshot(
  roomCode: string,
  playerName: string
): RoomSnapshot {
  return {
    boardState: createInitialBoard(),
    currentTurn: "runner",
    logs: [
      `[SYSTEM]: Remote shell initialized for ${roomCode}`,
      `[TRACE]: Host connected as ${playerName}`
    ],
    players: { runner: playerName },
    roomCode,
    status: "waiting"
  };
}

export async function syncRoomSnapshot(snapshot: RoomSnapshot) {
  if (!supabase) {
    return { mode: "local-demo" as const };
  }

  await supabase.from("games").upsert({
    board_state: snapshot.boardState,
    current_turn: snapshot.currentTurn,
    logs: snapshot.logs,
    players: snapshot.players,
    room_code: snapshot.roomCode,
    status: snapshot.status
  });

  return { mode: "supabase" as const };
}

export function subscribeToRoom(
  roomCode: string,
  onSnapshot: (snapshot: RoomSnapshot) => void
) {
  if (!supabase) {
    return () => undefined;
  }

  const subscription = supabase
    .channel(`games:${roomCode}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `room_code=eq.${roomCode}`,
        schema: "public",
        table: "games"
      },
      (payload) => {
        onSnapshot(toRoomSnapshot(payload.new));
      }
    )
    .subscribe();

  return () => subscription.unsubscribe?.();
}

function toRoomSnapshot(row: GameRow): RoomSnapshot {
  return {
    boardState: row.board_state,
    currentTurn: row.current_turn,
    logs: row.logs ?? [],
    players: row.players ?? {},
    roomCode: row.room_code,
    status: row.status
  };
}
