"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_DIFFICULTIES,
  AI_SIDE,
  type AiDifficulty
} from "@/lib/ai";
import type { NodeSide } from "@/lib/checkers";
import type { RoomSnapshot } from "@/lib/multiplayer";
import { useAuth } from "@/hooks/useAuth";
import { archiveCompletedMatch } from "@/lib/gameHistory";
import { AICoachPanel } from "../AICoachPanel";
import { AuthPanel } from "./AuthPanel";
import { CyberBoard } from "./CyberBoard";
import { GameHistoryPanel } from "./GameHistoryPanel";
import { HeaderBar } from "./HeaderBar";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { MatchSetup, type MatchConfig } from "./MatchSetup";
import { ProModal } from "./ProModal";
import { TerminalPanel } from "./TerminalPanel";
import { useCheckers, type MatchStatus } from "./useCheckers";

export function NetrunnerCheckers() {
  const auth = useAuth();
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [matchKey, setMatchKey] = useState(0);
  const [proOpen, setProOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const currentUserId = auth.user?.id;
  const supabase = auth.supabase;

  function handleStart(config: MatchConfig) {
    setMatchKey((current) => current + 1);
    setMatchConfig(config);
  }

  function handleReset() {
    setMatchConfig(null);
  }

  function handleStartRemote(
    roomCode: string,
    playerName: string,
    playerSide: NodeSide,
    snapshot: RoomSnapshot
  ) {
    handleStart({
      difficulty: "script-kiddie",
      initialRoomSnapshot: snapshot,
      mode: "remote",
      playerName,
      playerSide,
      roomCode
    });
  }

  const handleHumanAiWin = useCallback(
    async (difficulty: AiDifficulty) => {
      const difficultyMeta = AI_DIFFICULTIES.find(
        (option) => option.id === difficulty
      );
      const ratingBonus = difficultyMeta?.ratingBonus ?? 32;

      if (!currentUserId || !supabase) {
        return ratingBonus;
      }

      const { data } = await supabase
        .from("profiles")
        .select("elo")
        .eq("id", currentUserId)
        .maybeSingle();
      const nextElo = (data?.elo ?? 1000) + ratingBonus;

      await supabase.from("profiles").upsert(
        {
          city: "Almaty",
          elo: nextElo,
          id: currentUserId,
          username: auth.username
        },
        { onConflict: "id" }
      );

      setLeaderboardRefreshKey((current) => current + 1);
      return ratingBonus;
    },
    [auth.username, currentUserId, supabase]
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-slate-100">
      <div className="noise-field" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      {!matchConfig ? (
        <>
          <HeaderBar
            authLabel={auth.user ? auth.username : undefined}
            modeLabel="Ready"
            onOpenPro={() => setProOpen(true)}
            onSignOut={auth.user ? auth.signOut : undefined}
            turnLabel="SETUP"
          />
          <MatchSetup
            authUserId={currentUserId}
            authUsername={auth.username}
            historyRefreshKey={historyRefreshKey}
            leaderboardRefreshKey={leaderboardRefreshKey}
            onStart={handleStart}
            onStartRemote={handleStartRemote}
          />
        </>
      ) : (
        <ActiveMatch
          key={matchKey}
          config={matchConfig}
          authUserId={currentUserId}
          authUsername={auth.username}
          historyRefreshKey={historyRefreshKey}
          leaderboardRefreshKey={leaderboardRefreshKey}
          onHumanAiWin={handleHumanAiWin}
          onOpenPro={() => setProOpen(true)}
          onPlayAgain={() => handleStart(matchConfig)}
          onReset={handleReset}
          onSignOut={auth.signOut}
          supabase={supabase}
          onHistoryArchived={() =>
            setHistoryRefreshKey((current) => current + 1)
          }
        />
      )}

      <AuthPanel auth={auth} open={!auth.user} />
      <ProModal open={proOpen} onClose={() => setProOpen(false)} />
    </main>
  );
}

type ActiveMatchProps = {
  authUserId?: string;
  authUsername: string;
  config: MatchConfig;
  historyRefreshKey: number;
  leaderboardRefreshKey: number;
  onHistoryArchived: () => void;
  onHumanAiWin: (difficulty: AiDifficulty) => Promise<number> | number;
  onOpenPro: () => void;
  onPlayAgain: () => void;
  onReset: () => void;
  onSignOut: () => void;
  supabase: ReturnType<typeof useAuth>["supabase"];
};

function ActiveMatch({
  authUserId,
  authUsername,
  config,
  historyRefreshKey,
  leaderboardRefreshKey,
  onHistoryArchived,
  onHumanAiWin,
  onOpenPro,
  onPlayAgain,
  onReset,
  onSignOut,
  supabase
}: ActiveMatchProps) {
  const archivedMatchRef = useRef(false);

  const game = useCheckers({
    aiDifficulty: config.difficulty,
    mode: config.mode,
    initialRoomSnapshot: config.initialRoomSnapshot,
    playerName: config.playerName,
    playerSide: config.playerSide,
    roomCode: config.roomCode
  });
  const difficulty = AI_DIFFICULTIES.find(
    (option) => option.id === config.difficulty
  );
  const modeLabel =
    config.mode === "ai"
      ? `VS AI: ${difficulty?.shortLabel ?? "Kernel"}`
      : config.mode === "remote"
        ? `REMOTE: ${config.roomCode ?? "PRIVATE"}`
      : "LOCAL PVP";

  useEffect(() => {
    if (!game.matchStatus || archivedMatchRef.current) {
      return;
    }

    const completedStatus = game.matchStatus;

    archivedMatchRef.current = true;

    if (config.mode === "remote" && config.playerSide !== "runner") {
      return;
    }

    void (async () => {
      const eloChange =
        config.mode === "ai" && completedStatus.winner === "runner"
          ? await onHumanAiWin(config.difficulty)
          : 0;
      const archivePayload = buildMatchHistoryPayload({
        authUserId,
        authUsername,
        config,
        eloChange,
        remotePlayers: game.remotePlayers,
        status: completedStatus
      });

      const result = await archiveCompletedMatch(supabase, archivePayload);

      if (!result.error) {
        onHistoryArchived();
      }
    })();
  }, [
    authUserId,
    authUsername,
    config,
    game.matchStatus,
    game.remotePlayers,
    onHistoryArchived,
    onHumanAiWin,
    supabase
  ]);

  return (
    <>
      <HeaderBar
        authLabel={authUsername}
        modeLabel={modeLabel}
        onOpenPro={onOpenPro}
        onReset={onReset}
        onSignOut={onSignOut}
        turnLabel={
          game.matchStatus
            ? `WIN: ${game.matchStatus.winner.toUpperCase()}`
            : game.activeSide.toUpperCase()
        }
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8 lg:py-8">
        <CyberBoard
          botSide={config.mode === "ai" ? AI_SIDE : null}
          board={game.board}
          captureDestinationKeys={game.captureDestinationKeys}
          captureRequired={game.captureRequired}
          captureSourceKeys={game.captureSourceKeys}
          disabled={
            game.isAiTurn ||
            game.isRemoteWaiting ||
            game.isRemoteOpponentTurn ||
            Boolean(game.matchStatus)
          }
          forcedFrom={game.forcedFrom}
          legalDestinationKeys={game.legalDestinationKeys}
          selected={game.selected}
          onCellClick={game.handleCellClick}
        />

        <div className="grid gap-5 lg:max-w-sm">
          <TerminalPanel
            aiThinking={game.aiThinking}
            authUsername={authUsername}
            botEnabled={config.mode === "ai"}
            logs={game.logs}
            matchStatus={game.matchStatus}
            nodeCounts={game.nodeCounts}
            remoteConnectionStatus={game.remoteConnectionStatus}
            remoteError={game.remoteError}
            remoteOpponentConnected={game.remoteOpponentConnected}
            remoteWaiting={game.isRemoteWaiting}
            selectedSquare={game.selectedSquare}
          />
          <LeaderboardPanel
            currentUserId={authUserId}
            refreshKey={leaderboardRefreshKey}
          />
          <GameHistoryPanel
            refreshKey={historyRefreshKey}
            userId={authUserId}
          />
        </div>
      </div>

      <AICoachPanel
        matchStatus={game.matchStatus}
        moveHistory={game.moveHistory}
        onPlayAgain={onPlayAgain}
      />
    </>
  );
}

type MatchHistoryPayloadOptions = {
  authUserId?: string;
  authUsername: string;
  config: MatchConfig;
  eloChange: number;
  remotePlayers: RoomSnapshot["players"];
  status: MatchStatus;
};

function buildMatchHistoryPayload({
  authUserId,
  authUsername,
  config,
  eloChange,
  remotePlayers,
  status
}: MatchHistoryPayloadOptions) {
  const remoteRunner = remotePlayers.find((player) => player.side === "runner");
  const remoteDaemon = remotePlayers.find((player) => player.side === "daemon");
  const playerBlackId =
    config.mode === "remote" ? remoteRunner?.id ?? null : authUserId ?? null;
  const playerBlackName =
    config.mode === "remote"
      ? remoteRunner?.name ?? "Remote Runner"
      : authUsername;
  const playerRedId = config.mode === "remote" ? remoteDaemon?.id ?? null : null;
  const playerRedName =
    config.mode === "remote"
      ? remoteDaemon?.name ?? "Remote Daemon"
      : config.mode === "ai"
        ? "Kernel Security Bot"
        : "Local Opponent";
  const winnerId =
    status.winner === "draw"
      ? null
      : status.winner === "runner"
        ? playerBlackId
        : playerRedId;

  return {
    eloChange,
    playerBlackId,
    playerBlackName,
    playerRedId,
    playerRedName,
    winnerId
  };
}
