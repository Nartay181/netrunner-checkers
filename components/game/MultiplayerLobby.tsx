"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, RadioTower, Satellite, Terminal } from "lucide-react";
import {
  createInitialRoomSnapshot,
  generateRoomCode,
  syncRoomSnapshot
} from "@/lib/multiplayer";

type MultiplayerLobbyProps = {
  onStartRemote: (roomCode: string, playerName: string) => void;
};

export function MultiplayerLobby({ onStartRemote }: MultiplayerLobbyProps) {
  const [playerName, setPlayerName] = useState("ALMATY_RUNNER");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareLink = useMemo(() => {
    if (!roomCode || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}?room=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  async function createRoom() {
    const nextRoomCode = generateRoomCode();
    const snapshot = createInitialRoomSnapshot(nextRoomCode, playerName);

    setRoomCode(nextRoomCode);
    await syncRoomSnapshot(snapshot);
  }

  async function copyCode() {
    if (!roomCode) {
      return;
    }

    await navigator.clipboard?.writeText(shareLink || roomCode);
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
          Supabase ready
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

        {!roomCode ? (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={createRoom}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-cyber/45 bg-cyber/10 px-4 py-2 text-xs font-bold uppercase text-cyber shadow-cyber-soft"
          >
            <Satellite className="h-4 w-4" aria-hidden="true" />
            Create Private Session
          </motion.button>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-md border border-matrix/35 bg-matrix/8 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-matrix/70">
                Room code
              </p>
              <p className="mt-1 break-all text-lg font-black text-white">
                {roomCode}
              </p>
              <p className="mt-1 break-all text-[10px] text-cyber/75">
                {shareLink || "Shareable link initializes in browser runtime"}
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
                {copied ? "Copied" : "Copy"}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartRemote(roomCode, playerName)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-matrix/45 bg-matrix/10 px-3 py-2 text-xs font-bold uppercase text-matrix shadow-matrix-soft"
              >
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                Launch
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
