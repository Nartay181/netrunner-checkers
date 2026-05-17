"use client";

import { Crown, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import type { CheckersPiece } from "@/lib/checkers";

type NodePieceProps = {
  isBotSide: boolean;
  piece: CheckersPiece;
  selected: boolean;
  mustCapture: boolean;
};

const sideClasses = {
  runner: {
    shell:
      "border-matrix/80 bg-matrix/12 text-matrix shadow-[0_0_18px_rgba(0,255,65,0.46),inset_0_0_18px_rgba(0,255,65,0.18)]",
    core: "bg-matrix",
    ring: "border-matrix/40"
  },
  daemon: {
    shell:
      "border-cyber/80 bg-cyber/12 text-cyber shadow-[0_0_18px_rgba(0,243,255,0.42),inset_0_0_18px_rgba(0,243,255,0.18)]",
    core: "bg-cyber",
    ring: "border-cyber/40"
  }
};

const botClasses = {
  shell:
    "border-danger/80 bg-danger/12 text-danger shadow-[0_0_18px_rgba(255,0,60,0.44),inset_0_0_18px_rgba(255,0,60,0.16)]",
  core: "bg-danger",
  ring: "border-danger/40"
};

export function NodePiece({
  isBotSide,
  piece,
  selected,
  mustCapture
}: NodePieceProps) {
  const classes = isBotSide ? botClasses : sideClasses[piece.side];
  const Icon = piece.king ? Crown : Cpu;

  return (
    <motion.div
      layoutId={piece.id}
      initial={{ scale: 0.78, opacity: 0 }}
      animate={{
        scale: selected ? 1.12 : 1,
        opacity: 1,
        boxShadow: piece.king
          ? [
              "0 0 18px rgba(255,0,60,0.34)",
              "0 0 34px rgba(255,0,60,0.66)",
              "0 0 18px rgba(255,0,60,0.34)"
            ]
          : undefined
      }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 30,
        boxShadow: { duration: 1.4, repeat: Infinity }
      }}
      className={[
        "relative grid h-[72%] w-[72%] place-items-center rounded-full border",
        "before:absolute before:inset-[14%] before:rounded-full before:border before:border-dashed before:content-['']",
        "after:absolute after:inset-[34%] after:rounded-full after:opacity-90 after:content-['']",
        selected ? "z-20 ring-2 ring-white/80" : "z-10",
        mustCapture && !selected ? "ring-2 ring-danger/80" : "",
        piece.king ? "border-danger/80 text-danger" : classes.shell,
        piece.king
          ? "animate-glitch-pulse border-danger/80 text-danger before:border-danger/50 after:bg-danger"
          : classes.ring
      ].join(" ")}
    >
      <span className={`absolute inset-[41%] rounded-full ${classes.core}`} />
      <Icon className="relative z-10 h-[42%] w-[42%]" strokeWidth={1.8} />
      {piece.king && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-cyber/50 mix-blend-screen"
          animate={{ rotate: [0, 8, -6, 0], opacity: [0.35, 0.9, 0.45] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {selected && (
        <motion.span
          aria-hidden="true"
          className="absolute -inset-2 rounded-full border border-white/60"
          initial={{ opacity: 0.68, scale: 0.86 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}
