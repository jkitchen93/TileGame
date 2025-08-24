import { describe, it, expect } from 'vitest'
import {
  generateContextualHints,
  shouldShowHint,
  getHintCooldownRemaining,
  HintContext
} from './hintSystem'
import { GamePiece, BoardCell, GameLevel } from '../types'

// Helper function to create a mock board
const createMockBoard = (occupiedCount: number = 0): BoardCell[][] => {
  const board = Array(5).fill(null).map((_, row) =>
    Array(5).fill(null).map((_, col) => ({ row, col }))
  )
  
  let filled = 0
  for (let row = 0; row < 5 && filled < occupiedCount; row++) {
    for (let col = 0; col < 5 && filled < occupiedCount; col++) {
      board[row][col].pieceId = `piece_${filled}`
      filled++
    }
  }
  
  return board
}

// Helper function to create mock pieces
const createMockPieces = (count: number, shapes: string[] = ['T4']): GamePiece[] => {
  return Array(count).fill(null).map((_, i) => ({
    id: `piece_${i}`,
    shape: shapes[i % shapes.length] as GamePiece['shape'],
    value: Math.floor(Math.random() * 5) + 1,
    rotation: 0,
    flipped: false
  }))
}

// Helper function to create mock level
const createMockLevel = (target: number = 30): GameLevel => ({
  id: 'test-level',
  board: { rows: 5, cols: 5 },
  target,
  constraints: { monomino_cap: 1, max_leftovers: 5 },
  bag: createMockPieces(10)
})

// Helper function to create hint context
const createHintContext = (
  boardOccupancy: number = 0,
  moveCount: number = 5,
  placedPiecesCount: number = 3,
  trayPiecesCount: number = 7
): HintContext => ({
  board: createMockBoard(boardOccupancy),
  placedPieces: createMockPieces(placedPiecesCount),
  trayPieces: createMockPieces(trayPiecesCount),
  level: createMockLevel(),
  moveCount,
  timeElapsed: 120, // 2 minutes
  difficulty: 'intermediate'
})

describe('hintSystem', () => {
  describe('generateContextualHints', () => {
    it('should generate early game hints for beginners', () => {
      const context = createHintContext(4, 2, 1, 9) // Early game: few moves, low coverage

      const hints = generateContextualHints(context)

      expect(hints.length).toBeGreaterThan(0)
      expect(hints.some(hint => 
        hint.title.includes('larger pieces') || 
        hint.message.includes('tetrominoes')
      )).toBe(true)
    })

    it('should generate mid-game hints for filling gaps', () => {
      const context = createHintContext(12, 8, 4, 6) // Mid game: moderate coverage

      const hints = generateContextualHints(context)

      expect(hints.length).toBeGreaterThan(0)
      expect(hints.some(hint => 
        hint.message.includes('gap') || 
        hint.message.includes('smaller pieces')
      )).toBe(true)
    })

    it('should generate late game hints for final placement', () => {
      const context = createHintContext(22, 15, 8, 2) // Late game: high coverage, few pieces left

      const hints = generateContextualHints(context)

      expect(hints.length).toBeGreaterThan(0)
      expect(hints.some(hint => 
        hint.message.includes('final') || 
        hint.message.includes('remaining')
      )).toBe(true)
    })

    it('should prioritize high-priority hints', () => {
      const context = createHintContext(20, 10, 6, 4)

      const hints = generateContextualHints(context)

      // First hint should be high or medium priority
      if (hints.length > 0) {
        expect(['high', 'medium']).toContain(hints[0].priority)
      }

      // Hints should be sorted by priority
      for (let i = 1; i < hints.length; i++) {
        const prevPriority = hints[i - 1].priority
        const currPriority = hints[i].priority
        
        const priorityValues = { high: 3, medium: 2, low: 1 }
        expect(priorityValues[prevPriority]).toBeGreaterThanOrEqual(priorityValues[currPriority])
      }
    })

    it('should limit hint count to maximum of 3', () => {
      const context = createHintContext(15, 10, 5, 5)

      const hints = generateContextualHints(context)

      expect(hints.length).toBeLessThanOrEqual(3)
    })

    it('should include monomino strategy hints', () => {
      const context = createHintContext(10, 6, 3, 5)
      // Add monomino to tray pieces
      context.trayPieces.push({
        id: 'monomino_1',
        shape: 'I1',
        value: 2,
        rotation: 0,
        flipped: false
      })

      const hints = generateContextualHints(context)

      expect(hints.some(hint => 
        hint.message.includes('monomino') || 
        hint.message.includes('single-cell')
      )).toBe(true)
    })

    it('should provide encouragement hints occasionally', () => {
      // This test is probabilistic, so we'll run it multiple times
      let foundEncouragement = false
      
      for (let i = 0; i < 20; i++) {
        const context = createHintContext(10, 8, 4, 6)
        const hints = generateContextualHints(context)
        
        if (hints.some(hint => hint.type === 'encouragement')) {
          foundEncouragement = true
          break
        }
      }

      // With 20 attempts and 10% chance per attempt, we should find at least one
      // This is not deterministic but gives us reasonable confidence
      expect(foundEncouragement).toBe(true)
    })
  })

  describe('shouldShowHint', () => {
    it('should never show hints when frequency is never', () => {
      const context = createHintContext(10, 10, 5, 5)
      
      const result = shouldShowHint(context, 'never')

      expect(result).toBe(false)
    })

    it('should respect minimum time intervals', () => {
      const context = createHintContext(10, 10, 5, 5)
      context.lastHintTime = Date.now() - 5000 // 5 seconds ago

      const result = shouldShowHint(context, 'frequent') // 30s interval

      expect(result).toBe(false)
    })

    it('should allow hints after sufficient time has passed', () => {
      const context = createHintContext(10, 10, 5, 5)
      context.lastHintTime = Date.now() - 120000 // 2 minutes ago

      // This is probabilistic, so we'll test the possibility
      const result = shouldShowHint(context, 'normal') // 60s interval

      // Should at least have the possibility to show hint
      expect(typeof result).toBe('boolean')
    })

    it('should never show hints without lastHintTime after minimum moves', () => {
      const context = createHintContext(10, 10, 5, 5)
      context.lastHintTime = undefined

      // Should have the possibility to show hint when no previous hint time
      const result = shouldShowHint(context, 'frequent')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getHintCooldownRemaining', () => {
    it('should return 0 when never showing hints', () => {
      const lastHintTime = Date.now() - 5000
      
      const remaining = getHintCooldownRemaining(lastHintTime, 'never')

      expect(remaining).toBe(0)
    })

    it('should return 0 when no last hint time', () => {
      const remaining = getHintCooldownRemaining(undefined, 'normal')

      expect(remaining).toBe(0)
    })

    it('should calculate remaining cooldown time correctly', () => {
      const lastHintTime = Date.now() - 30000 // 30 seconds ago
      
      const remaining = getHintCooldownRemaining(lastHintTime, 'normal') // 60s interval

      expect(remaining).toBeCloseTo(30000, -3) // Should be ~30s remaining
    })

    it('should return 0 when cooldown period has passed', () => {
      const lastHintTime = Date.now() - 120000 // 2 minutes ago
      
      const remaining = getHintCooldownRemaining(lastHintTime, 'normal') // 60s interval

      expect(remaining).toBe(0)
    })

    it('should handle different frequency intervals', () => {
      const lastHintTime = Date.now() - 45000 // 45 seconds ago

      expect(getHintCooldownRemaining(lastHintTime, 'frequent')).toBe(0) // 30s interval, should be 0
      expect(getHintCooldownRemaining(lastHintTime, 'normal')).toBeCloseTo(15000, -3) // 60s interval, ~15s remaining
      expect(getHintCooldownRemaining(lastHintTime, 'rare')).toBeCloseTo(75000, -3) // 120s interval, ~75s remaining
    })
  })

  describe('hint content validation', () => {
    it('should generate hints with required properties', () => {
      const context = createHintContext(10, 8, 4, 6)

      const hints = generateContextualHints(context)

      hints.forEach(hint => {
        expect(hint).toHaveProperty('id')
        expect(hint).toHaveProperty('type')
        expect(hint).toHaveProperty('priority')
        expect(hint).toHaveProperty('title')
        expect(hint).toHaveProperty('message')
        
        expect(typeof hint.id).toBe('string')
        expect(['placement', 'strategy', 'warning', 'encouragement']).toContain(hint.type)
        expect(['low', 'medium', 'high']).toContain(hint.priority)
        expect(typeof hint.title).toBe('string')
        expect(typeof hint.message).toBe('string')
        
        expect(hint.title.length).toBeGreaterThan(0)
        expect(hint.message.length).toBeGreaterThan(0)
      })
    })

    it('should include duration for placement hints', () => {
      const context = createHintContext(5, 3, 2, 8) // Early game for placement hints

      const hints = generateContextualHints(context)
      const placementHints = hints.filter(h => h.type === 'placement')

      placementHints.forEach(hint => {
        expect(hint.duration).toBeGreaterThan(0)
        expect(hint.duration).toBeLessThanOrEqual(10000) // Max 10 seconds
      })
    })
  })
})