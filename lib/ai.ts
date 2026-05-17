import {
  applyLegalMove,
  getAllLegalMoves,
  getCaptureMovesForPiece,
  getOpponent,
  shouldPromote,
  type BoardState,
  type Coordinate,
  type LegalMove,
  type NodeSide
} from "./checkers";

export const AI_SIDE: NodeSide = "daemon";

export type AiDifficulty = "script-kiddie" | "specialist" | "rogue-ai";

export type AiDifficultyOption = {
  id: AiDifficulty;
  label: string;
  shortLabel: string;
  ratingBonus: number;
};

export const AI_DIFFICULTIES: AiDifficultyOption[] = [
  {
    id: "script-kiddie",
    label: "Level 1: Script Kiddie",
    shortLabel: "Script Kiddie",
    ratingBonus: 28
  },
  {
    id: "specialist",
    label: "Level 2: Cybersecurity Specialist",
    shortLabel: "Specialist",
    ratingBonus: 44
  },
  {
    id: "rogue-ai",
    label: "Level 3: Rogue AI (Deep Web Edition)",
    shortLabel: "Rogue AI",
    ratingBonus: 72
  }
];

type ChooseAiMoveArgs = {
  board: BoardState;
  difficulty: AiDifficulty;
  legalMoves: LegalMove[];
  side?: NodeSide;
};

export function chooseAiMove({
  board,
  difficulty,
  legalMoves,
  side = AI_SIDE
}: ChooseAiMoveArgs) {
  if (legalMoves.length === 0) {
    return null;
  }

  if (difficulty === "script-kiddie") {
    return pickRandom(legalMoves);
  }

  const scoredMoves = legalMoves.map((move) => ({
    move,
    score:
      difficulty === "rogue-ai"
        ? scoreRogueMove(board, move, side)
        : scoreSpecialistMove(board, move, side)
  }));
  const bestScore = Math.max(...scoredMoves.map(({ score }) => score));
  const bestMoves = scoredMoves
    .filter(({ score }) => score >= bestScore - 4)
    .map(({ move }) => move);

  return pickRandom(bestMoves);
}

function scoreSpecialistMove(
  board: BoardState,
  move: LegalMove,
  side: NodeSide
) {
  const applied = applyLegalMove(board, move);

  if (!applied) {
    return Number.NEGATIVE_INFINITY;
  }

  const opponent = getOpponent(side);
  const opponentMoves = getAllLegalMoves(applied.board, opponent);
  const immediateDanger = canOpponentCaptureSquare(
    applied.board,
    opponent,
    move.to
  );

  return (
    scoreMaterial(board, applied.board, side) +
    scoreMoveShape(board, move, side) +
    (move.kind === "capture" ? 120 : 0) +
    (applied.promoted ? 70 : 0) -
    (immediateDanger ? 85 : 0) -
    Math.max(0, ...opponentMoves.map((reply) => scoreMoveShape(applied.board, reply, opponent))) *
      0.35
  );
}

function scoreRogueMove(board: BoardState, move: LegalMove, side: NodeSide) {
  const applied = applyLegalMove(board, move);

  if (!applied) {
    return Number.NEGATIVE_INFINITY;
  }

  const opponent = getOpponent(side);
  const opponentMoves = getAllLegalMoves(applied.board, opponent);
  const chainScore = estimateCaptureChain(board, move, side) * 140;
  const promotionPressure = getPromotionPressure(move.to, side) * 10;
  const immediateDanger = canOpponentCaptureSquare(
    applied.board,
    opponent,
    move.to
  );

  return (
    scoreMaterial(board, applied.board, side) * 1.3 +
    scoreMoveShape(board, move, side) +
    chainScore +
    promotionPressure +
    (move.kind === "capture" ? 140 : 0) +
    (applied.promoted ? 120 : 0) -
    (immediateDanger ? 45 : 0) -
    Math.max(0, ...opponentMoves.map((reply) => scoreMoveShape(applied.board, reply, opponent))) *
      0.18
  );
}

function scoreMoveShape(board: BoardState, move: LegalMove, side: NodeSide) {
  const piece = board[move.from.row]?.[move.from.col];
  const promotes = Boolean(piece && shouldPromote(piece, move.to.row));
  const centerBias = 3.5 - Math.abs(3.5 - move.to.col);

  return (
    (move.kind === "capture" ? 80 : 0) +
    (promotes ? 90 : 0) +
    getPromotionPressure(move.to, side) * 8 +
    centerBias * 4 +
    (piece?.king ? 16 : 0)
  );
}

function scoreMaterial(
  previousBoard: BoardState,
  nextBoard: BoardState,
  side: NodeSide
) {
  return getBoardValue(nextBoard, side) - getBoardValue(previousBoard, side);
}

function getBoardValue(board: BoardState, side: NodeSide) {
  return board.flat().reduce((score, piece) => {
    if (!piece) {
      return score;
    }

    const value = piece.king ? 175 : 100;
    return piece.side === side ? score + value : score - value;
  }, 0);
}

function estimateCaptureChain(
  board: BoardState,
  move: LegalMove,
  side: NodeSide,
  depth = 5
): number {
  if (depth === 0 || move.kind !== "capture") {
    return 0;
  }

  const applied = applyLegalMove(board, move);

  if (!applied) {
    return 0;
  }

  const nextCaptures = getCaptureMovesForPiece(applied.board, move.to).filter(
    (nextMove) => applied.board[nextMove.from.row]?.[nextMove.from.col]?.side === side
  );

  if (nextCaptures.length === 0) {
    return 1;
  }

  return (
    1 +
    Math.max(
      ...nextCaptures.map((nextMove) =>
        estimateCaptureChain(applied.board, nextMove, side, depth - 1)
      )
    )
  );
}

function canOpponentCaptureSquare(
  board: BoardState,
  opponent: NodeSide,
  square: Coordinate
) {
  return getAllLegalMoves(board, opponent).some(
    (move) =>
      move.kind === "capture" &&
      move.captured?.row === square.row &&
      move.captured.col === square.col
  );
}

function getPromotionPressure(coord: Coordinate, side: NodeSide) {
  return side === "daemon" ? coord.row : 7 - coord.row;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
