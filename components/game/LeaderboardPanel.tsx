"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export type LeaderboardRow = {
  alias: string;
  city: string;
  current?: boolean;
  id: string;
  rating: number;
};

type LeaderboardPanelProps = {
  rows: LeaderboardRow[];
};

export const CURRENT_USER_ID = "current-user";

export const DEFAULT_LEADERBOARD: LeaderboardRow[] = [
  { id: "aru-nova", alias: "ARU_NOVA", city: "Almaty", rating: 2430 },
  { id: "saryarqa", alias: "SARYARQA_7", city: "Astana", rating: 2295 },
  { id: "shym-root", alias: "SHYMKENT.EXE", city: "Shymkent", rating: 2180 },
  { id: "tengri", alias: "TENGRI_ROOT", city: "Almaty", rating: 2075 },
  { id: "qar-null", alias: "QARAGANDA_NULL", city: "Karaganda", rating: 1840 },
  { id: "taraz-trace", alias: "TARAZ_TRACE", city: "Taraz", rating: 1508 },
  {
    id: CURRENT_USER_ID,
    alias: "YOU_RUNNER",
    city: "Almaty",
    current: true,
    rating: 1490
  }
];

export function LeaderboardPanel({ rows }: LeaderboardPanelProps) {
  const sortedRows = [...rows].sort((a, b) => b.rating - a.rating);

  return (
    <section className="cyber-panel overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-cyber/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-matrix">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          <span>Top Hackers of Almaty</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-cyber/70">
          Hack Rating
        </span>
      </div>

      <div className="space-y-2 p-3">
        {sortedRows.map((row, index) => (
          <motion.div
            layout
            key={row.id}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={[
              "grid grid-cols-[2.25rem_minmax(0,1fr)_4.25rem] items-center gap-3 rounded-md border px-3 py-2 text-xs",
              row.current
                ? "border-matrix/70 bg-matrix/12 text-white shadow-matrix-soft"
                : "border-cyber/15 bg-black/32 text-cyber/80"
            ].join(" ")}
          >
            <span
              className={[
                "grid h-7 w-7 place-items-center rounded-md border font-black",
                row.current
                  ? "border-matrix/70 text-matrix"
                  : "border-cyber/25 text-cyber"
              ].join(" ")}
            >
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-bold uppercase">
                {row.alias}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-white/45">
                {row.city}
              </span>
            </span>
            <span className="text-right font-black text-white">
              {row.rating}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
