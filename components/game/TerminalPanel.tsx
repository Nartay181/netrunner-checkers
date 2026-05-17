"use client";

import { Activity, Cpu, ShieldAlert, Terminal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { NodeSide } from "@/lib/checkers";
import type { RemoteConnectionStatus } from "@/lib/multiplayer";
import type { MatchStatus } from "./useCheckers";

type TerminalPanelProps = {
  aiThinking: boolean;
  authUsername?: string;
  botEnabled: boolean;
  logs: string[];
  matchStatus: MatchStatus | null;
  nodeCounts: Record<NodeSide, number>;
  remoteConnectionStatus?: RemoteConnectionStatus;
  remoteError?: string | null;
  remoteOpponentConnected?: boolean;
  remoteWaiting?: boolean;
  selectedSquare: string | null;
};

export function TerminalPanel({
  aiThinking,
  authUsername,
  botEnabled,
  logs,
  matchStatus,
  nodeCounts,
  remoteConnectionStatus,
  remoteError,
  remoteOpponentConnected,
  remoteWaiting,
  selectedSquare
}: TerminalPanelProps) {
  return (
    <aside className="cyber-panel flex min-h-[420px] w-full flex-col rounded-lg lg:max-w-sm">
      <div className="flex items-center justify-between border-b border-cyber/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-cyber">
          <Terminal className="h-4 w-4" aria-hidden="true" />
          <span>Terminal Output</span>
        </div>
        <div className="flex items-center gap-2">
          {authUsername && (
            <span className="hidden max-w-[12rem] truncate text-[10px] font-bold uppercase text-matrix sm:inline">
              NODE_AUTH: [{authUsername}]
            </span>
          )}
          <span className="h-2 w-2 rounded-full bg-matrix shadow-matrix-hard" />
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-cyber/20 text-center text-xs uppercase">
        <div className="border-r border-cyber/15 px-3 py-3">
          <div className="mb-1 flex items-center justify-center gap-1 text-matrix">
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            Runner
          </div>
          <p className="text-lg font-black text-white">{nodeCounts.runner}</p>
        </div>
        <div className="border-r border-cyber/15 px-3 py-3">
          <div
            className={[
              "mb-1 flex items-center justify-center gap-1",
              botEnabled ? "text-danger" : "text-cyber"
            ].join(" ")}
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            {botEnabled ? "Kernel" : "Daemon"}
          </div>
          <p className="text-lg font-black text-white">{nodeCounts.daemon}</p>
        </div>
        <div className="px-3 py-3">
          <div className="mb-1 flex items-center justify-center gap-1 text-danger">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {matchStatus ? "Winner" : "Trace"}
          </div>
          <p className="truncate text-lg font-black text-white">
            {matchStatus?.winner.toUpperCase() ?? selectedSquare ?? "--"}
          </p>
        </div>
      </div>

      <div className="terminal-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {aiThinking && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative overflow-hidden border-l border-danger bg-danger/8 px-3 py-2 text-xs font-bold uppercase leading-relaxed text-danger"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-danger/20 to-transparent"
                animate={{ x: ["-110%", "220%"] }}
                transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative">
                [SYSTEM]: Scanning netspaces for optimal vectors...
              </span>
            </motion.div>
          )}
          {remoteWaiting && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative overflow-hidden border-l border-cyber bg-cyber/8 px-3 py-2 text-xs font-bold uppercase leading-relaxed text-cyber"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-cyber/25 to-transparent"
                animate={{ x: ["-110%", "220%"] }}
                transition={{ duration: 1.15, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative">[SYSTEM]: Waiting for opponent...</span>
            </motion.div>
          )}
          {!remoteWaiting && remoteOpponentConnected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative overflow-hidden border-l border-matrix bg-matrix/8 px-3 py-2 text-xs font-bold uppercase leading-relaxed text-matrix"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-matrix/20 to-transparent"
                animate={{ x: ["-110%", "220%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative">
                [SYSTEM]: Opponent connected. Realtime channel{" "}
                {remoteConnectionStatus ?? "idle"}.
              </span>
            </motion.div>
          )}
          {remoteError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-l border-danger bg-danger/10 px-3 py-2 text-xs font-bold uppercase leading-relaxed text-danger"
            >
              [REMOTE ERROR]: {remoteError}
            </motion.div>
          )}
        </AnimatePresence>
        {logs.map((log, index) => (
          <p
            key={`${log}-${index}`}
            className={[
              "border-l px-3 py-2 text-xs leading-relaxed",
              index === 0
                ? "border-matrix bg-matrix/8 text-matrix"
                : "border-cyber/25 bg-black/30 text-cyber/80"
            ].join(" ")}
          >
            {log}
          </p>
        ))}
      </div>
    </aside>
  );
}
