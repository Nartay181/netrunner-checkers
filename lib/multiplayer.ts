import { createInitialBoard, type BoardState, type NodeSide } from "./checkers";
import {
  getSupabaseClient,
  type GameInsert,
  type GameRow,
  type GameUpdate,
  type Json,
  type RemotePlayer
} from "./supabaseClient";

/*
Supabase `games` table sketch:
- id uuid primary key default gen_random_uuid()
- room_code text unique not null
- board_state jsonb not null
- current_player text not null
- logs jsonb not null default '[]'::jsonb
- players jsonb not null default '[]'::jsonb
- status text not null check (status in ('waiting', 'active', 'complete'))
- created_at timestamptz default now()
- updated_at timestamptz default now()
*/

export type RoomSnapshot = {
  boardState: BoardState;
  currentPlayer: NodeSide;
  logs: string[];
  players: RemotePlayer[];
  roomCode: string;
  status: "waiting" | "active" | "complete";
};

export type RemoteConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

export type RemoteRoomResult = {
  playerSide: NodeSide;
  snapshot: RoomSnapshot;
};

export function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 4 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  ).join("");

  return `ROOM-KZ${suffix}`;
}

export function createInitialRoomSnapshot(
  roomCode: string,
  playerName: string
): RoomSnapshot {
  return {
    boardState: createInitialBoard(),
    currentPlayer: "runner",
    logs: [
      `[SYSTEM]: Remote shell initialized for ${roomCode}`,
      `[TRACE]: Runner uplink established as ${playerName}`,
      "[SYSTEM]: Waiting for opponent..."
    ],
    players: [
      {
        id: makePlayerId("runner"),
        name: playerName,
        side: "runner"
      }
    ],
    roomCode,
    status: "waiting"
  };
}

export async function createRemoteRoom(
  playerName: string
): Promise<RemoteRoomResult> {
  const client = getSupabaseClient();
  const userId = await getAuthenticatedUserId();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const roomCode = generateRoomCode();
    const snapshot = {
      ...createInitialRoomSnapshot(roomCode, playerName),
      players: [
        {
          id: userId,
          name: playerName,
          side: "runner" as const
        }
      ]
    };

    const { data, error } = await client
      .from("games")
      .insert({
        ...toGameRow(snapshot),
        host_user_id: userId,
        runner_user_id: userId
      })
      .select()
      .single();

    if (!error && data) {
      return {
        playerSide: "runner",
        snapshot: toRoomSnapshot(data)
      };
    }

    if (!isRoomCodeCollision(error?.message) || attempt === 2) {
      throw new Error(error?.message ?? "Unable to create remote room.");
    }
  }

  throw new Error("Unable to generate a unique room code.");
}

export async function joinRemoteRoom(
  roomCode: string,
  playerName: string
): Promise<RemoteRoomResult> {
  const client = getSupabaseClient();
  const userId = await getAuthenticatedUserId();

  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const { data: existing, error: loadError } = await client
    .from("games")
    .select()
    .eq("room_code", normalizedRoomCode)
    .single();

  if (loadError || !existing) {
    throw new Error(loadError?.message ?? "Remote room not found.");
  }

  const existingSnapshot = toRoomSnapshot(existing);
  const existingPlayer = existingSnapshot.players.find(
    (player) => player.id === userId
  );

  if (existingPlayer) {
    return {
      playerSide: existingPlayer.side,
      snapshot: existingSnapshot
    };
  }

  if (existing.runner_user_id === userId) {
    return {
      playerSide: "runner",
      snapshot: existingSnapshot
    };
  }

  if (existing.daemon_user_id === userId) {
    return {
      playerSide: "daemon",
      snapshot: existingSnapshot
    };
  }

  const hasDaemon = existingSnapshot.players.some(
    (player) => player.side === "daemon"
  );

  if (existingSnapshot.status === "complete" || existing.status === "abandoned") {
    throw new Error("Remote room already terminated.");
  }

  if (existingSnapshot.status !== "waiting") {
    throw new Error("Remote room is not accepting new operators.");
  }

  if (existing.daemon_user_id || hasDaemon) {
    throw new Error("Remote room is full.");
  }

  const nextPlayers = [
    ...existingSnapshot.players,
    {
      id: userId,
      name: playerName,
      side: "daemon" as const
    }
  ];
  const nextSnapshot: RoomSnapshot = {
    ...existingSnapshot,
    logs: [
      `[TRACE]: Daemon uplink established as ${playerName}`,
      "[SYSTEM]: Opponent linked. Remote breach active.",
      ...existingSnapshot.logs
    ].slice(0, 16),
    players: nextPlayers,
    status: "active"
  };

  const { data, error } = await client
    .from("games")
    .update({
      ...toGameRow(nextSnapshot),
      daemon_user_id: userId
    })
    .eq("room_code", normalizedRoomCode)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to join remote room.");
  }

  return {
    playerSide: "daemon",
    snapshot: toRoomSnapshot(data)
  };
}

export async function loadRemoteRoom(roomCode: string) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase client offline. Unable to load remote room.");
  }

  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const { data, error } = await client
    .from("games")
    .select()
    .eq("room_code", normalizedRoomCode)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Remote room not found.");
  }

  return toRoomSnapshot(data);
}

export async function updateRemoteRoomState(snapshot: RoomSnapshot) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase client offline. Move kept locally only.");
  }

  const { data, error } = await client
    .from("games")
    .update(toGameRow(snapshot))
    .eq("room_code", snapshot.roomCode)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to sync remote move.");
  }

  return toRoomSnapshot(data);
}

export function subscribeToRoom(
  roomCode: string,
  onSnapshot: (snapshot: RoomSnapshot) => void,
  onError?: (message: string) => void,
  onStatus?: (status: RemoteConnectionStatus) => void
) {
  const client = getSupabaseClient();

  onStatus?.("connecting");

  const subscription = client
    .channel(`games:${normalizeRoomCode(roomCode)}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        filter: `room_code=eq.${normalizeRoomCode(roomCode)}`,
        schema: "public",
        table: "games"
      },
      (payload) => {
        const nextRow = payload.new as GameRow | null;

        if (nextRow) {
          onSnapshot(toRoomSnapshot(nextRow));
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onStatus?.("connected");
      }

      if (status === "CLOSED") {
        onStatus?.("closed");
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        onStatus?.(status === "CLOSED" ? "closed" : "error");
        onError?.(`Realtime channel status: ${status}`);
      }
    });

  return () => {
    void subscription.unsubscribe();
  };
}

function toRoomSnapshot(row: GameRow): RoomSnapshot {
  return {
    boardState: readBoardState(row.board_state),
    currentPlayer: row.current_player,
    logs: readLogLines(row.logs),
    players: readRemotePlayers(row.players),
    roomCode: row.room_code,
    status: readRoomStatus(row.status)
  };
}

function toGameRow(snapshot: RoomSnapshot): GameInsert & GameUpdate {
  return {
    board_state: snapshot.boardState as unknown as Json,
    current_player: snapshot.currentPlayer,
    logs: snapshot.logs as unknown as Json,
    players: snapshot.players as unknown as Json,
    room_code: snapshot.roomCode,
    status: snapshot.status
  };
}

function readBoardState(value: Json): BoardState {
  return Array.isArray(value) ? (value as unknown as BoardState) : createInitialBoard();
}

function readLogLines(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((line): line is string => typeof line === "string");
}

function readRemotePlayers(value: Json) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((player): player is RemotePlayer => {
    if (!player || typeof player !== "object" || Array.isArray(player)) {
      return false;
    }

    const candidate = player as Record<string, unknown>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      (candidate.side === "runner" || candidate.side === "daemon")
    );
  });
}

function readRoomStatus(status: GameRow["status"]): RoomSnapshot["status"] {
  return status === "waiting" || status === "active" ? status : "complete";
}

function normalizeRoomCode(roomCode: string) {
  const candidate = roomCode.trim();

  try {
    const url = new URL(candidate);
    const codeFromUrl = url.searchParams.get("room");

    if (codeFromUrl) {
      return normalizeRoomCode(codeFromUrl);
    }
  } catch {
    // Plain room codes are expected most of the time.
  }

  return candidate.toUpperCase().replace(/\s+/g, "");
}

function makePlayerId(side: NodeSide) {
  return `${side}-${Math.random().toString(16).slice(2, 10)}`;
}

async function getAuthenticatedUserId() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error(
      "Remote Shell requires a Supabase auth session. Enable anonymous auth or sign in first."
    );
  }

  return data.user.id;
}

function isRoomCodeCollision(message?: string) {
  return Boolean(
    message?.toLowerCase().includes("duplicate") ||
      message?.toLowerCase().includes("unique")
  );
}
