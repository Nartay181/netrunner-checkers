"use client";

import { Activity, Cpu, ShieldAlert, Terminal } from "lucide-react";
import type { NodeSide } from "@/lib/checkers";

type TerminalPanelProps = {
  logs: string[];
  nodeCounts: Record<NodeSide, number>;
  selectedSquare: string | null;
};

export function TerminalPanel({
  logs,
  nodeCounts,
  selectedSquare
}: TerminalPanelProps) {
  return (
    <aside className="cyber-panel flex min-h-[420px] w-full flex-col rounded-lg lg:max-w-sm">
      <div className="flex items-center justify-between border-b border-cyber/20 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-cyber">
          <Terminal className="h-4 w-4" aria-hidden="true" />
          <span>Terminal Output</span>
        </div>
        <span className="h-2 w-2 rounded-full bg-matrix shadow-matrix-hard" />
      </div>

      <div className="grid grid-cols-3 border-b border-cyber/20 text-center text-xs uppercase">
        <div className="border-r border-cyber/15 px-3 py-3">
          <div className="mb-1 flex items-center justify-center gap-1 text-matrix">
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
            Runner
          </div>
          <p className="text-lg font-black text-white">{nodeCounts.runner}</p>
        </div>
        <div className="border-r border-cyber/15 px-3 py-3">
          <div className="mb-1 flex items-center justify-center gap-1 text-cyber">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Daemon
          </div>
          <p className="text-lg font-black text-white">{nodeCounts.daemon}</p>
        </div>
        <div className="px-3 py-3">
          <div className="mb-1 flex items-center justify-center gap-1 text-danger">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            Trace
          </div>
          <p className="truncate text-lg font-black text-white">
            {selectedSquare ?? "--"}
          </p>
        </div>
      </div>

      <div className="terminal-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {logs.map((log, index) => (
          <p
            key={`${log}-${index}`}
            className={[
              "border-l px-3 py-2 text-xs leading-relaxed",
              index === 0
                ? "border-matrix bg-matrix/8 text-matrix"
                : "border-cyber/25 bg-black/30 text-cyber/80"
            ].join(" ")}
          >
            {log}
          </p>
        ))}
      </div>
    </aside>
  );
}
