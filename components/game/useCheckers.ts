"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AI_SIDE,
  chooseAiMove,
  type AiDifficulty
} from "@/lib/ai";
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
import type { GameMode } from "./MatchSetup";

const INITIAL_LOGS = [
  "[SYSTEM]: Netrunner Checkers v0.3 AI uplink online",
  "[SYSTEM]: Matrix grid synchronized on 64 nodes",
  "[TRACE]: Mandatory capture protocol enabled"
];

export type MatchStatus = {
  reason: string;
  winner: NodeSide;
};

type UseCheckersOptions = {
  aiDifficulty: AiDifficulty;
  mode: GameMode;
  onMatchEnd?: (status: MatchStatus) => void;
};

export function useCheckers({
  aiDifficulty,
  mode,
  onMatchEnd
}: UseCheckersOptions) {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [selected, setSelected] = useState<Coordinate | null>(null);
  const [forcedFrom, setForcedFrom] = useState<Coordinate | null>(null);
  const [activeSide, setActiveSide] = useState<NodeSide>("runner");
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const [aiThinking, setAiThinking] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const matchEndedRef = useRef(false);

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
  const isAiTurn = mode === "ai" && activeSide === AI_SIDE && !matchStatus;

  useEffect(() => {
    if (matchEndedRef.current) {
      return;
    }

    if (nodeCounts[activeSide] > 0 && legalMoves.length > 0) {
      return;
    }

    const winner = getOpponent(activeSide);
    const status = {
      winner,
      reason:
        nodeCounts[activeSide] === 0
          ? `${activeSide.toUpperCase()} nodes depleted`
          : `${activeSide.toUpperCase()} has no legal vectors`
    };

    matchEndedRef.current = true;
    setAiThinking(false);
    setSelected(null);
    setForcedFrom(null);
    setMatchStatus(status);
    pushLogs([
      `[SYSTEM]: MATCH COMPLETE | WINNER: ${winner.toUpperCase()}`,
      `[TRACE]: ${status.reason}.`
    ]);
    onMatchEnd?.(status);
  }, [activeSide, legalMoves, nodeCounts, onMatchEnd]);

  useEffect(() => {
    if (!isAiTurn || legalMoves.length === 0) {
      setAiThinking(false);
      return;
    }

    setAiThinking(true);
    pushLog("[SYSTEM]: Scanning netspaces for optimal vectors...");

    const delay = 1000 + Math.floor(Math.random() * 1000);
    const timeout = window.setTimeout(() => {
      const move = chooseAiMove({
        board,
        difficulty: aiDifficulty,
        legalMoves,
        side: AI_SIDE
      });

      if (move) {
        executeMove(move);
      }

      setAiThinking(false);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [aiDifficulty, board, isAiTurn, legalMoves]);

  function pushLogs(messages: string[]) {
    setLogs((current) => [...messages, ...current].slice(0, 16));
  }

  function pushLog(message: string) {
    pushLogs([message]);
  }

  function handleCellClick(row: number, col: number) {
    if (matchStatus) {
      pushLog("[SYSTEM]: Match complete. Reinitialize a new breach.");
      return;
    }

    if (isAiTurn) {
      pushLog("[SYSTEM]: Kernel Security Bot controls this vector.");
      return;
    }

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
    isAiTurn,
    aiThinking,
    legalDestinationKeys,
    logs,
    matchStatus,
    mode,
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
