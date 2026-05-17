"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  BOARD_SIZE,
  type BoardState,
  type Coordinate,
  coordinateKey,
  getSquareName,
  isPlayableSquare,
  sameCoordinate
} from "@/lib/checkers";
import { NodePiece } from "./NodePiece";

type CyberBoardProps = {
  board: BoardState;
  captureDestinationKeys: Set<string>;
  captureRequired: boolean;
  captureSourceKeys: Set<string>;
  forcedFrom: Coordinate | null;
  legalDestinationKeys: Set<string>;
  selected: Coordinate | null;
  onCellClick: (row: number, col: number) => void;
};

export function CyberBoard({
  board,
  captureDestinationKeys,
  captureRequired,
  captureSourceKeys,
  forcedFrom,
  legalDestinationKeys,
  selected,
  onCellClick
}: CyberBoardProps) {
  return (
    <section className="w-full min-w-0">
      <LayoutGroup>
        <div className="board-frame circuit-board relative mx-auto grid aspect-square grid-cols-8 overflow-hidden rounded-lg border border-matrix/45 p-2 shadow-[0_0_60px_rgba(0,255,65,0.16),inset_0_0_38px_rgba(0,243,255,0.08)]">
          <div className="pointer-events-none absolute inset-0 z-10 border border-cyber/25" />
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-px bg-cyber/25 shadow-cyber-soft" />
          <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-px w-full bg-matrix/25 shadow-matrix-soft" />

          {Array.from({ length: BOARD_SIZE }, (_, row) =>
            Array.from({ length: BOARD_SIZE }, (_, col) => {
              const piece = board[row][col];
              const playable = isPlayableSquare(row, col);
              const key = coordinateKey({ row, col });
              const isSelected =
                selected?.row === row && selected?.col === col;
              const canMoveTarget = legalDestinationKeys.has(key);
              const isCaptureTarget = captureDestinationKeys.has(key);
              const hasMandatoryJump = Boolean(piece && captureSourceKeys.has(key));
              const isForcedChainNode = sameCoordinate(forcedFrom, { row, col });

              return (
                <motion.button
                  key={`${row}-${col}`}
                  type="button"
                  aria-label={`${getSquareName({ row, col })}${
                    piece ? ` ${piece.side} ${piece.king ? "root node" : "node"}` : ""
                  }`}
                  onClick={() => onCellClick(row, col)}
                  whileHover={
                    playable
                      ? {
                          backgroundColor: piece
                            ? "rgba(255,255,255,0.035)"
                            : "rgba(0,255,65,0.09)"
                        }
                      : undefined
                  }
                  className={[
                    "group relative isolate flex aspect-square items-center justify-center overflow-hidden border text-[10px] uppercase transition-colors",
                    playable
                      ? "border-matrix/18 bg-black/50"
                      : "border-cyber/10 bg-white/[0.025]",
                    isSelected
                      ? "shadow-[inset_0_0_28px_rgba(0,255,65,0.32)]"
                      : "",
                    hasMandatoryJump
                      ? "border-danger/70 shadow-[inset_0_0_24px_rgba(255,0,60,0.18)]"
                      : "",
                    isForcedChainNode
                      ? "ring-2 ring-danger/80 ring-offset-2 ring-offset-black"
                      : "",
                    canMoveTarget
                      ? "cursor-crosshair shadow-[inset_0_0_24px_rgba(0,243,255,0.16)]"
                      : "cursor-pointer"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none absolute inset-0 opacity-0 transition-opacity",
                      playable ? "group-hover:opacity-100" : "",
                      "bg-[linear-gradient(135deg,transparent_42%,rgba(0,255,65,0.16)_43%,rgba(0,255,65,0.16)_45%,transparent_46%)]"
                    ].join(" ")}
                  />
                  <span className="pointer-events-none absolute left-1 top-1 text-[9px] text-cyber/30">
                    {getSquareName({ row, col })}
                  </span>
                  {canMoveTarget && (
                    <span
                      className={[
                        "pointer-events-none absolute h-3 w-3 rounded-full border shadow-cyber-soft",
                        isCaptureTarget
                          ? "border-danger/80 bg-danger/30 shadow-danger-soft"
                          : "border-cyber/60 bg-cyber/20"
                      ].join(" ")}
                    />
                  )}
                  {captureRequired && hasMandatoryJump && !isSelected && (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-2 rounded-md border border-danger/55"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.28, 0.82, 0.28] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}

                  <AnimatePresence mode="popLayout">
                    {piece && (
                      <NodePiece
                        piece={piece}
                        selected={isSelected}
                        mustCapture={hasMandatoryJump}
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })
          )}
        </div>
      </LayoutGroup>
    </section>
  );
}
