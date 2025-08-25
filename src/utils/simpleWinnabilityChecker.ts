import { GameLevel, GamePiece, BoardCell, PolyominoShape } from '../types'
import { POLYOMINO_SHAPES } from './polyominoes'
import { getTransformedShape } from './transforms'

const SHAPE_SIZES: Record<PolyominoShape, number> = {
  'I4': 4, 'O4': 4, 'T4': 4, 'L4': 4, 'S4': 4,
  'I3': 3, 'L3': 3,
  'I2': 2,
  'I1': 1
}

export interface WinnabilityResult {
  isWinnable: boolean
  reason?: string
  solutionPieces?: string[]
  confidence: 'certain' | 'likely' | 'unknown'
  timeMs?: number
}

export function checkWinnability(level: GameLevel): WinnabilityResult {
  const startTime = Date.now()
  
  // Quick validation checks
  const quickCheck = performQuickChecks(level)
  if (!quickCheck.isValid) {
    return {
      isWinnable: false,
      reason: quickCheck.reason,
      confidence: 'certain',
      timeMs: Date.now() - startTime
    }
  }
  
  // If this is a generated puzzle with a stored solution, we know it's winnable
  if (level.solution) {
    return {
      isWinnable: true,
      reason: 'Puzzle generated with known solution',
      solutionPieces: level.solution.pieceIds,
      confidence: 'certain',
      timeMs: Date.now() - startTime
    }
  }
  
  // For unknown puzzles, try to find a solution
  const solution = tryToSolvePuzzle(level)
  
  if (solution) {
    return {
      isWinnable: true,
      reason: 'Solution found through search',
      solutionPieces: solution.pieceIds,
      confidence: 'certain',
      timeMs: Date.now() - startTime
    }
  }
  
  // If we can't find a solution quickly, check if it's theoretically possible
  const isPossible = checkTheoreticalPossibility(level)
  
  return {
    isWinnable: false,
    reason: isPossible 
      ? 'Could not find solution (may still be solvable)' 
      : 'Puzzle appears impossible based on constraints',
    confidence: isPossible ? 'unknown' : 'likely',
    timeMs: Date.now() - startTime
  }
}

function performQuickChecks(level: GameLevel): { isValid: boolean; reason?: string } {
  // Check 1: Do we have enough cells to cover the board?
  const totalCells = level.bag.reduce((sum, piece) => {
    return sum + SHAPE_SIZES[piece.shape]
  }, 0)
  
  if (totalCells < 25) {
    return {
      isValid: false,
      reason: `Not enough pieces to cover board (${totalCells}/25 cells)`
    }
  }
  
  // Check 2: Can we possibly reach the target sum?
  const minSum = level.bag
    .sort((a, b) => a.value - b.value)
    .slice(0, Math.ceil(25 / 4)) // Minimum pieces needed (all 4-cell pieces)
    .reduce((sum, p) => sum + p.value, 0)
  
  const maxSum = level.bag
    .sort((a, b) => b.value - a.value)
    .slice(0, 25) // Maximum pieces (all 1-cell pieces, theoretical)
    .reduce((sum, p) => sum + p.value, 0)
  
  if (level.target < minSum || level.target > maxSum) {
    return {
      isValid: false,
      reason: `Target ${level.target} outside possible range [${minSum}, ${maxSum}]`
    }
  }
  
  // Check 3: Monomino constraint
  const monominoCount = level.bag.filter(p => p.shape === 'I1').length
  if (monominoCount > level.constraints.monomino_cap) {
    return {
      isValid: false,
      reason: `Too many monominoes (${monominoCount}/${level.constraints.monomino_cap})`
    }
  }
  
  return { isValid: true }
}

interface PartialSolution {
  board: BoardCell[][]
  usedPieces: Set<string>
  currentSum: number
  cellsCovered: number
  pieceIds: string[]
}

function tryToSolvePuzzle(level: GameLevel, maxAttempts: number = 10): { pieceIds: string[] } | null {
  // For now, just check if it's theoretically possible
  // A full solver would be too slow for real-time checking
  return null
}

function backtrackSolve(
  board: BoardCell[][],
  pieces: GamePiece[],
  usedPieces: Set<string>,
  currentSum: number,
  cellsCovered: number,
  pieceIds: string[],
  targetSum: number,
  monominoCap: number,
  attemptsLeft: number
): { pieceIds: string[] } | null {
  // Base cases
  if (attemptsLeft <= 0) return null
  if (cellsCovered === 25 && currentSum === targetSum) {
    return { pieceIds: [...pieceIds] }
  }
  if (cellsCovered === 25 || currentSum > targetSum) {
    return null
  }
  
  // Try each piece
  for (const piece of pieces) {
    if (usedPieces.has(piece.id)) continue
    
    // Check monomino constraint
    if (piece.shape === 'I1') {
      const currentMonominoes = pieceIds.filter(id => {
        const p = pieces.find(p => p.id === id)
        return p?.shape === 'I1'
      }).length
      if (currentMonominoes >= monominoCap) continue
    }
    
    // Try placing the piece at each position with each transformation
    const rotations = piece.shape === 'O4' ? [0] : [0, 90, 180, 270]
    const flips = piece.shape === 'O4' ? [false] : [false, true]
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        for (const rotation of rotations) {
          for (const flipped of flips) {
            const placement = tryPlacePiece(board, piece, row, col, rotation, flipped)
            
            if (placement) {
              // Place the piece
              applyPlacement(board, piece.id, placement)
              usedPieces.add(piece.id)
              pieceIds.push(piece.id)
              
              // Recurse
              const result = backtrackSolve(
                board,
                pieces,
                usedPieces,
                currentSum + piece.value,
                cellsCovered + SHAPE_SIZES[piece.shape],
                pieceIds,
                targetSum,
                monominoCap,
                attemptsLeft - 1
              )
              
              if (result) return result
              
              // Backtrack
              removePlacement(board, piece.id, placement)
              usedPieces.delete(piece.id)
              pieceIds.pop()
            }
          }
        }
      }
    }
  }
  
  return null
}

function tryPlacePiece(
  board: BoardCell[][],
  piece: GamePiece,
  row: number,
  col: number,
  rotation: number,
  flipped: boolean
): Array<{ row: number; col: number }> | null {
  const baseCoords = POLYOMINO_SHAPES[piece.shape]
  const transformedCoords = getTransformedShape(baseCoords, rotation, flipped)
  
  const occupiedCells: Array<{ row: number; col: number }> = []
  
  for (const coord of transformedCoords) {
    const boardRow = row + coord.y
    const boardCol = col + coord.x
    
    // Check bounds
    if (boardRow < 0 || boardRow >= 5 || boardCol < 0 || boardCol >= 5) {
      return null
    }
    
    // Check if cell is already occupied
    if (board[boardRow][boardCol].pieceId) {
      return null
    }
    
    occupiedCells.push({ row: boardRow, col: boardCol })
  }
  
  return occupiedCells
}

function applyPlacement(
  board: BoardCell[][],
  pieceId: string,
  cells: Array<{ row: number; col: number }>
): void {
  for (const cell of cells) {
    board[cell.row][cell.col] = {
      ...board[cell.row][cell.col],
      pieceId
    }
  }
}

function removePlacement(
  board: BoardCell[][],
  pieceId: string,
  cells: Array<{ row: number; col: number }>
): void {
  for (const cell of cells) {
    board[cell.row][cell.col] = {
      row: cell.row,
      col: cell.col
    }
  }
}

function checkTheoreticalPossibility(level: GameLevel): boolean {
  // Check if there's any subset of pieces that:
  // 1. Totals exactly 25 cells
  // 2. Sums to exactly the target
  // 3. Has at most 1 monomino
  
  const pieces = level.bag.map(p => ({
    id: p.id,
    size: SHAPE_SIZES[p.shape],
    value: p.value,
    isMonomino: p.shape === 'I1'
  }))
  
  // Try to find a subset that meets our constraints
  return findValidSubset(pieces, 25, level.target, level.constraints.monomino_cap)
}

function findValidSubset(
  pieces: Array<{ id: string; size: number; value: number; isMonomino: boolean }>,
  targetCells: number,
  targetSum: number,
  monominoCap: number
): boolean {
  // Use dynamic programming to check if a valid subset exists
  // This is a multi-constraint knapsack problem
  
  function canAchieve(
    index: number,
    cellsLeft: number,
    sumLeft: number,
    monominosUsed: number
  ): boolean {
    // Base cases
    if (cellsLeft === 0 && sumLeft === 0) return true
    if (index >= pieces.length || cellsLeft < 0 || sumLeft < 0) return false
    
    // Try not using this piece
    if (canAchieve(index + 1, cellsLeft, sumLeft, monominosUsed)) {
      return true
    }
    
    // Try using this piece
    const piece = pieces[index]
    if (piece.isMonomino && monominosUsed >= monominoCap) {
      return false
    }
    
    return canAchieve(
      index + 1,
      cellsLeft - piece.size,
      sumLeft - piece.value,
      monominosUsed + (piece.isMonomino ? 1 : 0)
    )
  }
  
  return canAchieve(0, targetCells, targetSum, 0)
}

// Export helper to validate a generated puzzle
export function validateGeneratedPuzzle(level: GameLevel): boolean {
  if (!level.solution) {
    console.warn('Generated puzzle missing solution data')
    return false
  }
  
  // Verify the solution pieces exist in the bag
  const bagIds = new Set(level.bag.map(p => p.id))
  for (const pieceId of level.solution.pieceIds) {
    if (!bagIds.has(pieceId)) {
      console.error(`Solution references non-existent piece: ${pieceId}`)
      return false
    }
  }
  
  // Verify the solution meets constraints
  if (level.solution.cellsCovered !== 25) {
    console.error(`Solution doesn't cover board: ${level.solution.cellsCovered}/25`)
    return false
  }
  
  if (level.solution.finalSum !== level.target) {
    console.error(`Solution sum mismatch: ${level.solution.finalSum} vs ${level.target}`)
    return false
  }
  
  return true
}