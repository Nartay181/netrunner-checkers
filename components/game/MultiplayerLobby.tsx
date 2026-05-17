"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Loader2,
  LogIn,
  RadioTower,
  Satellite,
  Terminal,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createRemoteRoom,
  joinRemoteRoom,
  subscribeToRoom,
  type RemoteConnectionStatus,
  type RoomSnapshot
} from "@/lib/multiplayer";
import type { NodeSide } from "@/lib/checkers";

type MultiplayerLobbyProps = {
  onStartRemote: (
    roomCode: string,
    playerName: string,
    playerSide: NodeSide,
    snapshot: RoomSnapshot
  ) => void;
};

export function MultiplayerLobby({ onStartRemote }: MultiplayerLobbyProps) {
  const auth = useAuth({ autoAnonymous: true });
  const [activePanel, setActivePanel] = useState<"create" | "join">("create");
  const [playerName, setPlayerName] = useState("ALMATY_RUNNER");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomSnapshot, setRoomSnapshot] = useState<RoomSnapshot | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<RemoteConnectionStatus>("idle");
  const [pendingAction, setPendingAction] = useState<"create" | "join" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareLink = useMemo(() => {
    if (!roomCode || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}?room=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);
  const authUnavailable = !auth.loading && !auth.user;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const roomFromUrl = new URLSearchParams(window.location.search).get("room");

    if (roomFromUrl) {
      setActivePanel("join");
      setJoinCode(roomFromUrl);
    }
  }, []);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    return subscribeToRoom(
      roomCode,
      (snapshot) => {
        setRoomSnapshot(snapshot);
        setError(null);
      },
      (message) => setError(message),
      setConnectionStatus
    );
  }, [roomCode]);

  async function createRoom() {
    if (auth.loading) {
      return;
    }

    setPendingAction("create");
    setError(null);
    setCopied(false);

    try {
      const result = await createRemoteRoom(playerName.trim() || "ALMATY_RUNNER");
      const nextShareLink = buildShareLink(result.snapshot.roomCode);

      setRoomCode(result.snapshot.roomCode);
      setRoomSnapshot(result.snapshot);
      setConnectionStatus("connecting");

      try {
        await copyToClipboard(nextShareLink);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setError("Room created. Clipboard permission blocked auto-copy.");
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setPendingAction(null);
    }
  }

  async function joinRoom() {
    if (auth.loading) {
      return;
    }

    setPendingAction("join");
    setError(null);

    try {
      const result = await joinRemoteRoom(
        joinCode,
        playerName.trim() || "ALMATY_RUNNER"
      );

      onStartRemote(
        result.snapshot.roomCode,
        playerName.trim() || "ALMATY_RUNNER",
        result.playerSide,
        result.snapshot
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setPendingAction(null);
    }
  }

  async function copyCode() {
    if (!roomCode) {
      return;
    }

    await copyToClipboard(shareLink || roomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-lg border border-cyber/25 bg-black/35 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black uppercase text-cyber">
          <RadioTower className="h-4 w-4" aria-hidden="true" />
          <span>Remote Shell</span>
        </div>
        <span className="rounded-md border border-matrix/30 px-2 py-1 text-[10px] uppercase text-matrix">
          {auth.loading ? "Auth linking" : "Supabase live"}
        </span>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-xs uppercase text-cyber/75">
          Operator alias
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="rounded-md border border-cyber/25 bg-black/60 px-3 py-2 text-sm uppercase text-white outline-none transition focus:border-matrix/70"
          />
        </label>

        {auth.error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-l border-danger bg-danger/10 px-3 py-2 text-xs uppercase leading-relaxed text-danger"
          >
            [AUTH ERROR]: {auth.error}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-l border-danger bg-danger/10 px-3 py-2 text-xs uppercase leading-relaxed text-danger"
          >
            [ERROR]: {error}
          </motion.div>
        )}

        {!roomCode && (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-cyber/15 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setActivePanel("create")}
              className={[
                "rounded px-3 py-2 text-xs font-black uppercase transition",
                activePanel === "create"
                  ? "bg-cyber/12 text-cyber shadow-cyber-soft"
                  : "text-cyber/55 hover:text-cyber"
              ].join(" ")}
            >
              Create Private Session
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("join")}
              className={[
                "rounded px-3 py-2 text-xs font-black uppercase transition",
                activePanel === "join"
                  ? "bg-matrix/12 text-matrix shadow-matrix-soft"
                  : "text-matrix/55 hover:text-matrix"
              ].join(" ")}
            >
              Join Session by Code
            </button>
          </div>
        )}

        {!roomCode ? (
          <div className="grid gap-3">
            {activePanel === "create" ? (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={createRoom}
                disabled={
                  auth.loading || authUnavailable || Boolean(pendingAction)
                }
                className="inline-flex items-center justify-center gap-2 rounded-md border border-cyber/45 bg-cyber/10 px-4 py-2 text-xs font-bold uppercase text-cyber shadow-cyber-soft disabled:cursor-wait disabled:opacity-60"
              >
                {pendingAction === "create" || auth.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Satellite className="h-4 w-4" aria-hidden="true" />
                )}
                {auth.loading
                  ? "Authenticating operator"
                  : pendingAction === "create"
                    ? "Opening encrypted socket"
                    : authUnavailable
                      ? "Auth Required"
                      : "Create Private Session"}
              </motion.button>
            ) : (
              <div className="grid gap-2 rounded-md border border-matrix/25 bg-black/35 p-3">
                <label className="grid gap-1 text-xs uppercase text-matrix/75">
                  Session Code
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="ROOM-KZA7F3"
                    className="rounded-md border border-matrix/25 bg-black/60 px-3 py-2 text-sm uppercase text-white outline-none transition placeholder:text-matrix/35 focus:border-matrix/70"
                  />
                </label>
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={joinRoom}
                  disabled={
                    auth.loading ||
                    authUnavailable ||
                    Boolean(pendingAction) ||
                    joinCode.trim().length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-matrix/45 bg-matrix/10 px-4 py-2 text-xs font-bold uppercase text-matrix shadow-matrix-soft disabled:cursor-wait disabled:opacity-60"
                >
                  {pendingAction === "join" || auth.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                  )}
                  {auth.loading
                    ? "Authenticating operator"
                    : pendingAction === "join"
                      ? "Linking remote daemon"
                      : authUnavailable
                        ? "Auth Required"
                        : "Join Session by Code"}
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-md border border-matrix/35 bg-matrix/8 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-matrix/70">
                    Room code
                  </p>
                  <p className="mt-1 break-all text-lg font-black text-white">
                    {roomCode}
                  </p>
                </div>
                <ConnectionBadge status={connectionStatus} />
              </div>
              <p className="mt-1 break-all text-[10px] text-cyber/75">
                {shareLink || "Shareable link initializes in browser runtime"}
              </p>
              <p
                className={[
                  "mt-3 border-l bg-black/35 px-3 py-2 text-[10px] uppercase",
                  roomSnapshot?.status === "active"
                    ? "border-matrix/50 text-matrix"
                    : "border-cyber/40 text-cyber"
                ].join(" ")}
              >
                {roomSnapshot?.status === "active"
                  ? "[SYSTEM]: Opponent connected. Remote breach active."
                  : copied
                    ? "[SYSTEM]: Link copied. Waiting for opponent..."
                    : "[SYSTEM]: Waiting for opponent..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyCode}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-cyber/35 bg-black/45 px-3 py-2 text-xs font-bold uppercase text-cyber"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {copied ? "Copied" : "Copy Link"}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                disabled={!roomSnapshot}
                onClick={() => {
                  if (roomSnapshot) {
                    onStartRemote(
                      roomCode,
                      playerName.trim() || "ALMATY_RUNNER",
                      "runner",
                      roomSnapshot
                    );
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-matrix/45 bg-matrix/10 px-3 py-2 text-xs font-bold uppercase text-matrix shadow-matrix-soft"
              >
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                Enter as Runner
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Remote shell operation failed.";
}

function buildShareLink(roomCode: string) {
  if (typeof window === "undefined") {
    return roomCode;
  }

  return `${window.location.origin}?room=${encodeURIComponent(roomCode)}`;
}

async function copyToClipboard(value: string) {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

function ConnectionBadge({ status }: { status: RemoteConnectionStatus }) {
  const online = status === "connected";
  const Icon = online ? Wifi : WifiOff;

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black uppercase",
        online
          ? "border-matrix/45 text-matrix"
          : status === "error" || status === "closed"
            ? "border-danger/45 text-danger"
            : "border-cyber/35 text-cyber"
      ].join(" ")}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {status === "idle" ? "standby" : status}
    </span>
  );
}
