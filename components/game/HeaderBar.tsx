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
    <header className="relative z-10 flex flex-col gap-3 border-b border-cyber/20 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-matrix/40 bg-matrix/10 shadow-matrix-soft sm:h-11 sm:w-11">
            <Terminal className="h-4 w-4 text-matrix sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyber/75 sm:text-xs sm:tracking-[0.28em]">
              underground node duel
            </p>
            <h1 className="truncate text-xl font-black uppercase text-white sm:text-2xl lg:text-3xl">
              Netrunner Checkers
            </h1>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          <div className="col-span-1 flex min-w-0 items-center gap-2 rounded-md border border-matrix/25 bg-black/45 px-2.5 py-2 text-[10px] uppercase text-matrix shadow-matrix-soft sm:px-3 sm:text-xs">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">Turn: {turnLabel}</span>
          </div>

          {modeLabel && (
            <div className="col-span-1 min-w-0 truncate rounded-md border border-cyber/25 bg-black/45 px-2.5 py-2 text-[10px] font-bold uppercase text-cyber sm:px-3 sm:text-xs">
              {modeLabel}
            </div>
          )}

          {authLabel && (
            <div className="col-span-2 min-w-0 truncate rounded-md border border-matrix/25 bg-black/45 px-2.5 py-2 text-[10px] font-bold uppercase text-matrix sm:col-span-1 sm:max-w-[16rem] sm:px-3 sm:text-xs lg:max-w-[20rem]">
              NODE_AUTH: [{authLabel}] // SECURE_SESSION
            </div>
          )}

          {onReset && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReset}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md border border-cyber/35 bg-cyber/10 px-3 py-2 text-[10px] font-bold uppercase text-cyber shadow-cyber-soft sm:px-4 sm:text-xs"
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
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md border border-cyber/25 bg-black/45 px-3 py-2 text-[10px] font-bold uppercase text-cyber/80 transition hover:border-cyber/55 hover:text-cyber sm:text-xs"
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
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-md border border-danger/45 bg-danger/10 px-3 py-2 text-[10px] font-bold uppercase text-danger/85 shadow-danger-soft transition hover:border-danger hover:text-danger sm:px-4 sm:text-xs"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Root Access Pro</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
