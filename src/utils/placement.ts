import { GamePiece, BoardCell } from '../types'
import { Coordinates, getPolyominoShape } from './polyominoes'
import { getTransformedShape, applyTransform } from './transforms'

export interface PlacementResult {
  valid: boolean
  reason?: string
  occupiedCells?: Coordinates[]
}

export interface PlacedPieceInfo {
  piece: GamePiece
  position: Coordinates
  occupiedCells: Coordinates[]
}

export function getOccupiedCells(
  piece: GamePiece,
  row: number,
  col: number
): Coordinates[] {
  const baseShape = getPolyominoShape(piece.shape)
  const transformedShape = getTransformedShape(
    baseShape,
    piece.rotation,
    piece.flipped
  )
  
  return applyTransform(transformedShape, col, row)
}

export function isValidPlacement(
  piece: GamePiece,
  row: number,
  col: number,
  board: BoardCell[][],
  _placedPieces: GamePiece[],
  monominoCount: number = 0
): PlacementResult {
  const occupiedCells = getOccupiedCells(piece, row, col)
  
  if (piece.shape === 'I1') {
    if (monominoCount >= 1) {
      return {
        valid: false,
        reason: 'Maximum 1 monomino allowed per level',
        occupiedCells
      }
    }
  }
  
  for (const cell of occupiedCells) {
    if (cell.x < 0 || cell.x >= 5 || cell.y < 0 || cell.y >= 5) {
      return {
        valid: false,
        reason: 'Piece extends beyond board boundaries',
        occupiedCells
      }
    }
    
    if (board[cell.y][cell.x].pieceId) {
      return {
        valid: false,
        reason: 'Cell already occupied by another piece',
        occupiedCells
      }
    }
  }
  
  return {
    valid: true,
    occupiedCells
  }
}

export function canPlacePiece(
  piece: GamePiece,
  row: number,
  col: number,
  board: BoardCell[][],
  placedPieces: GamePiece[],
  monominoCount: number = 0
): boolean {
  return isValidPlacement(piece, row, col, board, placedPieces, monominoCount).valid
}

export function getBoardCoverage(board: BoardCell[][]): number {
  let occupiedCells = 0
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col].pieceId) {
        occupiedCells++
      }
    }
  }
  return occupiedCells
}

export function calculateSum(placedPieces: GamePiece[]): number {
  return placedPieces.reduce((sum, piece) => sum + piece.value, 0)
}

export function countMonominoes(placedPieces: GamePiece[]): number {
  return placedPieces.filter(piece => piece.shape === 'I1').length
}

export function isWinCondition(
  board: BoardCell[][],
  placedPieces: GamePiece[],
  target: number
): boolean {
  const coverage = getBoardCoverage(board)
  const currentSum = calculateSum(placedPieces)
  
  return coverage === 25 && currentSum === target
}

export function findBestPlacement(
  piece: GamePiece,
  board: BoardCell[][],
  placedPieces: GamePiece[],
  monominoCount: number = 0
): Coordinates[] {
  const validPlacements: Coordinates[] = []
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (canPlacePiece(piece, row, col, board, placedPieces, monominoCount)) {
        validPlacements.push({ x: col, y: row })
      }
    }
  }
  
  return validPlacements
}

export function getPlacedPieceInfo(
  piece: GamePiece,
  position: Coordinates
): PlacedPieceInfo {
  return {
    piece,
    position,
    occupiedCells: getOccupiedCells(piece, position.y, position.x)
  }
}

export function removePieceFromBoard(
  board: BoardCell[][],
  pieceId: string
): BoardCell[][] {
  console.log(`[DEBUG] Removing piece ${pieceId} from board`)
  
  // Count how many cells we're clearing
  let clearedCells = 0
  const result = board.map(row =>
    row.map(cell => {
      if (cell.pieceId === pieceId) {
        clearedCells++
        console.log(`[DEBUG] Clearing cell (${cell.row}, ${cell.col}) for piece ${pieceId}`)
        return { ...cell, pieceId: undefined, pieceValue: undefined, pieceShape: undefined }
      }
      return cell
    })
  )
  
  console.log(`[DEBUG] Cleared ${clearedCells} cells for piece ${pieceId}`)
  return result
}

export function placePieceOnBoard(
  board: BoardCell[][],
  piece: GamePiece,
  row: number,
  col: number
): BoardCell[][] {
  const newBoard = board.map(r => r.map(c => ({ ...c })))
  
  // CRITICAL FIX: First clear any existing cells with the same piece ID
  // This prevents board corruption when repositioning pieces
  for (let r = 0; r < newBoard.length; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (newBoard[r][c].pieceId === piece.id) {
        console.log(`[DEBUG] Clearing old position of piece ${piece.id} at (${r}, ${c})`)
        newBoard[r][c].pieceId = undefined
        newBoard[r][c].pieceValue = undefined
        newBoard[r][c].pieceShape = undefined
      }
    }
  }
  
  const occupiedCells = getOccupiedCells(piece, row, col)
  console.log(`[DEBUG] Placing piece ${piece.id} at cells:`, occupiedCells)
  
  for (const cell of occupiedCells) {
    if (cell.y >= 0 && cell.y < 5 && cell.x >= 0 && cell.x < 5) {
      newBoard[cell.y][cell.x].pieceId = piece.id
      newBoard[cell.y][cell.x].pieceValue = piece.value
      newBoard[cell.y][cell.x].pieceShape = piece.shape
    }
  }
  
  return newBoard
}