"use client";

import { Lock, LogOut, RotateCcw, Terminal, Zap } from "lucide-react";
import { motion } from "framer-motion";

type HeaderBarProps = {
  authLabel?: string;
  modeLabel?: string;
  onOpenPro?: () => void;
  onReset?: () => void;
  onSignOut?: () => void;
  turnLabel: string;
};

export function HeaderBar({
  authLabel,
  modeLabel,
  onOpenPro,
  onReset,
  onSignOut,
  turnLabel
}: HeaderBarProps) {
  return (
    <header className="relative z-10 flex flex-col gap-4 border-b border-cyber/20 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-matrix/40 bg-matrix/10 shadow-matrix-soft">
            <Terminal className="h-5 w-5 text-matrix" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-cyber/75">
              underground node duel
            </p>
            <h1 className="truncate text-2xl font-black uppercase text-white sm:text-3xl">
              Netrunner Checkers
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-matrix/25 bg-black/45 px-3 py-2 text-xs uppercase text-matrix shadow-matrix-soft">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>Turn: {turnLabel}</span>
          </div>

          {modeLabel && (
            <div className="rounded-md border border-cyber/25 bg-black/45 px-3 py-2 text-xs font-bold uppercase text-cyber">
              {modeLabel}
            </div>
          )}

          {authLabel && (
            <div className="rounded-md border border-matrix/25 bg-black/45 px-3 py-2 text-xs font-bold uppercase text-matrix">
              NODE_AUTH: [{authLabel}] // SECURE_SESSION
            </div>
          )}

          {onReset && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-md border border-cyber/35 bg-cyber/10 px-4 py-2 text-xs font-bold uppercase text-cyber shadow-cyber-soft"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>New Match</span>
            </motion.button>
          )}

          {onSignOut && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-md border border-cyber/25 bg-black/45 px-3 py-2 text-xs font-bold uppercase text-cyber/80 transition hover:border-cyber/55 hover:text-cyber"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Logout</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenPro}
            className="inline-flex items-center gap-2 rounded-md border border-danger/45 bg-danger/10 px-4 py-2 text-xs font-bold uppercase text-danger/85 shadow-danger-soft transition hover:border-danger hover:text-danger"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Root Access Pro</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
