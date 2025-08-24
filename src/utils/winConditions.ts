import { GamePiece, BoardCell, GameLevel } from '../types'
import { getBoardCoverage, calculateSum } from './placement'

export interface WinState {
  isWon: boolean
  hasFullCoverage: boolean
  hasCorrectSum: boolean
  completionPercentage: number
  progressScore: number
}

export interface WinAnalysis {
  winState: WinState
  hints: string[]
  nextSteps: string[]
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
}

export function analyzeWinCondition(
  board: BoardCell[][],
  placedPieces: GamePiece[],
  target: number
): WinAnalysis {
  const coverage = getBoardCoverage(board)
  const currentSum = calculateSum(placedPieces)
  const hasFullCoverage = coverage === 25
  const hasCorrectSum = currentSum === target
  const isWon = hasFullCoverage && hasCorrectSum

  const completionPercentage = Math.min(
    ((coverage / 25) * 50) + ((Math.min(currentSum, target) / target) * 50),
    100
  )

  const progressScore = Math.round(
    (coverage * 2) + (Math.min(currentSum / target, 1) * 50)
  )

  const winState: WinState = {
    isWon,
    hasFullCoverage,
    hasCorrectSum,
    completionPercentage,
    progressScore
  }

  const hints = generateHints(coverage, currentSum, target, hasFullCoverage, hasCorrectSum)
  const nextSteps = generateNextSteps(coverage, currentSum, target, hasFullCoverage, hasCorrectSum)
  const achievements = generateAchievements(winState, placedPieces)

  return {
    winState,
    hints,
    nextSteps,
    achievements
  }
}

export function generateHints(
  coverage: number,
  currentSum: number,
  target: number,
  hasFullCoverage: boolean,
  hasCorrectSum: boolean
): string[] {
  const hints: string[] = []

  if (hasFullCoverage && hasCorrectSum) {
    hints.push("🎉 Perfect! You've solved the puzzle!")
    return hints
  }

  if (hasFullCoverage && !hasCorrectSum) {
    if (currentSum > target) {
      hints.push("Board is full but sum is too high. Try replacing high-value pieces with lower ones.")
      hints.push("Consider removing a piece and placing a lower-value alternative.")
    } else {
      hints.push("Board is full but sum is too low. Try replacing low-value pieces with higher ones.")
      hints.push("Look for opportunities to swap pieces for higher values.")
    }
  } else if (hasCorrectSum && !hasFullCoverage) {
    const remaining = 25 - coverage
    hints.push(`Perfect sum! Now fill the remaining ${remaining} cells to complete the puzzle.`)
    hints.push("Look for pieces that can fill the empty spaces without changing your sum.")
  } else {
    // Neither condition met
    const sumDiff = target - currentSum
    const remaining = 25 - coverage

    if (coverage < 10) {
      hints.push("Place larger pieces first to cover more area efficiently.")
    } else if (coverage < 20) {
      hints.push("You're making good progress! Focus on filling gaps with remaining pieces.")
    } else {
      hints.push("Almost there! Carefully place the final pieces to hit both targets.")
    }

    if (sumDiff > 0) {
      hints.push(`You need ${sumDiff} more points to reach the target.`)
    } else if (sumDiff < 0) {
      hints.push(`Your sum is ${Math.abs(sumDiff)} points over the target.`)
    }
  }

  return hints
}

export function generateNextSteps(
  coverage: number,
  currentSum: number,
  target: number,
  hasFullCoverage: boolean,
  hasCorrectSum: boolean
): string[] {
  const steps: string[] = []

  if (hasFullCoverage && hasCorrectSum) {
    return ["Puzzle complete! 🎉"]
  }

  if (!hasFullCoverage) {
    steps.push(`Fill ${25 - coverage} more cells`)
  }

  if (!hasCorrectSum) {
    const diff = target - currentSum
    if (diff > 0) {
      steps.push(`Add ${diff} more points`)
    } else {
      steps.push(`Reduce sum by ${Math.abs(diff)} points`)
    }
  }

  // Strategic suggestions based on current state
  if (coverage < 15) {
    steps.push("Focus on placing tetrominoes first")
  } else if (coverage < 22) {
    steps.push("Use smaller pieces to fill gaps")
  } else {
    steps.push("Carefully adjust final pieces")
  }

  return steps
}

export function generateAchievements(
  winState: WinState,
  placedPieces: GamePiece[]
): Achievement[] {
  const achievements: Achievement[] = []

  if (winState.isWon) {
    achievements.push({
      id: 'puzzle_master',
      title: 'Puzzle Master!',
      description: 'Completed the puzzle with perfect coverage and sum',
      icon: '🏆'
    })
  }

  if (winState.hasFullCoverage) {
    achievements.push({
      id: 'full_coverage',
      title: 'Perfect Fit',
      description: 'Achieved complete board coverage',
      icon: '🧩'
    })
  }

  if (winState.hasCorrectSum) {
    achievements.push({
      id: 'target_sum',
      title: 'Bulls-eye!',
      description: 'Hit the exact target sum',
      icon: '🎯'
    })
  }

  // Bonus achievements
  const pieceTypes = new Set(placedPieces.map(p => p.shape))
  if (pieceTypes.size >= 7) {
    achievements.push({
      id: 'variety_master',
      title: 'Variety Master',
      description: 'Used many different piece types',
      icon: '🌈'
    })
  }

  const hasMonominoes = placedPieces.some(p => p.shape === 'I1')
  if (winState.isWon && !hasMonominoes) {
    achievements.push({
      id: 'no_monominoes',
      title: 'Efficiency Expert',
      description: 'Solved without using monominoes',
      icon: '⚡'
    })
  }

  return achievements
}

export function calculateWinAnimationDelay(): number {
  // Stagger celebration animations for visual appeal
  return Math.random() * 500 + 200 // 200-700ms delay
}

export function getProgressColor(completionPercentage: number): string {
  if (completionPercentage >= 90) return 'text-green-600'
  if (completionPercentage >= 70) return 'text-blue-600'
  if (completionPercentage >= 50) return 'text-yellow-600'
  return 'text-purple-600'
}

export function getProgressBgColor(completionPercentage: number): string {
  if (completionPercentage >= 90) return 'bg-green-200'
  if (completionPercentage >= 70) return 'bg-blue-200'
  if (completionPercentage >= 50) return 'bg-yellow-200'
  return 'bg-purple-200'
}

export function shouldShowHint(
  winState: WinState,
  moveCount: number,
  lastHintTime?: number
): boolean {
  const now = Date.now()
  const minHintInterval = 30000 // 30 seconds between hints

  // Don't show hints if won
  if (winState.isWon) return false

  // Show hints after some moves have been made
  if (moveCount < 3) return false

  // Respect hint cooldown
  if (lastHintTime && (now - lastHintTime) < minHintInterval) return false

  // More likely to show hints if progress is low
  const hintProbability = winState.completionPercentage < 30 ? 0.3 : 0.1

  return Math.random() < hintProbability
}

export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}