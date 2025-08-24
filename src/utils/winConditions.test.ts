import { describe, it, expect } from 'vitest'
import {
  analyzeWinCondition,
  generateHints,
  generateNextSteps,
  generateAchievements,
  shouldShowHint,
  formatTimeDisplay
} from './winConditions'
import { GamePiece, BoardCell } from '../types'

// Helper function to create a mock board
const createMockBoard = (occupiedCells: number = 0): BoardCell[][] => {
  const board = Array(5).fill(null).map((_, row) =>
    Array(5).fill(null).map((_, col) => ({ row, col }))
  )
  
  // Fill some cells to simulate occupied state
  let filled = 0
  for (let row = 0; row < 5 && filled < occupiedCells; row++) {
    for (let col = 0; col < 5 && filled < occupiedCells; col++) {
      board[row][col].pieceId = `piece_${filled}`
      filled++
    }
  }
  
  return board
}

// Helper function to create mock pieces
const createMockPieces = (count: number, totalValue: number): GamePiece[] => {
  const pieces: GamePiece[] = []
  const valuePerPiece = Math.floor(totalValue / count)
  
  for (let i = 0; i < count; i++) {
    pieces.push({
      id: `piece_${i}`,
      shape: i === 0 ? 'I1' : 'T4', // First piece is monomino
      value: valuePerPiece,
      rotation: 0,
      flipped: false
    })
  }
  
  return pieces
}

describe('winConditions', () => {
  describe('analyzeWinCondition', () => {
    it('should detect a complete win', () => {
      const board = createMockBoard(25)
      const pieces = createMockPieces(6, 30)
      const target = 30

      const analysis = analyzeWinCondition(board, pieces, target)

      expect(analysis.winState.isWon).toBe(true)
      expect(analysis.winState.hasFullCoverage).toBe(true)
      expect(analysis.winState.hasCorrectSum).toBe(true)
      expect(analysis.winState.completionPercentage).toBe(100)
    })

    it('should detect partial completion - coverage only', () => {
      const board = createMockBoard(25)
      const pieces = createMockPieces(6, 20) // Wrong sum
      const target = 30

      const analysis = analyzeWinCondition(board, pieces, target)

      expect(analysis.winState.isWon).toBe(false)
      expect(analysis.winState.hasFullCoverage).toBe(true)
      expect(analysis.winState.hasCorrectSum).toBe(false)
    })

    it('should detect partial completion - sum only', () => {
      const board = createMockBoard(15) // Not full coverage
      const pieces = createMockPieces(6, 30)
      const target = 30

      const analysis = analyzeWinCondition(board, pieces, target)

      expect(analysis.winState.isWon).toBe(false)
      expect(analysis.winState.hasFullCoverage).toBe(false)
      expect(analysis.winState.hasCorrectSum).toBe(true)
    })

    it('should calculate completion percentage correctly', () => {
      const board = createMockBoard(15) // 60% coverage
      const pieces = createMockPieces(6, 24) // 80% of 30 target
      const target = 30

      const analysis = analyzeWinCondition(board, pieces, target)

      // Should be weighted: 60% coverage * 50% + 80% sum * 50% = 70%
      expect(analysis.winState.completionPercentage).toBeCloseTo(70, 0)
    })

    it('should include achievements for complete puzzle', () => {
      const board = createMockBoard(25)
      const pieces = createMockPieces(6, 30)
      const target = 30

      const analysis = analyzeWinCondition(board, pieces, target)

      expect(analysis.achievements).toContain(
        expect.objectContaining({
          id: 'puzzle_master',
          title: 'Puzzle Master!'
        })
      )
    })
  })

  describe('generateHints', () => {
    it('should provide completion hints for perfect win', () => {
      const hints = generateHints(25, 30, 30, true, true)

      expect(hints).toHaveLength(1)
      expect(hints[0]).toContain('Perfect! You\'ve solved the puzzle!')
    })

    it('should suggest sum adjustments when coverage is complete', () => {
      const hints = generateHints(25, 35, 30, true, false) // Sum too high

      expect(hints.some(hint => hint.includes('sum is too high'))).toBe(true)
      expect(hints.some(hint => hint.includes('removing'))).toBe(true)
    })

    it('should suggest filling remaining cells when sum is correct', () => {
      const hints = generateHints(20, 30, 30, false, true)

      expect(hints.some(hint => hint.includes('Perfect sum!'))).toBe(true)
      expect(hints.some(hint => hint.includes('fill the remaining'))).toBe(true)
    })

    it('should provide progress hints for early game', () => {
      const hints = generateHints(5, 10, 30, false, false)

      expect(hints.some(hint => 
        hint.includes('larger pieces') || 
        hint.includes('progress') ||
        hint.includes('more points')
      )).toBe(true)
    })
  })

  describe('generateNextSteps', () => {
    it('should return completion message for won puzzle', () => {
      const steps = generateNextSteps(25, 30, 30, true, true)

      expect(steps).toContain('Puzzle complete! 🎉')
    })

    it('should suggest filling cells when not at full coverage', () => {
      const steps = generateNextSteps(20, 30, 30, false, true)

      expect(steps).toContain('Fill 5 more cells')
    })

    it('should suggest adjusting sum when not correct', () => {
      const steps = generateNextSteps(25, 25, 30, true, false)

      expect(steps).toContain('Add 5 more points')
    })

    it('should suggest reducing sum when over target', () => {
      const steps = generateNextSteps(25, 35, 30, true, false)

      expect(steps).toContain('Reduce sum by 5 points')
    })
  })

  describe('generateAchievements', () => {
    it('should award puzzle master for complete win', () => {
      const winState = {
        isWon: true,
        hasFullCoverage: true,
        hasCorrectSum: true,
        completionPercentage: 100,
        progressScore: 100
      }
      const pieces = createMockPieces(5, 30)

      const achievements = generateAchievements(winState, pieces)

      expect(achievements).toContainEqual(
        expect.objectContaining({
          id: 'puzzle_master',
          title: 'Puzzle Master!',
          icon: '🏆'
        })
      )
    })

    it('should award coverage achievement', () => {
      const winState = {
        isWon: false,
        hasFullCoverage: true,
        hasCorrectSum: false,
        completionPercentage: 80,
        progressScore: 80
      }
      const pieces = createMockPieces(5, 20)

      const achievements = generateAchievements(winState, pieces)

      expect(achievements).toContainEqual(
        expect.objectContaining({
          id: 'full_coverage',
          title: 'Perfect Fit',
          icon: '🧩'
        })
      )
    })

    it('should award efficiency expert for no monominoes', () => {
      const winState = {
        isWon: true,
        hasFullCoverage: true,
        hasCorrectSum: true,
        completionPercentage: 100,
        progressScore: 100
      }
      const pieces = createMockPieces(5, 30).map(p => ({ ...p, shape: 'T4' as any })) // No monominoes

      const achievements = generateAchievements(winState, pieces)

      expect(achievements).toContainEqual(
        expect.objectContaining({
          id: 'no_monominoes',
          title: 'Efficiency Expert',
          icon: '⚡'
        })
      )
    })
  })

  describe('shouldShowHint', () => {
    it('should not show hints for won puzzles', () => {
      const winState = {
        isWon: true,
        hasFullCoverage: true,
        hasCorrectSum: true,
        completionPercentage: 100,
        progressScore: 100
      }

      const result = shouldShowHint(winState, 10)

      expect(result).toBe(false)
    })

    it('should not show hints for early moves', () => {
      const winState = {
        isWon: false,
        hasFullCoverage: false,
        hasCorrectSum: false,
        completionPercentage: 20,
        progressScore: 20
      }

      const result = shouldShowHint(winState, 1) // Only 1 move

      expect(result).toBe(false)
    })

    it('should respect hint cooldown', () => {
      const winState = {
        isWon: false,
        hasFullCoverage: false,
        hasCorrectSum: false,
        completionPercentage: 20,
        progressScore: 20
      }
      const recentHintTime = Date.now() - 10000 // 10 seconds ago

      const result = shouldShowHint(winState, 10, recentHintTime)

      expect(result).toBe(false) // Should still be in cooldown
    })
  })

  describe('formatTimeDisplay', () => {
    it('should format seconds correctly', () => {
      expect(formatTimeDisplay(45)).toBe('0:45')
      expect(formatTimeDisplay(5)).toBe('0:05')
    })

    it('should format minutes and seconds correctly', () => {
      expect(formatTimeDisplay(125)).toBe('2:05')
      expect(formatTimeDisplay(600)).toBe('10:00')
    })

    it('should handle large times', () => {
      expect(formatTimeDisplay(3665)).toBe('61:05') // Over an hour
    })
  })
})