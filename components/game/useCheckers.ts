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
import {
  loadRemoteRoom,
  subscribeToRoom,
  updateRemoteRoomState,
  type RemoteConnectionStatus,
  type RoomSnapshot
} from "@/lib/multiplayer";
import type { GameMode } from "./MatchSetup";

const INITIAL_LOGS = [
  "[SYSTEM]: Netrunner Checkers v0.3 AI uplink online",
  "[SYSTEM]: Matrix grid synchronized on 64 nodes",
  "[TRACE]: Mandatory capture protocol enabled"
];

export type MatchStatus = {
  reason: string;
  winner: NodeSide | "draw";
};

export type MoveRecord = {
  captured?: string;
  chainContinued: boolean;
  from: string;
  id: string;
  kind: "move" | "capture";
  promoted: boolean;
  sequence: number;
  side: NodeSide;
  to: string;
};

type UseCheckersOptions = {
  aiDifficulty: AiDifficulty;
  mode: GameMode;
  initialRoomSnapshot?: RoomSnapshot;
  onMatchEnd?: (status: MatchStatus) => void;
  playerName?: string;
  playerSide?: NodeSide;
  roomCode?: string;
};

export function useCheckers({
  aiDifficulty,
  initialRoomSnapshot,
  mode,
  onMatchEnd,
  playerName = "anonymous-runner",
  playerSide = "runner",
  roomCode
}: UseCheckersOptions) {
  const [board, setBoard] = useState<BoardState>(
    () => initialRoomSnapshot?.boardState ?? createInitialBoard()
  );
  const [selected, setSelected] = useState<Coordinate | null>(null);
  const [forcedFrom, setForcedFrom] = useState<Coordinate | null>(null);
  const [activeSide, setActiveSide] = useState<NodeSide>(
    initialRoomSnapshot?.currentPlayer ?? "runner"
  );
  const [logs, setLogs] = useState<string[]>(
    initialRoomSnapshot?.logs ?? INITIAL_LOGS
  );
  const [aiThinking, setAiThinking] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remotePlayers, setRemotePlayers] = useState(
    () =>
      initialRoomSnapshot?.players ??
      (mode === "remote"
        ? [
            {
              id: `local-${playerSide}`,
              name: playerName,
              side: playerSide
            }
          ]
        : [])
  );
  const [remoteStatus, setRemoteStatus] = useState<RoomSnapshot["status"]>(
    initialRoomSnapshot?.status ?? "active"
  );
  const [remoteConnectionStatus, setRemoteConnectionStatus] =
    useState<RemoteConnectionStatus>("idle");
  const logsRef = useRef(logs);
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
  const isRemoteWaiting = mode === "remote" && remoteStatus === "waiting";
  const isRemoteOpponentTurn =
    mode === "remote" && activeSide !== playerSide && !matchStatus;
  const remoteOpponentConnected =
    mode === "remote" &&
    remotePlayers.some((player) => player.side !== playerSide);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    if (mode !== "remote" || !roomCode) {
      return;
    }

    let cancelled = false;

    void loadRemoteRoom(roomCode)
      .then((snapshot) => {
        if (!cancelled) {
          applyRemoteSnapshot(snapshot);
        }
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load remote room.";

        if (!cancelled) {
          setRemoteError(message);
          pushLog(`[REMOTE ERROR]: ${message}`);
        }
      });

    const unsubscribe = subscribeToRoom(
      roomCode,
      (snapshot) => {
        if (!cancelled) {
          applyRemoteSnapshot(snapshot);
        }
      },
      (message) => {
        if (!cancelled) {
          setRemoteError(message);
          pushLog(`[REMOTE ERROR]: ${message}`);
        }
      },
      (status) => {
        if (!cancelled) {
          setRemoteConnectionStatus(status);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [mode, playerSide, roomCode]);

  function applyRemoteSnapshot(snapshot: RoomSnapshot) {
    setBoard(snapshot.boardState);
    setActiveSide(snapshot.currentPlayer);
    logsRef.current = snapshot.logs;
    setLogs(snapshot.logs);
    setRemotePlayers(snapshot.players);
    setRemoteStatus(snapshot.status);
    setRemoteError(null);

    if (snapshot.currentPlayer !== playerSide) {
      setSelected(null);
      setForcedFrom(null);
    }

    if (snapshot.status === "complete" && !matchEndedRef.current) {
      const status = getCompletionStatus(
        snapshot.boardState,
        snapshot.currentPlayer
      );

      if (status) {
        matchEndedRef.current = true;
        setAiThinking(false);
        setSelected(null);
        setForcedFrom(null);
        setMatchStatus(status);
        onMatchEnd?.(status);
      }
    }
  }

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
    setLogs((current) => {
      const nextLogs = prependLogs(messages, current);

      logsRef.current = nextLogs;
      return nextLogs;
    });
  }

  function pushLog(message: string) {
    pushLogs([message]);
  }

  function handleCellClick(row: number, col: number) {
    if (matchStatus) {
      pushLog("[SYSTEM]: Match complete. Reinitialize a new breach.");
      return;
    }

    if (isRemoteWaiting) {
      pushLog("[SYSTEM]: Waiting for opponent before breach can begin.");
      return;
    }

    if (isRemoteOpponentTurn) {
      pushLog("[SYSTEM]: Waiting for remote opponent vector.");
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
    const chainContinued = continuingCaptures.length > 0;
    const nextActiveSide = chainContinued ? activeSide : getOpponent(activeSide);
    const chainLogs = chainContinued
      ? [
          ...actionLogs,
          `[TRACE]: Multi-jump chain locked at ${getSquareName(move.to)}.`
        ]
      : actionLogs;
    const completionStatus = chainContinued
      ? null
      : getCompletionStatus(result.board, nextActiveSide);
    const completionLogs = completionStatus
      ? [
          `[SYSTEM]: MATCH COMPLETE | WINNER: ${completionStatus.winner.toUpperCase()}`,
          `[TRACE]: ${completionStatus.reason}.`
        ]
      : [];
    const nextLogs = prependLogs([...completionLogs, ...chainLogs], logsRef.current);

    setBoard(result.board);
    setMoveHistory((current) => [
      ...current,
      {
        captured: move.captured ? getSquareName(move.captured) : undefined,
        chainContinued,
        from: getSquareName(move.from),
        id: `${current.length + 1}-${getSquareName(move.from)}-${getSquareName(move.to)}`,
        kind: move.kind,
        promoted: result.promoted,
        sequence: current.length + 1,
        side: activeSide,
        to: getSquareName(move.to)
      }
    ]);

    if (chainContinued) {
      setSelected(move.to);
      setForcedFrom(move.to);
    } else {
      setSelected(null);
      setForcedFrom(null);
      setActiveSide(nextActiveSide);
    }

    logsRef.current = nextLogs;
    setLogs(nextLogs);

    if (completionStatus) {
      matchEndedRef.current = true;
      setAiThinking(false);
      setMatchStatus(completionStatus);
      onMatchEnd?.(completionStatus);
    }

    if (mode === "remote" && roomCode) {
      void pushRemoteSnapshot({
        boardState: result.board,
        currentPlayer: nextActiveSide,
        logs: nextLogs,
        players: remotePlayers,
        roomCode,
        status: completionStatus ? "complete" : "active"
      });
    }
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
    isRemoteOpponentTurn,
    isRemoteWaiting,
    legalDestinationKeys,
    logs,
    matchStatus,
    mode,
    moveHistory,
    nodeCounts,
    remoteConnectionStatus,
    remoteError,
    remoteOpponentConnected,
    remotePlayers,
    remoteStatus,
    selected,
    selectedSquare
  };

  async function pushRemoteSnapshot(snapshot: RoomSnapshot) {
    try {
      const syncedSnapshot = await updateRemoteRoomState(snapshot);

      setRemoteError(null);
      setRemotePlayers(syncedSnapshot.players);
      setRemoteStatus(syncedSnapshot.status);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sync remote move.";

      setRemoteError(message);
      pushLog(`[REMOTE ERROR]: ${message}`);
    }
  }
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

function prependLogs(messages: string[], currentLogs: string[]) {
  return [...messages, ...currentLogs].slice(0, 16);
}

function getCompletionStatus(
  board: BoardState,
  activeSide: NodeSide
): MatchStatus | null {
  const counts = countNodes(board);

  if (counts[activeSide] > 0 && getAllLegalMoves(board, activeSide).length > 0) {
    return null;
  }

  const winner = getOpponent(activeSide);

  return {
    winner,
    reason:
      counts[activeSide] === 0
        ? `${activeSide.toUpperCase()} nodes depleted`
        : `${activeSide.toUpperCase()} has no legal vectors`
  };
}

function countNodes(board: BoardState) {
  return board.flat().reduce<Record<NodeSide, number>>(
    (counts, piece) => {
      if (piece) {
        counts[piece.side] += 1;
      }

      return counts;
    },
    { runner: 0, daemon: 0 }
  );
}
