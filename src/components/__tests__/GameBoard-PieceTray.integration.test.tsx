import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '../../stores/gameStore'
import GameBoard from '../GameBoard'
import PieceTray from '../PieceTray'
import { GameLevel, GamePiece } from '../../types'

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
)

// Helper to create a mock level for testing
const createTestLevel = (overrides?: Partial<GameLevel>): GameLevel => ({
  id: 'test-level-1',
  board: { rows: 5, cols: 5 },
  target: 30,
  constraints: { 
    monomino_cap: 1, 
    max_leftovers: 5 
  },
  bag: [
    { id: 'p1', shape: 'I1', value: 2, rotation: 0, flipped: false },
    { id: 'p2', shape: 'I2', value: 3, rotation: 0, flipped: false },
    { id: 'p3', shape: 'I3', value: 4, rotation: 0, flipped: false },
    { id: 'p4', shape: 'T4', value: 5, rotation: 0, flipped: false },
    { id: 'p5', shape: 'L4', value: 6, rotation: 0, flipped: false }
  ],
  ...overrides
})

// Helper to setup game store with test data
const setupTestGameStore = (level?: GameLevel) => {
  const testLevel = level || createTestLevel()
  
  // Reset store to initial state
  useGameStore.setState({
    level: null,
    board: [],
    placedPieces: [],
    trayPieces: [],
    currentSum: 0,
    coveredCells: 0,
    monominoCount: 0,
    isWon: false,
    lastMoveValid: true,
    lastMoveMessage: '',
    moveCount: 0,
    pickedUpPiece: null,
    pickedUpPieceSource: null,
    grabPoint: null,
    trayPositions: {}
  })
  
  // Load test level
  useGameStore.getState().loadLevel(testLevel)
  
  return testLevel
}

// Helper to assert board state consistency
const assertBoardStateConsistency = () => {
  const state = useGameStore.getState()
  
  // Check that placed pieces match board state
  const boardPieceIds = new Set<string>()
  state.board.forEach(row => {
    row.forEach(cell => {
      if (cell.pieceId) {
        boardPieceIds.add(cell.pieceId)
      }
    })
  })
  
  const placedPieceIds = new Set(state.placedPieces.map(p => p.id))
  
  // Every placed piece should be on the board
  placedPieceIds.forEach(pieceId => {
    if (!boardPieceIds.has(pieceId)) {
      throw new Error(`Placed piece ${pieceId} not found on board`)
    }
  })
  
  // Every board piece should be in placed pieces
  boardPieceIds.forEach(pieceId => {
    if (!placedPieceIds.has(pieceId)) {
      throw new Error(`Board piece ${pieceId} not found in placed pieces`)
    }
  })
  
  // Check that tray and placed pieces don't overlap
  const trayPieceIds = new Set(state.trayPieces.map(p => p.id))
  const intersection = [...placedPieceIds].filter(id => trayPieceIds.has(id))
  
  if (intersection.length > 0) {
    throw new Error(`Pieces found in both tray and board: ${intersection.join(', ')}`)
  }
  
  return true
}

describe('GameBoard-PieceTray Integration', () => {
  beforeEach(() => {
    setupTestGameStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
    useGameStore.getState().resetGame()
  })

  describe('Critical Regression Scenarios', () => {
    it('should maintain state consistency during piece placement', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const state = useGameStore.getState()
      expect(state.trayPieces).toHaveLength(5)
      expect(state.placedPieces).toHaveLength(0)

      // Get first piece from tray (monomino I1)
      const firstPiece = state.trayPieces[0]
      expect(firstPiece.shape).toBe('I1')

      // Place piece programmatically (simulating successful UI interaction)
      const success = useGameStore.getState().placePiece(firstPiece, 2, 2)
      expect(success).toBe(true)

      // Verify state consistency
      await waitFor(() => {
        assertBoardStateConsistency()
      })

      const finalState = useGameStore.getState()
      expect(finalState.placedPieces).toHaveLength(1)
      expect(finalState.trayPieces).toHaveLength(4)
      expect(finalState.board[2][2].pieceId).toBe(firstPiece.id)
      expect(finalState.currentSum).toBe(firstPiece.value)
      expect(finalState.coveredCells).toBe(1)
      expect(finalState.monominoCount).toBe(1)
    })

    it('should handle piece repositioning without creating duplicates', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const piece = useGameStore.getState().trayPieces[0] // I1 monomino

      // Place piece initially
      let success = useGameStore.getState().placePiece(piece, 1, 1)
      expect(success).toBe(true)

      // Verify initial placement
      let state = useGameStore.getState()
      expect(state.board[1][1].pieceId).toBe(piece.id)
      expect(state.placedPieces[0].position).toEqual({ x: 1, y: 1 })

      // Reposition piece to new location (simulating drag & drop)
      success = useGameStore.getState().placePiece(piece, 3, 3)
      expect(success).toBe(true)

      // Verify repositioning
      state = useGameStore.getState()
      expect(state.placedPieces).toHaveLength(1) // Should still be only 1 piece
      expect(state.board[1][1].pieceId).toBeUndefined() // Old position cleared
      expect(state.board[3][3].pieceId).toBe(piece.id) // New position occupied
      expect(state.placedPieces[0].position).toEqual({ x: 3, y: 3 })

      // Verify no duplicates in any arrays
      const pieceIds = state.placedPieces.map(p => p.id)
      expect(new Set(pieceIds).size).toBe(pieceIds.length)
      
      assertBoardStateConsistency()
    })

    it('should reject invalid placements and maintain state consistency', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const piece = useGameStore.getState().trayPieces.find(p => p.shape === 'I2')!
      
      // Try to place piece out of bounds
      const success = useGameStore.getState().placePiece(piece, 0, 5)
      expect(success).toBe(false)

      // Verify state unchanged
      const state = useGameStore.getState()
      expect(state.placedPieces).toHaveLength(0)
      expect(state.trayPieces).toHaveLength(5)
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.lastMoveValid).toBe(false)
      
      assertBoardStateConsistency()
    })

    it('should enforce monomino constraint correctly', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      // Place first monomino
      const monomino1 = useGameStore.getState().trayPieces.find(p => p.shape === 'I1')!
      let success = useGameStore.getState().placePiece(monomino1, 0, 0)
      expect(success).toBe(true)

      // Create another monomino for testing
      const monomino2: GamePiece = { id: 'extra-monomino', shape: 'I1', value: 1, rotation: 0, flipped: false }
      
      // Add to tray for testing
      const state = useGameStore.getState()
      useGameStore.setState({ 
        trayPieces: [...state.trayPieces, monomino2] 
      })

      success = useGameStore.getState().placePiece(monomino2, 1, 1)
      expect(success).toBe(false)

      // Verify constraint enforcement
      const finalState = useGameStore.getState()
      expect(finalState.monominoCount).toBe(1)
      expect(finalState.placedPieces).toHaveLength(1)
      expect(finalState.lastMoveValid).toBe(false)
      expect(finalState.lastMoveMessage).toContain('monomino')
      
      assertBoardStateConsistency()
    })

    it('should handle pickup and return operations correctly', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const piece = useGameStore.getState().trayPieces[0]

      // Place piece
      let success = useGameStore.getState().placePiece(piece, 2, 2)
      expect(success).toBe(true)

      let state = useGameStore.getState()
      expect(state.placedPieces).toHaveLength(1)

      // Pick up placed piece
      useGameStore.getState().pickUpPlacedPiece(piece.id)

      // Verify pickup state
      state = useGameStore.getState()
      expect(state.pickedUpPiece?.id).toBe(piece.id)
      expect(state.pickedUpPieceSource).toBe('board')
      expect(state.board[2][2].pieceId).toBeUndefined()
      expect(state.placedPieces).toHaveLength(0)

      // Return to tray
      useGameStore.getState().returnPickedUpPieceToTray()

      // Verify return to tray
      state = useGameStore.getState()
      expect(state.pickedUpPiece).toBeNull()
      expect(state.trayPieces.some(p => p.id === piece.id)).toBe(true)
      expect(state.placedPieces).toHaveLength(0)
      
      assertBoardStateConsistency()
    })

    it('should handle rapid piece placement and removal without race conditions', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const piece = useGameStore.getState().trayPieces[0]

      // Rapid place/remove cycles
      for (let i = 0; i < 3; i++) {
        const placed = useGameStore.getState().placePiece(piece, i, 0)
        expect(placed).toBe(true)
        
        let state = useGameStore.getState()
        expect(state.placedPieces).toHaveLength(1)
        
        useGameStore.getState().returnPieceToTray(piece.id)
        
        state = useGameStore.getState()
        expect(state.placedPieces).toHaveLength(0)
        
        assertBoardStateConsistency()
      }

      // Final state should be clean
      const finalState = useGameStore.getState()
      expect(finalState.placedPieces).toHaveLength(0)
      expect(finalState.trayPieces).toHaveLength(5)
      expect(finalState.currentSum).toBe(0)
      expect(finalState.coveredCells).toBe(0)
    })

    it('should maintain grab point consistency during piece transformations', async () => {
      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const piece = useGameStore.getState().trayPieces.find(p => p.shape === 'L4')!
      
      // Pick up piece with grab point
      const grabPoint = { cellX: 1, cellY: 1 }
      useGameStore.getState().pickUpPiece(piece, grabPoint)

      let state = useGameStore.getState()
      expect(state.grabPoint).toEqual(grabPoint)
      expect(state.pickedUpPiece?.id).toBe(piece.id)

      // Transform piece while picked up
      useGameStore.getState().transformPiece(piece.id, true, false) // Rotate 90°

      // Verify grab point was updated
      state = useGameStore.getState()
      expect(state.grabPoint).toBeDefined()
      expect(state.pickedUpPiece?.rotation).toBe(90)
      
      // Place piece and verify it works correctly
      const success = useGameStore.getState().placePiece(piece, 2, 2)
      expect(success).toBe(true)
      
      assertBoardStateConsistency()
    })

    it('should properly handle win condition detection', async () => {
      // Create dummy pieces for the bag to satisfy the game store validation
      const dummyBagPieces = Array.from({ length: 24 }, (_, i) => ({
        id: `dummy-${i}`,
        shape: 'I2' as const,
        value: 1,
        rotation: 0,
        flipped: false
      }))

      // Create a level with all pieces (24 dummies + 1 winner)
      const winLevel = createTestLevel({
        target: 25, // 24 + 1 = 25
        bag: [
          ...dummyBagPieces,
          { id: 'winner', shape: 'I1', value: 1, rotation: 0, flipped: false }
        ]
      })

      setupTestGameStore(winLevel)

      render(
        <TestWrapper>
          <GameBoard />
          <PieceTray />
        </TestWrapper>
      )

      const state = useGameStore.getState()
      const winningPiece = state.trayPieces.find(p => p.id === 'winner')!

      // Manually set up a nearly complete board (24/25 cells) using proper game state
      // Create 24 dummy placed pieces
      const dummyPlacedPieces = Array.from({ length: 24 }, (_, i) => ({
        id: `dummy-${i}`,
        shape: 'I2' as const,
        value: 1,
        rotation: 0,
        flipped: false,
        position: { x: Math.floor(i / 5), y: i % 5 },
        occupiedCells: [{ x: Math.floor(i / 5), y: i % 5 }]
      }))

      // Set up board to match the placed pieces
      const board = Array(5).fill(null).map((_, row) =>
        Array(5).fill(null).map((_, col) => ({
          row,
          col,
          pieceId: (row * 5 + col < 24) ? `dummy-${row * 5 + col}` : undefined,
          pieceValue: (row * 5 + col < 24) ? 1 : undefined,
          pieceShape: (row * 5 + col < 24) ? ('I2' as const) : undefined
        }))
      )

      // Update tray pieces to only have the winner (dummies are already "placed")
      const newTrayPieces = state.trayPieces.filter(p => p.id === 'winner')

      // Manually update state to be consistent
      useGameStore.setState({
        board,
        placedPieces: dummyPlacedPieces,
        trayPieces: newTrayPieces,
        coveredCells: 24,
        currentSum: 24, // 24 dummy pieces with 1 value each
        monominoCount: 0 // No monominos used yet
      })

      // Verify setup is consistent
      const preWinState = useGameStore.getState()
      expect(preWinState.coveredCells).toBe(24)
      assertBoardStateConsistency()

      // Place the winning piece in the remaining spot (4,4)
      const success = useGameStore.getState().placePiece(winningPiece, 4, 4)
      expect(success).toBe(true)

      // Verify win condition
      const finalState = useGameStore.getState()
      expect(finalState.isWon).toBe(true)
      expect(finalState.coveredCells).toBe(25)
      expect(finalState.currentSum).toBe(25) // 24 (from dummies) + 1 (from winner) = 25 = target
      
      assertBoardStateConsistency()
    })
  })
})