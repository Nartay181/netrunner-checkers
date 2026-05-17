export const BOARD_SIZE = 8;

export type NodeSide = "runner" | "daemon";

export type CheckersPiece = {
  id: string;
  side: NodeSide;
  king: boolean;
};

export type BoardCell = CheckersPiece | null;
export type BoardState = BoardCell[][];

export type Coordinate = {
  row: number;
  col: number;
};

export type MoveKind = "move" | "capture";

export type LegalMove = {
  from: Coordinate;
  to: Coordinate;
  kind: MoveKind;
  captured?: Coordinate;
};

export type AppliedMove = {
  board: BoardState;
  movedPiece: CheckersPiece;
  promoted: boolean;
};

const ALL_DIRECTIONS: Coordinate[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 }
];

export function createInitialBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      if (!isPlayableSquare(row, col)) {
        return null;
      }

      if (row < 3) {
        return {
          id: `daemon-${row}-${col}`,
          side: "daemon",
          king: false
        };
      }

      if (row > 4) {
        return {
          id: `runner-${row}-${col}`,
          side: "runner",
          king: false
        };
      }

      return null;
    })
  );
}

export function coordinateKey({ row, col }: Coordinate) {
  return `${row}:${col}`;
}

export function sameCoordinate(a: Coordinate | null, b: Coordinate | null) {
  return Boolean(a && b && a.row === b.row && a.col === b.col);
}

export function isInsideBoard(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isPlayableSquare(row: number, col: number) {
  return (row + col) % 2 === 1;
}

export function getSquareName({ row, col }: Coordinate) {
  const file = String.fromCharCode(65 + col);
  const rank = BOARD_SIZE - row;
  return `${file}${rank}`;
}

export function shouldPromote(piece: CheckersPiece, row: number) {
  return (
    !piece.king &&
    ((piece.side === "runner" && row === 0) ||
      (piece.side === "daemon" && row === BOARD_SIZE - 1))
  );
}

export function getOpponent(side: NodeSide): NodeSide {
  return side === "runner" ? "daemon" : "runner";
}

export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function getAllLegalMoves(
  board: BoardState,
  side: NodeSide,
  forcedFrom: Coordinate | null = null
): LegalMove[] {
  if (forcedFrom) {
    const forcedPiece = board[forcedFrom.row]?.[forcedFrom.col];

    if (!forcedPiece || forcedPiece.side !== side) {
      return [];
    }

    return getCaptureMovesForPiece(board, forcedFrom);
  }

  const captures = getSidePieces(board, side).flatMap(({ coord }) =>
    getCaptureMovesForPiece(board, coord)
  );

  if (captures.length > 0) {
    return captures;
  }

  return getSidePieces(board, side).flatMap(({ coord }) =>
    getQuietMovesForPiece(board, coord)
  );
}

export function getCaptureMovesForPiece(
  board: BoardState,
  from: Coordinate
): LegalMove[] {
  const piece = board[from.row]?.[from.col];

  if (!piece) {
    return [];
  }

  return piece.king
    ? getKingCaptureMoves(board, from, piece)
    : getSimpleCaptureMoves(board, from, piece);
}

export function getQuietMovesForPiece(
  board: BoardState,
  from: Coordinate
): LegalMove[] {
  const piece = board[from.row]?.[from.col];

  if (!piece) {
    return [];
  }

  return piece.king
    ? getKingQuietMoves(board, from)
    : getSimpleQuietMoves(board, from, piece);
}

export function applyLegalMove(
  board: BoardState,
  move: LegalMove
): AppliedMove | null {
  const movingPiece = board[move.from.row]?.[move.from.col];

  if (!movingPiece) {
    return null;
  }

  const nextBoard = cloneBoard(board);
  const promoted = shouldPromote(movingPiece, move.to.row);
  const movedPiece = promoted ? { ...movingPiece, king: true } : movingPiece;

  nextBoard[move.from.row][move.from.col] = null;

  if (move.captured) {
    nextBoard[move.captured.row][move.captured.col] = null;
  }

  nextBoard[move.to.row][move.to.col] = movedPiece;

  return {
    board: nextBoard,
    movedPiece,
    promoted
  };
}

function getSidePieces(board: BoardState, side: NodeSide) {
  const pieces: Array<{ coord: Coordinate; piece: CheckersPiece }> = [];

  board.forEach((rowCells, row) => {
    rowCells.forEach((piece, col) => {
      if (piece?.side === side) {
        pieces.push({ coord: { row, col }, piece });
      }
    });
  });

  return pieces;
}

function getSimpleQuietMoves(
  board: BoardState,
  from: Coordinate,
  piece: CheckersPiece
): LegalMove[] {
  const forwardRow = piece.side === "runner" ? -1 : 1;

  return [
    { row: forwardRow, col: -1 },
    { row: forwardRow, col: 1 }
  ].flatMap((direction) => {
    const row = from.row + direction.row;
    const col = from.col + direction.col;

    if (!isInsideBoard(row, col) || board[row][col]) {
      return [];
    }

    return [
      {
        from,
        to: { row, col },
        kind: "move" as const
      }
    ];
  });
}

function getSimpleCaptureMoves(
  board: BoardState,
  from: Coordinate,
  piece: CheckersPiece
): LegalMove[] {
  return ALL_DIRECTIONS.flatMap((direction) => {
    const captured = {
      row: from.row + direction.row,
      col: from.col + direction.col
    };
    const landing = {
      row: from.row + direction.row * 2,
      col: from.col + direction.col * 2
    };

    if (
      !isInsideBoard(captured.row, captured.col) ||
      !isInsideBoard(landing.row, landing.col)
    ) {
      return [];
    }

    const capturedPiece = board[captured.row][captured.col];

    if (
      !capturedPiece ||
      capturedPiece.side === piece.side ||
      board[landing.row][landing.col]
    ) {
      return [];
    }

    return [
      {
        from,
        to: landing,
        kind: "capture" as const,
        captured
      }
    ];
  });
}

function getKingQuietMoves(board: BoardState, from: Coordinate): LegalMove[] {
  const moves: LegalMove[] = [];

  ALL_DIRECTIONS.forEach((direction) => {
    let row = from.row + direction.row;
    let col = from.col + direction.col;

    while (isInsideBoard(row, col) && !board[row][col]) {
      moves.push({
        from,
        to: { row, col },
        kind: "move"
      });
      row += direction.row;
      col += direction.col;
    }
  });

  return moves;
}

function getKingCaptureMoves(
  board: BoardState,
  from: Coordinate,
  piece: CheckersPiece
): LegalMove[] {
  const moves: LegalMove[] = [];

  ALL_DIRECTIONS.forEach((direction) => {
    let row = from.row + direction.row;
    let col = from.col + direction.col;
    let captured: Coordinate | null = null;

    while (isInsideBoard(row, col)) {
      const scannedPiece = board[row][col];

      if (!scannedPiece) {
        if (captured) {
          moves.push({
            from,
            to: { row, col },
            kind: "capture",
            captured
          });
        }
      } else if (scannedPiece.side === piece.side || captured) {
        break;
      } else {
        captured = { row, col };
      }

      row += direction.row;
      col += direction.col;
    }
  });

  return moves;
}
