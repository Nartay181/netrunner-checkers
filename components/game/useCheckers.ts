"use client";

import { useMemo, useState } from "react";
import {
  applyLegalMove,
  coordinateKey,
  createInitialBoard,
  getAllLegalMoves,
  getCaptureMovesForPiece,
  getOpponent,
  getSquareName,
  isPlayableSquare,
  sameCoordinate,
  type BoardState,
  type Coordinate,
  type LegalMove,
  type NodeSide
} from "@/lib/checkers";

const INITIAL_LOGS = [
  "[SYSTEM]: Netrunner Checkers v0.2 Russian ruleset online",
  "[SYSTEM]: Matrix grid synchronized on 64 nodes",
  "[TRACE]: Mandatory capture protocol enabled"
];

export function useCheckers() {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [selected, setSelected] = useState<Coordinate | null>(null);
  const [forcedFrom, setForcedFrom] = useState<Coordinate | null>(null);
  const [activeSide, setActiveSide] = useState<NodeSide>("runner");
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);

  const legalMoves = useMemo(
    () => getAllLegalMoves(board, activeSide, forcedFrom),
    [activeSide, board, forcedFrom]
  );

  const captureRequired = legalMoves.some((move) => move.kind === "capture");

  const captureSourceKeys = useMemo(
    () =>
      new Set(
        legalMoves
          .filter((move) => move.kind === "capture")
          .map((move) => coordinateKey(move.from))
      ),
    [legalMoves]
  );

  const selectedMoves = useMemo(() => {
    if (!selected) {
      return [];
    }

    return legalMoves.filter((move) => sameCoordinate(move.from, selected));
  }, [legalMoves, selected]);

  const legalDestinationKeys = useMemo(
    () => new Set(selectedMoves.map((move) => coordinateKey(move.to))),
    [selectedMoves]
  );

  const captureDestinationKeys = useMemo(
    () =>
      new Set(
        selectedMoves
          .filter((move) => move.kind === "capture")
          .map((move) => coordinateKey(move.to))
      ),
    [selectedMoves]
  );

  const selectedSquare = selected ? getSquareName(selected) : null;

  const nodeCounts = useMemo(
    () =>
      board.flat().reduce<Record<NodeSide, number>>(
        (counts, piece) => {
          if (piece) {
            counts[piece.side] += 1;
          }

          return counts;
        },
        { runner: 0, daemon: 0 }
      ),
    [board]
  );

  function pushLogs(messages: string[]) {
    setLogs((current) => [...messages, ...current].slice(0, 16));
  }

  function pushLog(message: string) {
    pushLogs([message]);
  }

  function handleCellClick(row: number, col: number) {
    const target = { row, col };
    const targetPiece = board[row][col];

    if (targetPiece) {
      handlePieceSelection(target, targetPiece.side);
      return;
    }

    if (!selected) {
      pushLog(
        captureRequired
          ? "[ERROR]: Capture protocol active. Select a highlighted node."
          : "[ERROR]: No active node selected."
      );
      return;
    }

    const move = selectedMoves.find((candidate) =>
      sameCoordinate(candidate.to, target)
    );

    if (!move) {
      pushLog(
        !isPlayableSquare(row, col)
          ? `[ERROR]: ${getSquareName(target)} rejected by grid parity.`
          : captureRequired
            ? "[ERROR]: Mandatory capture required. Regular move blocked."
            : `[ERROR]: Illegal vector to ${getSquareName(target)}.`
      );
      return;
    }

    executeMove(move);
  }

  function handlePieceSelection(coord: Coordinate, side: NodeSide) {
    if (side !== activeSide) {
      pushLog(`[ERROR]: ${getSquareName(coord)} belongs to inactive process.`);
      return;
    }

    if (forcedFrom && !sameCoordinate(coord, forcedFrom)) {
      pushLog(
        `[ERROR]: Multi-jump chain locked at ${getSquareName(forcedFrom)}.`
      );
      return;
    }

    if (captureRequired && !captureSourceKeys.has(coordinateKey(coord))) {
      pushLog("[ERROR]: Mandatory capture available. Select a highlighted node.");
      return;
    }

    setSelected(coord);
    pushLog(`[TRACE]: ${side.toUpperCase()} node armed at ${getSquareName(coord)}.`);
  }

  function executeMove(move: LegalMove) {
    const result = applyLegalMove(board, move);

    if (!result) {
      pushLog("[ERROR]: Move execution failed.");
      setSelected(null);
      setForcedFrom(null);
      return;
    }

    const actionLogs = createMoveLogs(move, result.promoted);
    const continuingCaptures =
      move.kind === "capture"
        ? getCaptureMovesForPiece(result.board, move.to)
        : [];

    setBoard(result.board);

    if (continuingCaptures.length > 0) {
      setSelected(move.to);
      setForcedFrom(move.to);
      pushLogs([
        ...actionLogs,
        `[TRACE]: Multi-jump chain locked at ${getSquareName(move.to)}.`
      ]);
      return;
    }

    setSelected(null);
    setForcedFrom(null);
    setActiveSide(getOpponent(activeSide));
    pushLogs(actionLogs);
  }

  return {
    activeSide,
    board,
    captureDestinationKeys,
    captureRequired,
    captureSourceKeys,
    forcedFrom,
    handleCellClick,
    legalDestinationKeys,
    logs,
    nodeCounts,
    selected,
    selectedSquare
  };
}

function createMoveLogs(move: LegalMove, promoted: boolean) {
  const logs = [
    `EXECUTE: Node ${getSquareName(move.from)} -> ${getSquareName(move.to)} | STATUS: SUCCESS`
  ];

  if (move.captured) {
    logs.push(
      `ALERT: Opponent Node decompiled at ${getSquareName(move.captured)}`
    );
  }

  if (promoted) {
    logs.push(`ACCESS GRANTED: Node promoted to ROOT at ${getSquareName(move.to)}`);
  }

  return logs;
}
