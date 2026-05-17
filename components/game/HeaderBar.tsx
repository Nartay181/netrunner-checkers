"use client";

import { Lock, Terminal, Zap } from "lucide-react";
import { motion } from "framer-motion";

type HeaderBarProps = {
  turnLabel: string;
};

export function HeaderBar({ turnLabel }: HeaderBarProps) {
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

          <motion.button
            type="button"
            disabled
            whileHover={{ y: -1 }}
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-danger/45 bg-danger/10 px-4 py-2 text-xs font-bold uppercase text-danger/85 shadow-danger-soft"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Pro Upgrade</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
