"use client";

import { CyberBoard } from "./CyberBoard";
import { HeaderBar } from "./HeaderBar";
import { TerminalPanel } from "./TerminalPanel";
import { useCheckers } from "./useCheckers";

export function NetrunnerCheckers() {
  const game = useCheckers();

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-slate-100">
      <div className="noise-field" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      <HeaderBar turnLabel={game.activeSide.toUpperCase()} />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8 lg:py-8">
        <CyberBoard
          board={game.board}
          captureDestinationKeys={game.captureDestinationKeys}
          captureRequired={game.captureRequired}
          captureSourceKeys={game.captureSourceKeys}
          forcedFrom={game.forcedFrom}
          legalDestinationKeys={game.legalDestinationKeys}
          selected={game.selected}
          onCellClick={game.handleCellClick}
        />
        <TerminalPanel
          logs={game.logs}
          nodeCounts={game.nodeCounts}
          selectedSquare={game.selectedSquare}
        />
      </div>
    </main>
  );
}
