import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameFlowStore } from './gameFlowStore'
import { GameLevel, GameState } from '../types'

// Mock Date.now for consistent testing
const mockNow = 1000000000000 // A fixed timestamp
vi.spyOn(Date, 'now').mockImplementation(() => mockNow)

// Helper function to create mock level
const createMockLevel = (): GameLevel => ({
  id: 'test-level',
  board: { rows: 5, cols: 5 },
  target: 30,
  constraints: { monomino_cap: 1, max_leftovers: 5 },
  bag: []
})

// Helper function to create mock game state
const createMockGameState = (isWon: boolean = false): GameState => ({
  level: createMockLevel(),
  board: [],
  placedPieces: [],
  trayPieces: [],
  currentSum: 0,
  coveredCells: 0,
  monominoCount: 0,
  isWon
})

// Helper function to reset store to initial state
const resetStore = () => {
  const store = useGameFlowStore.getState()
  useGameFlowStore.setState({
    gameStats: {
      totalMoves: 0,
      undoCount: 0,
      timeElapsed: 0,
      hintsUsed: 0,
      puzzlesSolved: 0,
      averageMoves: 0,
      bestTime: 0
    },
    moveHistory: [],
    currentMoveIndex: -1,
    isPaused: false,
    startTime: null,
    lastHintTime: null,
    currentAnalysis: null,
    lastRuleCheck: null
  })
}

describe('gameFlowStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  describe('startGame', () => {
    it('should initialize game with level and reset state', () => {
      const level = createMockLevel()
      const { startGame } = useGameFlowStore.getState()

      startGame(level)

      const state = useGameFlowStore.getState()
      expect(state.startTime).toBe(mockNow)
      expect(state.moveHistory).toEqual([])
      expect(state.currentMoveIndex).toBe(-1)
      expect(state.isPaused).toBe(false)
      expect(state.gameStats.totalMoves).toBe(0)
    })
  })

  describe('recordMove', () => {
    it('should add move to history and increment index', () => {
      const level = createMockLevel()
      const { startGame, recordMove } = useGameFlowStore.getState()

      startGame(level)
      
      const moveData = {
        type: 'place' as const,
        piece: {
          id: 'test-piece',
          shape: 'T4' as const,
          value: 3,
          rotation: 0,
          flipped: false
        },
        position: { row: 1, col: 1 },
        previousState: createMockGameState()
      }

      recordMove(moveData)

      const state = useGameFlowStore.getState()
      expect(state.moveHistory).toHaveLength(1)
      expect(state.currentMoveIndex).toBe(0)
      expect(state.gameStats.totalMoves).toBe(1)
      expect(state.moveHistory[0]).toMatchObject({
        type: 'place',
        piece: moveData.piece,
        position: moveData.position
      })
    })

    it('should truncate history when recording after undo', () => {
      const { startGame, recordMove, undoMove } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // Record two moves
      const moveData1 = {
        type: 'place' as const,
        piece: { id: 'piece1', shape: 'T4' as const, value: 3, rotation: 0, flipped: false },
        previousState: createMockGameState()
      }
      const moveData2 = {
        type: 'place' as const,
        piece: { id: 'piece2', shape: 'L4' as const, value: 4, rotation: 0, flipped: false },
        previousState: createMockGameState()
      }

      recordMove(moveData1)
      recordMove(moveData2)

      // Undo one move
      undoMove()

      // Record new move - should truncate history
      const moveData3 = {
        type: 'place' as const,
        piece: { id: 'piece3', shape: 'I4' as const, value: 5, rotation: 0, flipped: false },
        previousState: createMockGameState()
      }
      recordMove(moveData3)

      const state = useGameFlowStore.getState()
      expect(state.moveHistory).toHaveLength(2) // Should have moves 1 and 3, not 2
      expect(state.moveHistory[1].piece.id).toBe('piece3')
    })
  })

  describe('undo/redo functionality', () => {
    beforeEach(() => {
      const { startGame, recordMove } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // Add some moves for testing
      recordMove({
        type: 'place',
        piece: { id: 'piece1', shape: 'T4', value: 3, rotation: 0, flipped: false },
        previousState: createMockGameState()
      })
      recordMove({
        type: 'remove',
        piece: { id: 'piece1', shape: 'T4', value: 3, rotation: 0, flipped: false },
        previousState: createMockGameState()
      })
    })

    describe('undoMove', () => {
      it('should decrement move index and increment undo count', () => {
        const { undoMove } = useGameFlowStore.getState()

        const result = undoMove()

        expect(result).toBe(true)
        const state = useGameFlowStore.getState()
        expect(state.currentMoveIndex).toBe(0) // Was 1, now 0
        expect(state.gameStats.undoCount).toBe(1)
      })

      it('should return false when no moves to undo', () => {
        const { undoMove } = useGameFlowStore.getState()

        // Undo all moves
        undoMove()
        undoMove()
        
        // Try to undo beyond beginning
        const result = undoMove()

        expect(result).toBe(false)
        const state = useGameFlowStore.getState()
        expect(state.currentMoveIndex).toBe(-1)
      })
    })

    describe('redoMove', () => {
      it('should increment move index after undo', () => {
        const { undoMove, redoMove } = useGameFlowStore.getState()

        undoMove() // Go back one move
        const result = redoMove()

        expect(result).toBe(true)
        const state = useGameFlowStore.getState()
        expect(state.currentMoveIndex).toBe(1) // Back to latest
      })

      it('should return false when no moves to redo', () => {
        const { redoMove } = useGameFlowStore.getState()

        // Try to redo when already at latest
        const result = redoMove()

        expect(result).toBe(false)
        const state = useGameFlowStore.getState()
        expect(state.currentMoveIndex).toBe(1) // Still at latest
      })
    })

    describe('canUndo/canRedo', () => {
      it('should return correct undo/redo availability', () => {
        const { canUndo, canRedo, undoMove } = useGameFlowStore.getState()

        expect(canUndo()).toBe(true) // Has moves to undo
        expect(canRedo()).toBe(false) // At latest position

        undoMove()
        expect(canUndo()).toBe(true) // Still has moves
        expect(canRedo()).toBe(true) // Can now redo

        undoMove()
        expect(canUndo()).toBe(false) // No more moves
        expect(canRedo()).toBe(true) // Can still redo
      })
    })
  })

  describe('pause/resume functionality', () => {
    it('should pause and accumulate time', () => {
      const { startGame, pauseGame, resumeGame } = useGameFlowStore.getState()
      
      startGame(createMockLevel())
      
      // Advance time by 1000ms
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 1000)
      
      pauseGame()
      
      const pausedState = useGameFlowStore.getState()
      expect(pausedState.isPaused).toBe(true)
      expect(pausedState.gameStats.timeElapsed).toBe(1000)

      // Advance time further while paused
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 2000)
      
      resumeGame()
      
      const resumedState = useGameFlowStore.getState()
      expect(resumedState.isPaused).toBe(false)
      expect(resumedState.startTime).toBe(mockNow + 2000) // New start time
      expect(resumedState.gameStats.timeElapsed).toBe(1000) // Time didn't advance while paused
    })

    it('should not accumulate time if not started', () => {
      const { pauseGame } = useGameFlowStore.getState()

      pauseGame()

      const state = useGameFlowStore.getState()
      expect(state.isPaused).toBe(true)
      expect(state.gameStats.timeElapsed).toBe(0) // No time accumulated
    })
  })

  describe('updateAnalysis', () => {
    it('should update current analysis', () => {
      const { updateAnalysis } = useGameFlowStore.getState()
      const gameState = createMockGameState()

      updateAnalysis(gameState)

      const state = useGameFlowStore.getState()
      expect(state.currentAnalysis).not.toBeNull()
      expect(state.currentAnalysis?.winState.isWon).toBe(false)
    })

    it('should update puzzle solved count when winning for first time', () => {
      const { startGame, updateAnalysis, getElapsedTime } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // First update - not won
      updateAnalysis(createMockGameState(false))
      expect(useGameFlowStore.getState().gameStats.puzzlesSolved).toBe(0)

      // Second update - won
      updateAnalysis(createMockGameState(true))
      expect(useGameFlowStore.getState().gameStats.puzzlesSolved).toBe(1)

      // Third update - still won (shouldn't increment again)
      updateAnalysis(createMockGameState(true))
      expect(useGameFlowStore.getState().gameStats.puzzlesSolved).toBe(1)
    })

    it('should not update analysis without level', () => {
      const { updateAnalysis } = useGameFlowStore.getState()
      const gameStateWithoutLevel = { ...createMockGameState(), level: null }

      updateAnalysis(gameStateWithoutLevel)

      const state = useGameFlowStore.getState()
      expect(state.currentAnalysis).toBeNull()
    })
  })

  describe('getElapsedTime', () => {
    it('should return 0 when not started', () => {
      const { getElapsedTime } = useGameFlowStore.getState()

      const elapsed = getElapsedTime()

      expect(elapsed).toBe(0)
    })

    it('should calculate elapsed time when running', () => {
      const { startGame, getElapsedTime } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // Advance time by 5 seconds
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 5000)

      const elapsed = getElapsedTime()

      expect(elapsed).toBe(5) // Should return seconds
    })

    it('should include accumulated time when paused', () => {
      const { startGame, pauseGame, getElapsedTime } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // Run for 3 seconds
      vi.spyOn(Date, 'now').mockImplementation(() => mockNow + 3000)
      pauseGame()

      const elapsed = getElapsedTime()

      expect(elapsed).toBe(3) // Should return seconds including accumulated time
    })
  })

  describe('hint tracking', () => {
    it('should track hint usage', () => {
      const { useHint } = useGameFlowStore.getState()

      useHint()

      const state = useGameFlowStore.getState()
      expect(state.gameStats.hintsUsed).toBe(1)
      expect(state.lastHintTime).toBe(mockNow)

      useHint()
      expect(useGameFlowStore.getState().gameStats.hintsUsed).toBe(2)
    })
  })

  describe('resetStats', () => {
    it('should reset all statistics to initial values', () => {
      const { recordMove, useHint, resetStats, startGame } = useGameFlowStore.getState()
      
      startGame(createMockLevel())

      // Make some changes to stats
      recordMove({
        type: 'place',
        piece: { id: 'test', shape: 'T4', value: 3, rotation: 0, flipped: false },
        previousState: createMockGameState()
      })
      useHint()

      // Verify stats changed
      expect(useGameFlowStore.getState().gameStats.totalMoves).toBe(1)
      expect(useGameFlowStore.getState().gameStats.hintsUsed).toBe(1)

      resetStats()

      const state = useGameFlowStore.getState()
      expect(state.gameStats.totalMoves).toBe(0)
      expect(state.gameStats.hintsUsed).toBe(0)
      expect(state.gameStats.undoCount).toBe(0)
      expect(state.gameStats.puzzlesSolved).toBe(0)
    })
  })
})