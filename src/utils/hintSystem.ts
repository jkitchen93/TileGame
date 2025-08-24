import { GamePiece, BoardCell, GameLevel, Coordinates } from '../types'
import { findBestPlacement, getBoardCoverage, calculateSum } from './placement'
import { suggestPlacement } from './gameRules'

export interface Hint {
  id: string
  type: 'placement' | 'strategy' | 'warning' | 'encouragement'
  priority: 'low' | 'medium' | 'high'
  title: string
  message: string
  suggestedPiece?: GamePiece
  suggestedPosition?: Coordinates
  alternativePositions?: Coordinates[]
  duration?: number // How long to show hint in milliseconds
}

export interface HintContext {
  board: BoardCell[][]
  placedPieces: GamePiece[]
  trayPieces: GamePiece[]
  level: GameLevel
  moveCount: number
  timeElapsed: number
  lastHintTime?: number
  difficulty: 'beginner' | 'intermediate' | 'expert'
}

export function generateContextualHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const coverage = getBoardCoverage(context.board)
  const currentSum = calculateSum(context.placedPieces)
  const { level, trayPieces, moveCount } = context

  // Early game hints (first few moves)
  if (moveCount < 3 && coverage < 8) {
    hints.push(...generateEarlyGameHints(context))
  }

  // Mid-game hints (making progress)
  else if (coverage >= 8 && coverage < 20) {
    hints.push(...generateMidGameHints(context))
  }

  // Late game hints (close to completion)
  else if (coverage >= 20) {
    hints.push(...generateLateGameHints(context))
  }

  // Sum-specific hints
  hints.push(...generateSumHints(context, currentSum))

  // Strategic hints
  hints.push(...generateStrategicHints(context))

  // Warning hints
  hints.push(...generateWarningHints(context))

  // Encouragement hints
  if (Math.random() < 0.1) {
    hints.push(...generateEncouragementHints(context))
  }

  return hints
    .sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
    .slice(0, 3) // Return top 3 hints
}

function generateEarlyGameHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { trayPieces, board, placedPieces, level } = context

  // Suggest starting with larger pieces
  const largestPiece = trayPieces
    .filter(p => p.shape.includes('4')) // Tetrominoes
    .sort((a, b) => b.value - a.value)[0]

  if (largestPiece) {
    const suggestions = suggestPlacement(largestPiece, board, placedPieces, level, level.target)
    if (suggestions.length > 0) {
      hints.push({
        id: `early_large_${Date.now()}`,
        type: 'placement',
        priority: 'high',
        title: 'Start with larger pieces',
        message: 'Place tetrominoes first to establish a foundation',
        suggestedPiece: largestPiece,
        suggestedPosition: suggestions[0].position,
        alternativePositions: suggestions.slice(1).map(s => s.position),
        duration: 8000
      })
    }
  }

  // Center placement strategy
  if (placedPieces.length === 0) {
    hints.push({
      id: `center_start_${Date.now()}`,
      type: 'strategy',
      priority: 'medium',
      title: 'Consider center placement',
      message: 'Starting near the center gives you more flexibility',
      duration: 6000
    })
  }

  return hints
}

function generateMidGameHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { board, trayPieces, placedPieces, level } = context

  // Find gaps that need filling
  const smallPieces = trayPieces.filter(p => p.shape.includes('2') || p.shape.includes('3'))
  
  if (smallPieces.length > 0) {
    const gapFillPiece = smallPieces[0]
    const suggestions = suggestPlacement(gapFillPiece, board, placedPieces, level, level.target)
    
    if (suggestions.length > 0) {
      hints.push({
        id: `gap_fill_${Date.now()}`,
        type: 'placement',
        priority: 'high',
        title: 'Fill the gaps',
        message: 'Use smaller pieces to fill spaces between larger ones',
        suggestedPiece: gapFillPiece,
        suggestedPosition: suggestions[0].position,
        duration: 7000
      })
    }
  }

  // Connection strategy
  hints.push({
    id: `connection_${Date.now()}`,
    type: 'strategy',
    priority: 'medium',
    title: 'Connect your pieces',
    message: 'Try to place pieces adjacent to existing ones for better coverage',
    duration: 5000
  })

  return hints
}

function generateLateGameHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { board, trayPieces, placedPieces, level } = context
  const coverage = getBoardCoverage(board)
  const remaining = 25 - coverage

  if (remaining <= 5) {
    // Critical final placement hints
    const bestFitPiece = findBestFitForRemainingCells(board, trayPieces, placedPieces, level)
    
    if (bestFitPiece) {
      hints.push({
        id: `final_fit_${Date.now()}`,
        type: 'placement',
        priority: 'high',
        title: 'Perfect final piece',
        message: `This piece should fit the remaining ${remaining} cells perfectly`,
        suggestedPiece: bestFitPiece.piece,
        suggestedPosition: bestFitPiece.position,
        duration: 10000
      })
    } else {
      hints.push({
        id: `recheck_placement_${Date.now()}`,
        type: 'warning',
        priority: 'high',
        title: 'Check your placements',
        message: 'You might need to rearrange pieces to complete the puzzle',
        duration: 8000
      })
    }
  }

  return hints
}

function generateSumHints(context: HintContext, currentSum: number): Hint[] {
  const hints: Hint[] = []
  const { level, trayPieces } = context
  const target = level.target
  const difference = target - currentSum

  if (Math.abs(difference) <= 3 && difference !== 0) {
    // Very close to target
    const suitablePiece = trayPieces.find(p => 
      difference > 0 ? p.value === difference : p.value === Math.abs(difference)
    )

    if (suitablePiece && difference > 0) {
      hints.push({
        id: `exact_sum_${Date.now()}`,
        type: 'placement',
        priority: 'high',
        title: 'Perfect sum piece!',
        message: `This piece has exactly the ${difference} points you need`,
        suggestedPiece: suitablePiece,
        duration: 8000
      })
    } else if (difference < 0) {
      hints.push({
        id: `sum_too_high_${Date.now()}`,
        type: 'warning',
        priority: 'high',
        title: 'Sum too high',
        message: `Remove pieces worth ${Math.abs(difference)} points to reach target`,
        duration: 7000
      })
    }
  } else if (difference > 10) {
    // Need many more points
    const highValuePieces = trayPieces
      .filter(p => p.value >= 4)
      .sort((a, b) => b.value - a.value)

    if (highValuePieces.length > 0) {
      hints.push({
        id: `high_value_${Date.now()}`,
        type: 'strategy',
        priority: 'medium',
        title: 'Use high-value pieces',
        message: `You need ${difference} more points - prioritize valuable pieces`,
        duration: 6000
      })
    }
  }

  return hints
}

function generateStrategicHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { trayPieces, placedPieces, level } = context

  // Monomino usage strategy
  const monominoesInTray = trayPieces.filter(p => p.shape === 'I1')
  const monominoesPlaced = placedPieces.filter(p => p.shape === 'I1')

  if (monominoesInTray.length > 0 && monominoesPlaced.length === 0) {
    hints.push({
      id: `monomino_strategy_${Date.now()}`,
      type: 'strategy',
      priority: 'medium',
      title: 'Save monominoes for gaps',
      message: 'Use your single-cell pieces to fill small gaps at the end',
      duration: 5000
    })
  }

  // Transform reminder
  if (Math.random() < 0.2) {
    hints.push({
      id: `transform_reminder_${Date.now()}`,
      type: 'strategy',
      priority: 'low',
      title: 'Try rotating pieces',
      message: 'Press R to rotate or F to flip pieces for better fit',
      duration: 4000
    })
  }

  return hints
}

function generateWarningHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { level, placedPieces, trayPieces } = context

  // Check for impossible situations
  const totalRemainingValue = trayPieces.reduce((sum, p) => sum + p.value, 0)
  const currentSum = calculateSum(placedPieces)
  const maxPossibleSum = currentSum + totalRemainingValue

  if (maxPossibleSum < level.target) {
    hints.push({
      id: `impossible_sum_${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Cannot reach target',
      message: 'Even with all pieces, you cannot reach the target sum',
      duration: 10000
    })
  }

  // Too many pieces left
  const maxLeftovers = level.constraints.max_leftovers
  if (trayPieces.length > maxLeftovers + 3) {
    hints.push({
      id: `too_many_pieces_${Date.now()}`,
      type: 'warning',
      priority: 'medium',
      title: 'Use more pieces',
      message: `You can only leave ${maxLeftovers} pieces unused`,
      duration: 6000
    })
  }

  return hints
}

function generateEncouragementHints(context: HintContext): Hint[] {
  const hints: Hint[] = []
  const { moveCount } = context

  const encouragements = [
    'You\'re doing great!',
    'Keep going, you\'ve got this!',
    'Nice strategic thinking!',
    'Excellent progress so far!',
    'You\'re getting the hang of it!'
  ]

  if (moveCount > 5) {
    hints.push({
      id: `encouragement_${Date.now()}`,
      type: 'encouragement',
      priority: 'low',
      title: 'Keep it up!',
      message: encouragements[Math.floor(Math.random() * encouragements.length)],
      duration: 3000
    })
  }

  return hints
}

function findBestFitForRemainingCells(
  board: BoardCell[][],
  trayPieces: GamePiece[],
  placedPieces: GamePiece[],
  level: GameLevel
): { piece: GamePiece; position: Coordinates } | null {
  // Find empty cells
  const emptyCells: Coordinates[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!board[row][col].pieceId) {
        emptyCells.push({ x: col, y: row })
      }
    }
  }

  // Try each piece to see if it fits exactly
  for (const piece of trayPieces) {
    const validPlacements = findBestPlacement(
      piece,
      board,
      placedPieces,
      placedPieces.filter(p => p.shape === 'I1').length
    )

    for (const pos of validPlacements) {
      // Check if this placement would fill exactly the remaining cells
      // This is a simplified check - more complex shape matching could be implemented
      if (validPlacements.length === 1) {
        return { piece, position: pos }
      }
    }
  }

  return null
}

function getPriorityWeight(priority: Hint['priority']): number {
  switch (priority) {
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
    default: return 0
  }
}

export function shouldShowHint(
  context: HintContext,
  hintFrequency: 'never' | 'rare' | 'normal' | 'frequent'
): boolean {
  if (hintFrequency === 'never') return false

  const timeSinceLastHint = context.lastHintTime ? Date.now() - context.lastHintTime : Infinity
  const minInterval = {
    rare: 120000,     // 2 minutes
    normal: 60000,    // 1 minute
    frequent: 30000   // 30 seconds
  }[hintFrequency]

  return timeSinceLastHint > minInterval && Math.random() < 0.3
}

export function getHintCooldownRemaining(
  lastHintTime: number | undefined,
  hintFrequency: 'never' | 'rare' | 'normal' | 'frequent'
): number {
  if (!lastHintTime || hintFrequency === 'never') return 0

  const intervals = {
    rare: 120000,
    normal: 60000,
    frequent: 30000
  }

  const elapsed = Date.now() - lastHintTime
  const interval = intervals[hintFrequency]
  
  return Math.max(0, interval - elapsed)
}