"use client";

import { useCallback, useState } from "react";
import {
  AI_DIFFICULTIES,
  AI_SIDE,
  type AiDifficulty
} from "@/lib/ai";
import { CyberBoard } from "./CyberBoard";
import { HeaderBar } from "./HeaderBar";
import {
  CURRENT_USER_ID,
  DEFAULT_LEADERBOARD,
  LeaderboardPanel,
  type LeaderboardRow
} from "./LeaderboardPanel";
import { MatchSetup, type MatchConfig } from "./MatchSetup";
import { TerminalPanel } from "./TerminalPanel";
import { useCheckers, type MatchStatus } from "./useCheckers";

export function NetrunnerCheckers() {
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [matchKey, setMatchKey] = useState(0);
  const [leaderboardRows, setLeaderboardRows] =
    useState<LeaderboardRow[]>(DEFAULT_LEADERBOARD);

  function handleStart(config: MatchConfig) {
    setMatchKey((current) => current + 1);
    setMatchConfig(config);
  }

  function handleReset() {
    setMatchConfig(null);
  }

  const handleHumanAiWin = useCallback((difficulty: AiDifficulty) => {
    const difficultyMeta = AI_DIFFICULTIES.find(
      (option) => option.id === difficulty
    );
    const ratingBonus = difficultyMeta?.ratingBonus ?? 32;

    setLeaderboardRows((rows) =>
      rows.map((row) =>
        row.id === CURRENT_USER_ID
          ? { ...row, rating: row.rating + ratingBonus }
          : row
      )
    );
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-slate-100">
      <div className="noise-field" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      {!matchConfig ? (
        <>
          <HeaderBar modeLabel="Ready" turnLabel="SETUP" />
          <MatchSetup leaderboardRows={leaderboardRows} onStart={handleStart} />
        </>
      ) : (
        <ActiveMatch
          key={matchKey}
          config={matchConfig}
          leaderboardRows={leaderboardRows}
          onHumanAiWin={handleHumanAiWin}
          onReset={handleReset}
        />
      )}
    </main>
  );
}

type ActiveMatchProps = {
  config: MatchConfig;
  leaderboardRows: LeaderboardRow[];
  onHumanAiWin: (difficulty: AiDifficulty) => void;
  onReset: () => void;
};

function ActiveMatch({
  config,
  leaderboardRows,
  onHumanAiWin,
  onReset
}: ActiveMatchProps) {
  const handleMatchEnd = useCallback(
    (status: MatchStatus) => {
      if (config.mode === "ai" && status.winner === "runner") {
        onHumanAiWin(config.difficulty);
      }
    },
    [config.difficulty, config.mode, onHumanAiWin]
  );

  const game = useCheckers({
    aiDifficulty: config.difficulty,
    mode: config.mode,
    onMatchEnd: handleMatchEnd
  });
  const difficulty = AI_DIFFICULTIES.find(
    (option) => option.id === config.difficulty
  );
  const modeLabel =
    config.mode === "ai"
      ? `VS AI: ${difficulty?.shortLabel ?? "Kernel"}`
      : "LOCAL PVP";

  return (
    <>
      <HeaderBar
        modeLabel={modeLabel}
        onReset={onReset}
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
          disabled={game.isAiTurn || Boolean(game.matchStatus)}
          forcedFrom={game.forcedFrom}
          legalDestinationKeys={game.legalDestinationKeys}
          selected={game.selected}
          onCellClick={game.handleCellClick}
        />

        <div className="grid gap-5 lg:max-w-sm">
          <TerminalPanel
            aiThinking={game.aiThinking}
            botEnabled={config.mode === "ai"}
            logs={game.logs}
            matchStatus={game.matchStatus}
            nodeCounts={game.nodeCounts}
            selectedSquare={game.selectedSquare}
          />
          <LeaderboardPanel rows={leaderboardRows} />
        </div>
      </div>
    </>
  );
}
