"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Crown, Loader2, MapPin, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";
import type { Database } from "@/utils/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type LeaderboardRow = Pick<
  ProfileRow,
  "city" | "elo" | "id" | "username"
>;

type NetworkFilter = "all" | "almaty";

type LeaderboardPanelProps = {
  currentUserId?: string;
  refreshKey?: number;
};

const FILTERS: Array<{
  id: NetworkFilter;
  label: string;
}> = [
  { id: "all", label: "[ ALL NETWORKS ]" },
  { id: "almaty", label: "[ ALMATY NODE ]" }
];

export function LeaderboardPanel({
  currentUserId,
  refreshKey = 0
}: LeaderboardPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [activeFilter, setActiveFilter] = useState<NetworkFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      if (!supabase) {
        if (mounted) {
          setError(getMissingSupabaseEnvMessage());
          setRows([]);
          setLoading(false);
        }

        return;
      }

      const { data, error: leaderboardError } = await supabase
        .from("profiles")
        .select("id, username, elo, city")
        .order("elo", { ascending: false });

      if (!mounted) {
        return;
      }

      if (leaderboardError) {
        setError(leaderboardError.message);
        setRows([]);
      } else {
        setRows(normalizeLeaderboardRows(data ?? []));
      }

      setLoading(false);
    }

    void fetchLeaderboard();

    return () => {
      mounted = false;
    };
  }, [refreshKey, supabase]);

  const filteredRows = useMemo(() => {
    const sortedRows = [...rows].sort((a, b) => b.elo - a.elo);

    if (activeFilter === "almaty") {
      return sortedRows.filter((row) => row.city === "Almaty");
    }

    return sortedRows;
  }, [activeFilter, rows]);

  return (
    <section className="cyber-panel min-w-0 overflow-hidden rounded-lg border border-cyber/20 bg-black/55">
      <div className="border-b border-cyber/20 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-xs font-black uppercase text-matrix sm:text-sm">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Netrunner Leaderboard</span>
            </div>
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-cyber/60 sm:tracking-[0.2em]">
              Live Supabase Rankings
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-md border border-cyber/20 bg-black/45 p-1 sm:w-auto">
            {FILTERS.map((filter) => {
              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={[
                    "rounded px-2 py-2 text-[9px] font-black uppercase transition sm:px-2.5 sm:text-[10px]",
                    active
                      ? "bg-matrix/14 text-matrix shadow-matrix-soft"
                      : "text-cyber/65 hover:bg-cyber/8 hover:text-cyber"
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-3">
        {loading ? (
          <LeaderboardStatus
            icon={<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            message="[SYSTEM]: Fetching global matrix ranks..."
            tone="matrix"
          />
        ) : error ? (
          <LeaderboardStatus
            icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            message={`[ERROR]: ${error}`}
            tone="danger"
          />
        ) : filteredRows.length === 0 ? (
          <LeaderboardStatus
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            message={
              activeFilter === "almaty"
                ? "[SYSTEM]: No Almaty operators found yet."
                : "[SYSTEM]: No operators registered in the matrix yet."
            }
            tone="cyber"
          />
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-cyber/65">
                  <th className="w-14 px-2 py-1 font-black sm:w-16 sm:px-3">
                    Rank
                  </th>
                  <th className="px-2 py-1 font-black sm:px-3">
                    Operator
                    <span className="hidden sm:inline"> (Username)</span>
                  </th>
                  <th className="w-20 px-2 py-1 text-right font-black sm:w-24 sm:px-3">
                    Elo
                  </th>
                  <th className="hidden w-28 px-3 py-1 font-black sm:table-cell">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredRows.map((row, index) => (
                    <LeaderboardTableRow
                      current={row.id === currentUserId}
                      key={row.id}
                      rank={index + 1}
                      row={row}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

type LeaderboardTableRowProps = {
  current: boolean;
  rank: number;
  row: LeaderboardRow;
};

function LeaderboardTableRow({
  current,
  rank,
  row
}: LeaderboardTableRowProps) {
  const rankTone = getRankTone(rank);
  const RankIcon = rank <= 3 ? Crown : null;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={[
        "group rounded-md text-xs transition",
        current ? "text-white" : "text-cyber/86"
      ].join(" ")}
    >
      <td
        className={[
          "rounded-l-md border-y border-l px-2 py-2.5 sm:px-3 sm:py-3",
          current
            ? "border-matrix/55 bg-matrix/12"
            : `${rankTone.shell} bg-zinc-950/82 group-hover:bg-zinc-900/95`
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-md border px-1.5 font-black sm:h-8 sm:min-w-8 sm:px-2",
            current
              ? "border-matrix/70 text-matrix shadow-matrix-soft"
              : rankTone.badge
          ].join(" ")}
        >
          {RankIcon && <RankIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          {rank}
        </span>
      </td>
      <td
        className={[
          "border-y px-2 py-2.5 sm:px-3 sm:py-3",
          current
            ? "border-matrix/55 bg-matrix/12"
            : `${rankTone.middle} bg-zinc-950/82 group-hover:bg-zinc-900/95`
        ].join(" ")}
      >
        <span className="block truncate text-[11px] font-black uppercase text-white sm:text-xs">
          {row.username}
        </span>
        {current && (
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-matrix">
            Current Operator
          </span>
        )}
      </td>
      <td
        className={[
          "rounded-r-md border-y border-r px-2 py-2.5 text-right sm:rounded-none sm:border-r-0 sm:px-3 sm:py-3",
          current
            ? "border-matrix/55 bg-matrix/12"
            : `${rankTone.middle} bg-zinc-950/82 group-hover:bg-zinc-900/95`
        ].join(" ")}
      >
        <span className="font-black text-white">{row.elo.toLocaleString()}</span>
      </td>
      <td
        className={[
          "hidden rounded-r-md border-y border-r px-3 py-3 sm:table-cell",
          current
            ? "border-matrix/55 bg-matrix/12"
            : `${rankTone.shell} bg-zinc-950/82 group-hover:bg-zinc-900/95`
        ].join(" ")}
      >
        <span className="inline-flex items-center gap-1.5 text-cyber/80">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {row.city ?? "Unknown"}
        </span>
      </td>
    </motion.tr>
  );
}

type LeaderboardStatusProps = {
  icon: ReactNode;
  message: string;
  tone: "cyber" | "danger" | "matrix";
};

function LeaderboardStatus({ icon, message, tone }: LeaderboardStatusProps) {
  const toneClass = {
    cyber: "border-cyber/30 bg-cyber/8 text-cyber",
    danger: "border-danger/40 bg-danger/10 text-danger",
    matrix: "border-matrix/35 bg-matrix/8 text-matrix"
  }[tone];

  return (
    <div
      className={[
        "flex items-center gap-2 rounded-md border px-3 py-3 text-[11px] font-bold uppercase leading-relaxed sm:py-4 sm:text-xs",
        toneClass
      ].join(" ")}
    >
      {icon}
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}

function normalizeLeaderboardRows(rows: LeaderboardRow[]) {
  return rows.map((row) => ({
    city: row.city,
    elo: row.elo ?? 1000,
    id: row.id,
    username: row.username || "UNKNOWN_OPERATOR"
  }));
}

function getRankTone(rank: number) {
  if (rank === 1) {
    return {
      badge: "border-yellow-300/70 bg-yellow-300/12 text-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.24)]",
      middle: "border-yellow-300/20",
      shell: "border-yellow-300/35"
    };
  }

  if (rank === 2) {
    return {
      badge: "border-slate-200/70 bg-slate-200/10 text-slate-100 shadow-[0_0_16px_rgba(226,232,240,0.18)]",
      middle: "border-slate-200/18",
      shell: "border-slate-200/30"
    };
  }

  if (rank === 3) {
    return {
      badge: "border-orange-300/70 bg-orange-300/10 text-orange-200 shadow-[0_0_16px_rgba(251,146,60,0.18)]",
      middle: "border-orange-300/18",
      shell: "border-orange-300/30"
    };
  }

  return {
    badge: "border-cyber/25 text-cyber",
    middle: "border-cyber/12",
    shell: "border-cyber/18"
  };
}
