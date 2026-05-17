"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock3, Loader2, ScrollText } from "lucide-react";
import {
  fetchUserMatchHistory,
  type MatchHistoryRow
} from "@/lib/gameHistory";
import { createClient } from "@/utils/supabase/client";
import { getMissingSupabaseEnvMessage } from "@/utils/supabase/env";

type GameHistoryPanelProps = {
  refreshKey?: number;
  userId?: string;
};

export function GameHistoryPanel({
  refreshKey = 0,
  userId
}: GameHistoryPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [rows, setRows] = useState<MatchHistoryRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }

      if (!supabase) {
        setRows([]);
        setError(getMissingSupabaseEnvMessage());
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await fetchUserMatchHistory(supabase, userId);

      if (!mounted) {
        return;
      }

      setRows(result.data);
      setError(result.error);
      setLoading(false);
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [refreshKey, supabase, userId]);

  return (
    <section className="cyber-panel min-w-0 overflow-hidden rounded-lg border border-cyber/20 bg-black/55">
      <div className="flex items-center justify-between gap-3 border-b border-cyber/20 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-xs font-black uppercase text-cyber sm:text-sm">
          <ScrollText className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">Game History</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-matrix/70">
          Archive
        </span>
      </div>

      <div className="p-2.5 sm:p-3">
        {loading ? (
          <HistoryStatus
            loading
            message="[SYSTEM]: Loading archived breach records..."
          />
        ) : error ? (
          <HistoryStatus danger message={`[HISTORY_ERROR]: ${error}`} />
        ) : !userId ? (
          <HistoryStatus message="[SYSTEM]: Authenticate to unlock match archive." />
        ) : rows.length === 0 ? (
          <HistoryStatus message="[SYSTEM]: No completed matches archived yet." />
        ) : (
          <div className="grid gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.25rem] gap-2 px-2 text-[9px] font-black uppercase tracking-[0.12em] text-cyber/55 sm:grid-cols-[1.1fr_minmax(0,1fr)_0.8fr_0.7fr] sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
              <span className="hidden sm:block">Date</span>
              <span>Opponent</span>
              <span>Result</span>
              <span className="text-right">Elo</span>
            </div>
            {rows.map((row) => (
              <HistoryRow key={row.id} row={row} userId={userId} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type HistoryRowProps = {
  row: MatchHistoryRow;
  userId: string;
};

function HistoryRow({ row, userId }: HistoryRowProps) {
  const playerIsRed = row.player_red_id === userId;
  const opponentName = playerIsRed
    ? row.player_black_name
    : row.player_red_name;
  const result = getUserResult(row, userId);
  const eloChange = getSignedEloChange(row, userId, result);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.25rem] items-center gap-2 rounded-md border border-cyber/14 bg-zinc-950/80 px-2.5 py-2.5 text-[11px] text-cyber/85 transition hover:border-cyber/35 hover:bg-zinc-900/90 sm:grid-cols-[1.1fr_minmax(0,1fr)_0.8fr_0.7fr] sm:px-3 sm:py-3 sm:text-xs"
    >
      <span className="hidden min-w-0 items-center gap-2 text-white/80 sm:flex">
        <Clock3 className="h-3.5 w-3.5 shrink-0 text-cyber" aria-hidden="true" />
        <span className="truncate">{formatHistoryDate(row.created_at)}</span>
      </span>
      <span className="truncate font-bold uppercase text-white">
        {opponentName}
      </span>
      <span
        className={[
          "w-fit rounded border px-1.5 py-1 text-[9px] font-black uppercase sm:px-2 sm:text-[10px]",
          result === "WIN"
            ? "border-matrix/45 bg-matrix/10 text-matrix"
            : result === "LOSS"
              ? "border-danger/45 bg-danger/10 text-danger"
              : "border-cyber/35 bg-cyber/8 text-cyber"
        ].join(" ")}
      >
        <span className="hidden sm:inline">RESULT: </span>
        {result}
      </span>
      <span
        className={[
          "text-right font-black",
          eloChange > 0
            ? "text-matrix"
            : eloChange < 0
              ? "text-danger"
              : "text-cyber/70"
        ].join(" ")}
      >
        {eloChange > 0 ? "+" : ""}
        {eloChange}
      </span>
    </motion.div>
  );
}

type HistoryStatusProps = {
  danger?: boolean;
  loading?: boolean;
  message: string;
};

function HistoryStatus({ danger, loading, message }: HistoryStatusProps) {
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-md border px-3 py-3 text-[11px] font-bold uppercase leading-relaxed sm:py-4 sm:text-xs",
        danger
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-cyber/25 bg-cyber/8 text-cyber"
      ].join(" ")}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}

function getUserResult(row: MatchHistoryRow, userId: string) {
  if (row.winner_id === userId) {
    return "WIN";
  }

  if (!row.winner_id) {
    const opponentId =
      row.player_red_id === userId ? row.player_black_id : row.player_red_id;

    return opponentId ? "DRAW" : "LOSS";
  }

  return "LOSS";
}

function getSignedEloChange(
  row: MatchHistoryRow,
  userId: string,
  result: "DRAW" | "LOSS" | "WIN"
) {
  if (result === "DRAW") {
    return 0;
  }

  const magnitude = Math.abs(row.elo_change);

  return result === "WIN" || row.winner_id === userId ? magnitude : -magnitude;
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
