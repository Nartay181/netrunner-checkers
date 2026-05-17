"use client";

import { Bot, Play, Shield, Skull, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  AI_DIFFICULTIES,
  type AiDifficulty
} from "@/lib/ai";
import type { NodeSide } from "@/lib/checkers";
import type { RoomSnapshot } from "@/lib/multiplayer";
import { GameHistoryPanel } from "./GameHistoryPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { MultiplayerLobby } from "./MultiplayerLobby";
import { PlayerProfilePanel } from "./PlayerProfilePanel";
import type { AuthController } from "@/hooks/useAuth";

export type GameMode = "pvp" | "ai" | "remote";

export type MatchConfig = {
  difficulty: AiDifficulty;
  mode: GameMode;
  initialRoomSnapshot?: RoomSnapshot;
  playerName?: string;
  playerSide?: NodeSide;
  roomCode?: string;
};

type MatchSetupProps = {
  authenticated: boolean;
  authEmail?: string | null;
  authLoading: boolean;
  authProfile: AuthController["profile"];
  authUserId?: string;
  authUsername: string;
  historyRefreshKey: number;
  leaderboardRefreshKey: number;
  onStartRemote: (
    roomCode: string,
    playerName: string,
    playerSide: NodeSide,
    snapshot: RoomSnapshot
  ) => void;
  onStart: (config: MatchConfig) => void;
};

const difficultyIcons = {
  "script-kiddie": Shield,
  specialist: Bot,
  "rogue-ai": Skull
};

export function MatchSetup({
  authenticated,
  authEmail,
  authLoading,
  authProfile,
  authUserId,
  authUsername,
  historyRefreshKey,
  leaderboardRefreshKey,
  onStart,
  onStartRemote
}: MatchSetupProps) {
  return (
    <div className="relative z-10 mx-auto grid w-full max-w-[98rem] items-start gap-4 overflow-x-hidden px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)_minmax(18rem,22rem)] xl:px-8 xl:py-8">
      <div className="order-2 grid min-w-0 gap-4 sm:gap-5 xl:order-1">
        <PlayerProfilePanel
          authenticated={authenticated}
          email={authEmail}
          loading={authLoading}
          profile={authProfile}
          username={authUsername}
        />
        <GameHistoryPanel
          refreshKey={historyRefreshKey}
          userId={authUserId}
        />
      </div>

      <section className="cyber-panel order-1 grid min-w-0 content-start gap-4 rounded-lg p-4 sm:gap-5 sm:p-5 xl:order-2">
        <div className="border-b border-cyber/20 pb-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyber/75 sm:text-xs sm:tracking-[0.3em]">
            breach protocol
          </p>
          <h2 className="mt-2 text-xl font-black uppercase text-white sm:text-2xl lg:text-3xl">
            Select Match Vector
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onStart({ mode: "pvp", difficulty: "script-kiddie" })
            }
            className="group rounded-lg border border-matrix/35 bg-matrix/8 p-4 text-left shadow-matrix-soft transition-colors hover:bg-matrix/12 sm:p-5"
          >
            <Users className="mb-5 h-8 w-8 text-matrix" aria-hidden="true" />
            <span className="block text-lg font-black uppercase text-white">
              Local PvP
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.18em] text-matrix/75">
              2 Players
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-md border border-matrix/40 px-3 py-2 text-xs font-bold uppercase text-matrix">
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Launch
            </span>
          </motion.button>

          <div className="rounded-lg border border-danger/35 bg-danger/8 p-4 shadow-danger-soft sm:p-5">
            <Bot className="mb-5 h-8 w-8 text-danger" aria-hidden="true" />
            <span className="block text-lg font-black uppercase text-white">
              Vs AI
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.18em] text-danger/75">
              System Breach
            </span>

            <div className="mt-5 grid gap-2">
              {AI_DIFFICULTIES.map((difficulty) => {
                const Icon = difficultyIcons[difficulty.id];

                return (
                  <motion.button
                    key={difficulty.id}
                    type="button"
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      onStart({ mode: "ai", difficulty: difficulty.id })
                    }
                    className="flex items-center justify-between rounded-md border border-cyber/20 bg-black/35 px-3 py-2 text-left text-xs uppercase text-cyber transition-colors hover:border-danger/55 hover:text-danger"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{difficulty.label}</span>
                    </span>
                    <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <MultiplayerLobby
          authUsername={authUsername}
          onStartRemote={onStartRemote}
        />
      </section>

      <div className="order-3 grid min-w-0 gap-4 sm:gap-5">
        <LeaderboardPanel
          currentUserId={authUserId}
          refreshKey={leaderboardRefreshKey}
        />
      </div>
    </div>
  );
}
