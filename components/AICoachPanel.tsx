"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Play, ScanLine, X } from "lucide-react";
import type { MatchStatus, MoveRecord } from "./game/useCheckers";

type AICoachPanelProps = {
  matchStatus: MatchStatus | null;
  moveHistory: MoveRecord[];
  onPlayAgain: () => void;
};

export function AICoachPanel({
  matchStatus,
  moveHistory,
  onPlayAgain
}: AICoachPanelProps) {
  const [dismissed, setDismissed] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const analysis = useMemo(
    () => generateCoachAnalysis(moveHistory, matchStatus),
    [matchStatus, moveHistory]
  );
  const open = Boolean(matchStatus && !dismissed);

  useEffect(() => {
    if (matchStatus) {
      setDismissed(false);
      setActiveLine(0);
    }
  }, [matchStatus]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 grid place-items-center overflow-x-hidden overflow-y-auto bg-black/82 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="cyber-panel relative w-full max-w-5xl overflow-hidden rounded-lg border-matrix/45 shadow-[0_0_80px_rgba(0,255,65,0.18)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-35">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.08)_1px,transparent_1px)] bg-[length:100%_6px]" />
              <motion.div
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyber/15 via-matrix/10 to-transparent"
                animate={{ y: ["-120%", "760%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="relative border-b border-cyber/25 px-4 py-4 sm:px-7 sm:py-5">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-md border border-cyber/25 text-cyber transition hover:border-danger/60 hover:text-danger"
                aria-label="Close Analysis"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cyber sm:text-xs sm:tracking-[0.28em]">
                <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                Kernel coach uplink
              </div>

              <div className="relative pr-10">
                <GlitchTitle text="KERNEL ANALYSIS COMPLETE" />
                <p className="mt-3 max-w-3xl text-[10px] uppercase leading-relaxed tracking-[0.14em] text-matrix/80 sm:text-xs sm:tracking-[0.2em]">
                  Match terminal reviewed. Tactical signal extracted from move
                  history.
                </p>
              </div>
            </div>

            <div className="relative grid gap-4 p-4 sm:gap-5 sm:p-7 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="rounded-lg border border-cyber/20 bg-black/45 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-cyber">
                  <ScanLine className="h-4 w-4" aria-hidden="true" />
                  Scan Result
                </div>
                <dl className="grid gap-3 text-xs uppercase">
                  <div className="rounded-md border border-matrix/20 bg-matrix/8 p-3">
                    <dt className="text-matrix/60">Outcome</dt>
                    <dd className="mt-1 font-black text-white">
                      {matchStatus?.winner === "draw"
                        ? "DRAW"
                        : `${matchStatus?.winner.toUpperCase()} WIN`}
                    </dd>
                  </div>
                  <div className="rounded-md border border-cyber/20 bg-black/35 p-3">
                    <dt className="text-cyber/60">Vectors</dt>
                    <dd className="mt-1 font-black text-white">
                      {moveHistory.length}
                    </dd>
                  </div>
                  <div className="rounded-md border border-danger/20 bg-danger/8 p-3">
                    <dt className="text-danger/65">Reason</dt>
                    <dd className="mt-1 leading-relaxed text-white">
                      {matchStatus?.reason ?? "Status channel stable"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-3">
                {analysis.map((line, index) =>
                  index <= activeLine ? (
                    <TypewriterLine
                      key={line}
                      active={index === activeLine}
                      line={line}
                      onDone={() =>
                        setActiveLine((current) =>
                          Math.min(current + 1, analysis.length - 1)
                        )
                      }
                    />
                  ) : null
                )}
              </div>
            </div>

            <div className="relative flex flex-col gap-3 border-t border-cyber/20 px-4 py-4 sm:flex-row sm:justify-end sm:px-7 sm:py-5">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDismissed(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-cyber/40 bg-black/45 px-4 py-3 text-xs font-black uppercase text-cyber"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Close Analysis
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onPlayAgain}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-matrix/55 bg-matrix/12 px-4 py-3 text-xs font-black uppercase text-matrix shadow-matrix-soft"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Play Again
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GlitchTitle({ text }: { text: string }) {
  return (
    <h2 className="relative text-2xl font-black uppercase tracking-normal text-white sm:text-4xl lg:text-5xl">
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 text-cyber blur-[1px]"
        animate={{ x: [-1, 2, -2, 0], opacity: [0.2, 0.8, 0.35] }}
        transition={{ duration: 0.52, repeat: Infinity }}
      >
        {text}
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 text-matrix blur-[2px]"
        animate={{ x: [2, -1, 1, 0], opacity: [0.25, 0.65, 0.3] }}
        transition={{ duration: 0.68, repeat: Infinity }}
      >
        {text}
      </motion.span>
      <span className="relative text-white drop-shadow-[0_0_18px_rgba(0,255,65,0.42)]">
        {text}
      </span>
    </h2>
  );
}

function TypewriterLine({
  active,
  line,
  onDone
}: {
  active: boolean;
  line: string;
  onDone: () => void;
}) {
  const [visibleText, setVisibleText] = useState(active ? "" : line);

  useEffect(() => {
    if (!active) {
      setVisibleText(line);
      return;
    }

    setVisibleText("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setVisibleText(line.slice(0, index));

      if (index >= line.length) {
        window.clearInterval(interval);
        onDone();
      }
    }, 14);

    return () => window.clearInterval(interval);
  }, [active, line, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative overflow-hidden rounded-md border border-matrix/25 bg-black/55 px-3 py-3 text-xs leading-relaxed text-matrix shadow-[inset_0_0_22px_rgba(0,255,65,0.06)] sm:px-4 sm:text-sm"
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-cyber/10 to-transparent"
        animate={{ x: ["-130%", "320%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative">
        {visibleText}
        {active && visibleText.length < line.length ? (
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, repeat: Infinity }}
            className="text-cyber"
          >
            _
          </motion.span>
        ) : null}
      </span>
    </motion.div>
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
