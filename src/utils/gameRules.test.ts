import { describe, it, expect } from 'vitest'
import {
  validateGameRules,
  suggestPlacement,
  validateMonominoConstraint,
  checkWinConditionProgress,
  generateMoveValidationFeedback
} from './gameRules'
import { GamePiece, BoardCell, GameLevel } from '../types'

// Helper function to create a mock board
const createMockBoard = (occupiedPositions: { row: number; col: number; pieceId: string }[] = []): BoardCell[][] => {
  const board = Array(5).fill(null).map((_, row) =>
    Array(5).fill(null).map((_, col) => ({ row, col }))
  )
  
  occupiedPositions.forEach(({ row, col, pieceId }) => {
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      board[row][col].pieceId = pieceId
    }
  })
  
  return board
}

// Helper function to create a mock level
const createMockLevel = (monominoCapOverride?: number): GameLevel => ({
  id: 'test-level',
  board: { rows: 5, cols: 5 },
  target: 30,
  constraints: { 
    monomino_cap: monominoCapOverride ?? 1, 
    max_leftovers: 5 
  },
  bag: []
})

// Helper function to create a mock piece
const createMockPiece = (shape: GamePiece['shape'] = 'T4', value: number = 3): GamePiece => ({
  id: 'test-piece',
  shape,
  value,
  rotation: 0,
  flipped: false
})

describe('gameRules', () => {
  describe('validateGameRules', () => {
    it('should allow valid placement', () => {
      const board = createMockBoard()
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []

      const result = validateGameRules(piece, 1, 1, board, placedPieces, level)

      expect(result.valid).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should reject monomino placement when cap is exceeded', () => {
      const board = createMockBoard()
      const piece = createMockPiece('I1', 2) // Monomino
      const level = createMockLevel(1) // Cap of 1
      const placedPieces: GamePiece[] = [
        createMockPiece('I1', 3) // Already placed one monomino
      ]

      const result = validateGameRules(piece, 2, 2, board, placedPieces, level)

      expect(result.valid).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].type).toBe('monomino_cap')
      expect(result.violations[0].severity).toBe('error')
    })

    it('should warn when approaching monomino limit', () => {
      const board = createMockBoard()
      const piece = createMockPiece('I1', 2) // Monomino
      const level = createMockLevel(2) // Cap of 2
      const placedPieces: GamePiece[] = [
        createMockPiece('I1', 3) // Already placed one, this would be the second
      ]

      const result = validateGameRules(piece, 2, 2, board, placedPieces, level)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].type).toBe('monomino_cap')
      expect(result.warnings[0].message).toContain('last allowed monomino')
    })

    it('should reject placement on occupied cell', () => {
      const board = createMockBoard([{ row: 1, col: 1, pieceId: 'existing-piece' }])
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []

      const result = validateGameRules(piece, 1, 1, board, placedPieces, level)

      expect(result.valid).toBe(false)
      expect(result.violations[0].type).toBe('overlap')
    })

    it('should reject placement beyond board boundaries', () => {
      const board = createMockBoard()
      const piece = createMockPiece('T4') // T-piece extends beyond when placed at edge
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []

      const result = validateGameRules(piece, 0, 4, board, placedPieces, level) // Top-right corner

      expect(result.valid).toBe(false)
      expect(result.violations[0].type).toBe('boundary')
    })

    it('should warn about too many leftover pieces', () => {
      const board = createMockBoard()
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      level.constraints.max_leftovers = 2
      level.bag = Array(10).fill(null).map((_, i) => createMockPiece('T4', i)) // 10 pieces total
      const placedPieces: GamePiece[] = [
        createMockPiece('T4', 1),
        createMockPiece('T4', 2)
      ] // Only 2 placed, would leave 8 unused (exceeds limit of 2)

      const result = validateGameRules(piece, 1, 1, board, placedPieces, level)

      expect(result.warnings.some(w => w.type === 'max_leftovers')).toBe(true)
    })
  })

  describe('validateMonominoConstraint', () => {
    it('should allow monomino placement within limit', () => {
      const placedPieces: GamePiece[] = [] // No monominoes placed yet
      const newPiece = createMockPiece('I1')
      const constraints = { monomino_cap: 1, max_leftovers: 5 }

      const result = validateMonominoConstraint(placedPieces, newPiece, constraints)

      expect(result.valid).toBe(true)
    })

    it('should reject monomino placement when limit exceeded', () => {
      const placedPieces: GamePiece[] = [createMockPiece('I1')] // One already placed
      const newPiece = createMockPiece('I1')
      const constraints = { monomino_cap: 1, max_leftovers: 5 }

      const result = validateMonominoConstraint(placedPieces, newPiece, constraints)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('Cannot place more than 1 monomino')
    })

    it('should allow non-monomino pieces regardless of monomino count', () => {
      const placedPieces: GamePiece[] = [createMockPiece('I1')] // Monomino limit reached
      const newPiece = createMockPiece('T4') // Not a monomino
      const constraints = { monomino_cap: 1, max_leftovers: 5 }

      const result = validateMonominoConstraint(placedPieces, newPiece, constraints)

      expect(result.valid).toBe(true)
    })
  })

  describe('checkWinConditionProgress', () => {
    it('should calculate progress correctly', () => {
      const board = createMockBoard([
        { row: 0, col: 0, pieceId: 'p1' },
        { row: 0, col: 1, pieceId: 'p1' },
        { row: 1, col: 0, pieceId: 'p2' }
      ]) // 3 cells occupied
      const placedPieces = [
        createMockPiece('T4', 10),
        createMockPiece('L4', 5)
      ] // Total value: 15
      const target = 30

      const result = checkWinConditionProgress(board, placedPieces, target)

      expect(result.coverageProgress).toBeCloseTo(12, 0) // 3/25 * 100
      expect(result.sumProgress).toBeCloseTo(50, 0) // 15/30 * 100
      expect(result.canWin).toBe(true)
      expect(result.blockers).toHaveLength(0)
    })

    it('should detect when sum exceeds target', () => {
      const board = createMockBoard()
      const placedPieces = [createMockPiece('T4', 40)] // Exceeds target of 30
      const target = 30

      const result = checkWinConditionProgress(board, placedPieces, target)

      expect(result.canWin).toBe(false)
      expect(result.blockers).toContain('Sum exceeds target - remove pieces to reduce')
    })

    it('should detect space constraints', () => {
      const board = createMockBoard(Array(24).fill(null).map((_, i) => ({
        row: Math.floor(i / 5),
        col: i % 5,
        pieceId: `p${i}`
      }))) // 24 cells occupied, only 1 left
      const placedPieces = [createMockPiece('T4', 10)]
      const target = 30

      const result = checkWinConditionProgress(board, placedPieces, target)

      expect(result.blockers).toContain('Very limited space remaining')
    })
  })

  describe('generateMoveValidationFeedback', () => {
    it('should return error feedback for violations', () => {
      const ruleCheck = {
        valid: false,
        violations: [{
          type: 'monomino_cap' as const,
          severity: 'error' as const,
          message: 'Too many monominoes'
        }],
        warnings: []
      }

      const feedback = generateMoveValidationFeedback(ruleCheck)

      expect(feedback.type).toBe('error')
      expect(feedback.message).toBe('Too many monominoes')
    })

    it('should return warning feedback when valid but with warnings', () => {
      const ruleCheck = {
        valid: true,
        violations: [],
        warnings: [{
          type: 'monomino_cap' as const,
          severity: 'warning' as const,
          message: 'Approaching limit'
        }]
      }

      const feedback = generateMoveValidationFeedback(ruleCheck)

      expect(feedback.type).toBe('warning')
      expect(feedback.message).toBe('Approaching limit')
    })

    it('should return success feedback for valid moves', () => {
      const ruleCheck = {
        valid: true,
        violations: [],
        warnings: []
      }

      const feedback = generateMoveValidationFeedback(ruleCheck)

      expect(feedback.type).toBe('success')
      expect(feedback.message).toBe('Valid placement!')
    })
  })

  describe('suggestPlacement', () => {
    it('should return suggestions for valid placements', () => {
      const board = createMockBoard() // Empty board
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []
      const target = 30

      const suggestions = suggestPlacement(piece, board, placedPieces, level, target)

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toHaveProperty('position')
      expect(suggestions[0]).toHaveProperty('confidence')
      expect(suggestions[0]).toHaveProperty('reason')
    })

    it('should sort suggestions by confidence', () => {
      const board = createMockBoard()
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []
      const target = 30

      const suggestions = suggestPlacement(piece, board, placedPieces, level, target)

      if (suggestions.length > 1) {
        for (let i = 1; i < suggestions.length; i++) {
          expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence)
        }
      }
    })

    it('should return empty array when no valid placements', () => {
      // Create a completely filled board
      const board = createMockBoard(Array(25).fill(null).map((_, i) => ({
        row: Math.floor(i / 5),
        col: i % 5,
        pieceId: `p${i}`
      })))
      const piece = createMockPiece('T4')
      const level = createMockLevel()
      const placedPieces: GamePiece[] = []
      const target = 30

      const suggestions = suggestPlacement(piece, board, placedPieces, level, target)

      expect(suggestions).toHaveLength(0)
    })
  })
})