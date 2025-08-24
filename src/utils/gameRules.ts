import { GamePiece, BoardCell, GameLevel, Coordinates } from '../types'
import { isValidPlacement, getOccupiedCells, findBestPlacement } from './placement'

export interface RuleViolation {
  type: 'monomino_cap' | 'overlap' | 'boundary' | 'max_leftovers'
  severity: 'error' | 'warning'
  message: string
  suggestion?: string
  affectedCells?: Coordinates[]
}

export interface GameRuleCheck {
  valid: boolean
  violations: RuleViolation[]
  warnings: RuleViolation[]
}

export interface PlacementSuggestion {
  position: Coordinates
  confidence: number
  reason: string
  alternativePositions?: Coordinates[]
}

export function validateGameRules(
  piece: GamePiece,
  row: number,
  col: number,
  board: BoardCell[][],
  placedPieces: GamePiece[],
  level: GameLevel
): GameRuleCheck {
  const violations: RuleViolation[] = []
  const warnings: RuleViolation[] = []

  // Check monomino constraint
  const monominoCount = placedPieces.filter(p => p.shape === 'I1').length
  if (piece.shape === 'I1' && monominoCount >= level.constraints.monomino_cap) {
    violations.push({
      type: 'monomino_cap',
      severity: 'error',
      message: `Maximum ${level.constraints.monomino_cap} monomino(s) allowed per level`,
      suggestion: 'Remove an existing monomino before placing this one, or choose a different piece'
    })
  }

  // Check basic placement validity
  const placementResult = isValidPlacement(piece, row, col, board, placedPieces, monominoCount)
  if (!placementResult.valid) {
    const violationType = placementResult.reason?.includes('boundaries') ? 'boundary' : 'overlap'
    violations.push({
      type: violationType,
      severity: 'error',
      message: placementResult.reason || 'Invalid placement',
      suggestion: getPlacementSuggestion(violationType),
      affectedCells: placementResult.occupiedCells
    })
  }

  // Check for approaching monomino limit (warning)
  if (piece.shape === 'I1' && monominoCount === level.constraints.monomino_cap - 1) {
    warnings.push({
      type: 'monomino_cap',
      severity: 'warning',
      message: 'This will be your last allowed monomino',
      suggestion: 'Consider if this is the best placement for your final monomino'
    })
  }

  // Check for excessive unused pieces (warning)
  const totalPlaced = placedPieces.length + (violations.length === 0 ? 1 : 0) // Include current piece if valid
  const remainingPieces = level.bag.length - totalPlaced
  if (remainingPieces > level.constraints.max_leftovers) {
    warnings.push({
      type: 'max_leftovers',
      severity: 'warning',
      message: `${remainingPieces} pieces will remain unused (limit: ${level.constraints.max_leftovers})`,
      suggestion: 'You may need to use more pieces to complete the puzzle'
    })
  }

  return {
    valid: violations.length === 0,
    violations,
    warnings
  }
}

function getPlacementSuggestion(violationType: string): string {
  switch (violationType) {
    case 'boundary':
      return 'Try placing the piece closer to the center of the board'
    case 'overlap':
      return 'Find an empty area or remove overlapping pieces first'
    default:
      return 'Try a different position or piece transformation'
  }
}

export function suggestPlacement(
  piece: GamePiece,
  board: BoardCell[][],
  placedPieces: GamePiece[],
  level: GameLevel,
  target: number
): PlacementSuggestion[] {
  const suggestions: PlacementSuggestion[] = []
  const validPlacements = findBestPlacement(
    piece, 
    board, 
    placedPieces, 
    placedPieces.filter(p => p.shape === 'I1').length
  )

  for (const pos of validPlacements.slice(0, 3)) { // Top 3 suggestions
    const confidence = calculatePlacementConfidence(piece, pos, board, placedPieces, target)
    const reason = getPlacementReason(confidence)
    
    suggestions.push({
      position: pos,
      confidence,
      reason,
      alternativePositions: validPlacements.slice(3, 6) // Next 3 as alternatives
    })
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

function calculatePlacementConfidence(
  piece: GamePiece,
  position: Coordinates,
  board: BoardCell[][],
  placedPieces: GamePiece[],
  target: number
): number {
  let confidence = 50 // Base confidence

  // Factor in sum contribution
  const currentSum = placedPieces.reduce((sum, p) => sum + p.value, 0)
  const newSum = currentSum + piece.value
  const sumDistance = Math.abs(target - newSum)
  const previousSumDistance = Math.abs(target - currentSum)
  
  if (sumDistance < previousSumDistance) {
    confidence += 20 // Getting closer to target
  } else if (sumDistance > previousSumDistance) {
    confidence -= 15 // Getting further from target
  }

  // Factor in board coverage efficiency
  const occupiedCells = getOccupiedCells(piece, position.y, position.x)
  const avgDistanceFromCenter = occupiedCells.reduce((sum, cell) => {
    return sum + Math.abs(cell.x - 2) + Math.abs(cell.y - 2)
  }, 0) / occupiedCells.length

  confidence += (5 - avgDistanceFromCenter) * 5 // Prefer center placements

  // Factor in adjacent piece synergy
  let adjacentPieces = 0
  for (const cell of occupiedCells) {
    const neighbors = [
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x, y: cell.y + 1 }
    ]
    
    for (const neighbor of neighbors) {
      if (neighbor.x >= 0 && neighbor.x < 5 && neighbor.y >= 0 && neighbor.y < 5) {
        if (board[neighbor.y][neighbor.x].pieceId) {
          adjacentPieces++
        }
      }
    }
  }

  confidence += adjacentPieces * 3 // Prefer placements near existing pieces

  return Math.min(Math.max(confidence, 0), 100)
}

function getPlacementReason(confidence: number): string {
  if (confidence >= 80) return 'Excellent strategic position'
  if (confidence >= 65) return 'Good placement for sum and coverage'
  if (confidence >= 50) return 'Decent positioning option'
  return 'Fallback placement choice'
}

export function validateMonominoConstraint(
  placedPieces: GamePiece[],
  newPiece: GamePiece,
  constraints: GameLevel['constraints']
): { valid: boolean; message?: string } {
  const currentMonominoes = placedPieces.filter(p => p.shape === 'I1').length
  const wouldPlaceMonomino = newPiece.shape === 'I1'
  
  if (wouldPlaceMonomino && currentMonominoes >= constraints.monomino_cap) {
    return {
      valid: false,
      message: `Cannot place more than ${constraints.monomino_cap} monomino(s) per level`
    }
  }

  return { valid: true }
}

export function checkWinConditionProgress(
  board: BoardCell[][],
  placedPieces: GamePiece[],
  target: number
): {
  coverageProgress: number
  sumProgress: number
  canWin: boolean
  blockers: string[]
} {
  const coverage = board.flat().filter(cell => cell.pieceId).length
  const currentSum = placedPieces.reduce((sum, piece) => sum + piece.value, 0)
  
  const coverageProgress = (coverage / 25) * 100
  const sumProgress = Math.min((currentSum / target) * 100, 100)
  
  const blockers: string[] = []
  
  // Check if current sum makes winning impossible
  if (currentSum > target) {
    blockers.push('Sum exceeds target - remove pieces to reduce')
  }
  
  // Check if remaining space is too small for remaining pieces
  const remainingCells = 25 - coverage
  if (remainingCells > 0 && remainingCells < 2) {
    blockers.push('Very limited space remaining')
  }
  
  const canWin = blockers.length === 0 && (currentSum <= target)
  
  return {
    coverageProgress,
    sumProgress,
    canWin,
    blockers
  }
}

export function generateMoveValidationFeedback(
  ruleCheck: GameRuleCheck
): { message: string; type: 'error' | 'warning' | 'success' } {
  if (ruleCheck.violations.length > 0) {
    return {
      message: ruleCheck.violations[0].message,
      type: 'error'
    }
  }
  
  if (ruleCheck.warnings.length > 0) {
    return {
      message: ruleCheck.warnings[0].message,
      type: 'warning'
    }
  }
  
  return {
    message: 'Valid placement!',
    type: 'success'
  }
}