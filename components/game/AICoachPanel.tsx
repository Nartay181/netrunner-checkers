"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, ScanLine } from "lucide-react";
import type { MatchStatus, MoveRecord } from "./useCheckers";

type AICoachPanelProps = {
  matchStatus: MatchStatus | null;
  moveHistory: MoveRecord[];
};

export function AICoachPanel({
  matchStatus,
  moveHistory
}: AICoachPanelProps) {
  const analysis = useMemo(
    () => generateCoachAnalysis(moveHistory, matchStatus),
    [matchStatus, moveHistory]
  );

  return (
    <AnimatePresence>
      {matchStatus && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          className="cyber-panel overflow-hidden rounded-lg"
        >
          <div className="relative border-b border-danger/25 px-4 py-3">
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-danger/15 to-transparent"
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative flex items-center gap-2 text-sm font-black uppercase text-danger">
              <BrainCircuit className="h-4 w-4" aria-hidden="true" />
              <span>Kernel Analysis</span>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-md border border-cyber/20 bg-black/35 px-3 py-2 text-xs uppercase text-cyber">
              <span className="flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                Post-game scan
              </span>
              <span className="text-white">
                {matchStatus.winner === "draw"
                  ? "DRAW"
                  : `${matchStatus.winner.toUpperCase()} WIN`}
              </span>
            </div>

            {analysis.map((line, index) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.16 }}
                className="border-l border-matrix/70 bg-matrix/8 px-3 py-2 text-xs leading-relaxed text-matrix"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function generateCoachAnalysis(
  moveHistory: MoveRecord[],
  matchStatus: MatchStatus | null
) {
  const comments: string[] = [];
  const captures = moveHistory.filter((move) => move.kind === "capture");
  const promotions = moveHistory.filter((move) => move.promoted);
  const chains = moveHistory.filter((move) => move.chainContinued);
  const runnerCaptures = captures.filter((move) => move.side === "runner");
  const daemonCaptures = captures.filter((move) => move.side === "daemon");
  const openingCenterMoves = moveHistory
    .slice(0, 6)
    .filter((move) => ["C", "D", "E", "F"].includes(move.to[0] ?? ""));

  if (moveHistory.length === 0) {
    return [
      "[ANALYSIS]: No legal vectors executed. Kernel recommends initiating center pressure before perimeter drift.",
      "[ANALYSIS]: Recommendation: open with C3 -> D4 or E3 -> D4 style center control.",
      "[ANALYSIS]: Mandatory capture engine stayed idle; no tactical chain data recorded.",
      "[ANALYSIS]: Root Node race unresolved. Prioritize promotion lanes before engaging edge nodes."
    ];
  }

  comments.push(
    `[ANALYSIS]: Match terminated after ${moveHistory.length} executed vectors. ${matchStatus?.reason ?? "Status channel stable"}.`
  );

  if (chains[0]) {
    comments.push(
      `[ANALYSIS]: Multi-jump pressure detected on turn ${chains[0].sequence}: ${chains[0].from} -> ${chains[0].to}. Chain lock created material advantage.`
    );
  } else {
    comments.push(
      "[ANALYSIS]: No missed mandatory capture sequences registered. Strict protocol prevented illegal capture bypass."
    );
  }

  if (promotions[0]) {
    comments.push(
      `[ANALYSIS]: Root access achieved on turn ${promotions[0].sequence} at ${promotions[0].to}. Promotion lane control was decisive.`
    );
  } else {
    comments.push(
      "[ANALYSIS]: No Root Node promotion detected. Recommendation: accelerate back-row pressure with protected diagonal lanes."
    );
  }

  if (runnerCaptures.length !== daemonCaptures.length) {
    const leader =
      runnerCaptures.length > daemonCaptures.length ? "RUNNER" : "DAEMON";
    comments.push(
      `[ANALYSIS]: Capture economy favored ${leader}: ${runnerCaptures.length}-${daemonCaptures.length}. Material tempo shifted through forced decompiles.`
    );
  } else {
    comments.push(
      `[ANALYSIS]: Capture economy remained balanced at ${runnerCaptures.length}-${daemonCaptures.length}. Endgame hinged on vector mobility.`
    );
  }

  comments.push(
    openingCenterMoves.length >= 3
      ? "[ANALYSIS]: Strong opening topology. Center files were contested early, improving Root Node runway."
      : "[ANALYSIS]: Recommendation: prioritize center control in opening to accelerate Root Node creation."
  );

  comments.push(
    "[ANALYSIS]: Kernel coach upgrade path: replay heatmaps and deeper line search are reserved for Root Access analytics."
  );

  return comments.slice(0, 6);
}
