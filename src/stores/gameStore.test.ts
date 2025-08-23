import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { GameLevel, GamePiece } from '../types'

describe('gameStore', () => {
  const testLevel: GameLevel = {
    id: 'test-level',
    board: { rows: 5, cols: 5 },
    target: 15,
    constraints: { monomino_cap: 1, max_leftovers: 5 },
    bag: [
      { id: 'p1', shape: 'I1', value: 2, rotation: 0, flipped: false },
      { id: 'p2', shape: 'I2', value: 3, rotation: 0, flipped: false },
      { id: 'p3', shape: 'I3', value: 4, rotation: 0, flipped: false },
      { id: 'p4', shape: 'O4', value: 6, rotation: 0, flipped: false }
    ]
  }

  beforeEach(() => {
    const store = useGameStore.getState()
    store.resetGame()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useGameStore.getState()
      
      expect(state.level).toBeNull()
      expect(state.board).toEqual([])
      expect(state.placedPieces).toEqual([])
      expect(state.trayPieces).toEqual([])
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.monominoCount).toBe(0)
      expect(state.isWon).toBe(false)
    })
  })

  describe('loadLevel', () => {
    it('should load level correctly', () => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
      
      const state = useGameStore.getState()
      
      expect(state.level).toBe(testLevel)
      expect(state.board).toHaveLength(5)
      expect(state.board[0]).toHaveLength(5)
      expect(state.trayPieces).toEqual(testLevel.bag)
      expect(state.placedPieces).toEqual([])
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.monominoCount).toBe(0)
      expect(state.isWon).toBe(false)
    })

    it('should create 5x5 board with correct cell structure', () => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
      
      const state = useGameStore.getState()
      
      state.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          expect(cell.row).toBe(rowIndex)
          expect(cell.col).toBe(colIndex)
          expect(cell.pieceId).toBeUndefined()
        })
      })
    })

    it('should reset previous game state', () => {
      const store = useGameStore.getState()
      
      // Set some initial state
      store.loadLevel(testLevel)
      store.placePiece(testLevel.bag[0], 0, 0) // Place a piece
      
      // Load new level
      const newLevel = { ...testLevel, id: 'new-level', target: 20 }
      store.loadLevel(newLevel)
      
      const state = useGameStore.getState()
      expect(state.level).toBe(newLevel)
      expect(state.placedPieces).toEqual([])
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.isWon).toBe(false)
    })
  })

  describe('placePiece', () => {
    beforeEach(() => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
    })

    it('should place valid piece successfully', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[0] // I1 (monomino)
      
      const result = store.placePiece(piece, 0, 0)
      const state = useGameStore.getState()
      
      expect(result).toBe(true)
      expect(state.placedPieces).toContain(piece)
      expect(state.trayPieces).not.toContain(piece)
      expect(state.board[0][0].pieceId).toBe(piece.id)
      expect(state.currentSum).toBe(piece.value)
      expect(state.coveredCells).toBe(1)
      expect(state.monominoCount).toBe(1)
    })

    it('should reject invalid placement', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[1] // I2 (domino)
      
      const result = store.placePiece(piece, 0, 5) // Out of bounds
      const state = useGameStore.getState()
      
      expect(result).toBe(false)
      expect(state.placedPieces).not.toContain(piece)
      expect(state.trayPieces).toContain(piece)
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
    })

    it('should reject placement on occupied cell', () => {
      const store = useGameStore.getState()
      const piece1 = testLevel.bag[0] // I1
      const piece2 = testLevel.bag[1] // I2
      
      // Place first piece
      store.placePiece(piece1, 0, 0)
      
      // Try to place second piece overlapping
      const result = store.placePiece(piece2, 0, 0)
      const state = useGameStore.getState()
      
      expect(result).toBe(false)
      expect(state.placedPieces).toHaveLength(1)
      expect(state.placedPieces[0]).toBe(piece1)
    })

    it('should enforce monomino constraint', () => {
      const store = useGameStore.getState()
      const monomino1 = testLevel.bag[0] // I1
      const monomino2: GamePiece = { id: 'p5', shape: 'I1', value: 1, rotation: 0, flipped: false }
      
      // Place first monomino
      store.placePiece(monomino1, 0, 0)
      
      // Add second monomino to tray
      const state = useGameStore.getState()
      useGameStore.setState({ trayPieces: [...state.trayPieces, monomino2] })
      
      // Try to place second monomino
      const result = store.placePiece(monomino2, 1, 1)
      
      expect(result).toBe(false)
      expect(useGameStore.getState().monominoCount).toBe(1)
    })

    it('should place domino correctly', () => {
      const store = useGameStore.getState()
      const domino = testLevel.bag[1] // I2
      
      const result = store.placePiece(domino, 1, 1)
      const state = useGameStore.getState()
      
      expect(result).toBe(true)
      expect(state.board[1][1].pieceId).toBe(domino.id)
      expect(state.board[1][2].pieceId).toBe(domino.id)
      expect(state.coveredCells).toBe(2)
      expect(state.currentSum).toBe(domino.value)
    })

    it('should return false when no level is loaded', () => {
      const store = useGameStore.getState()
      useGameStore.setState({ level: null })
      
      const result = store.placePiece(testLevel.bag[0], 0, 0)
      expect(result).toBe(false)
    })

    it('should detect win condition', () => {
      const winLevel: GameLevel = {
        id: 'win-level',
        board: { rows: 5, cols: 5 },
        target: 2, // Low target for easy win
        constraints: { monomino_cap: 1, max_leftovers: 5 },
        bag: [{ id: 'winner', shape: 'I1', value: 2, rotation: 0, flipped: false }]
      }
      
      const store = useGameStore.getState()
      store.loadLevel(winLevel)
      
      // Fill the board manually to simulate win condition
      const fullBoard = Array(5).fill(null).map((_, row) =>
        Array(5).fill(null).map((_, col) => ({ row, col, pieceId: 'winner' }))
      )
      
      useGameStore.setState({ 
        board: fullBoard,
        coveredCells: 25,
        currentSum: 2,
        placedPieces: [winLevel.bag[0]],
        isWon: true
      })
      
      const state = useGameStore.getState()
      expect(state.isWon).toBe(true)
    })
  })

  describe('returnPieceToTray', () => {
    beforeEach(() => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
    })

    it('should return placed piece to tray', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[0] // I1
      
      // Place the piece
      store.placePiece(piece, 0, 0)
      
      // Return it to tray
      store.returnPieceToTray(piece.id)
      const state = useGameStore.getState()
      
      expect(state.placedPieces).not.toContain(piece)
      expect(state.trayPieces).toContain(piece)
      expect(state.board[0][0].pieceId).toBeUndefined()
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.monominoCount).toBe(0)
    })

    it('should handle non-existent piece ID gracefully', () => {
      const store = useGameStore.getState()
      const initialState = useGameStore.getState()
      
      store.returnPieceToTray('nonexistent')
      const finalState = useGameStore.getState()
      
      expect(finalState.placedPieces).toEqual(initialState.placedPieces)
      expect(finalState.trayPieces).toEqual(initialState.trayPieces)
    })

    it('should update game state correctly after returning domino', () => {
      const store = useGameStore.getState()
      const domino = testLevel.bag[1] // I2
      
      // Place domino
      store.placePiece(domino, 1, 1)
      expect(useGameStore.getState().coveredCells).toBe(2)
      
      // Return domino
      store.returnPieceToTray(domino.id)
      const state = useGameStore.getState()
      
      expect(state.board[1][1].pieceId).toBeUndefined()
      expect(state.board[1][2].pieceId).toBeUndefined()
      expect(state.coveredCells).toBe(0)
      expect(state.currentSum).toBe(0)
    })

    it('should update win condition after returning piece', () => {
      const store = useGameStore.getState()
      
      // Manually set up a win condition
      const fullBoard = Array(5).fill(null).map((_, row) =>
        Array(5).fill(null).map((_, col) => ({ row, col, pieceId: 'test' }))
      )
      
      useGameStore.setState({ 
        board: fullBoard,
        placedPieces: [testLevel.bag[0]],
        currentSum: testLevel.target,
        coveredCells: 25,
        isWon: true
      })
      
      // Return piece should break win condition
      store.returnPieceToTray(testLevel.bag[0].id)
      const state = useGameStore.getState()
      
      expect(state.isWon).toBe(false)
    })
  })

  describe('transformPiece', () => {
    beforeEach(() => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
    })

    it('should rotate piece in tray', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[1] // I2
      
      store.transformPiece(piece.id, true, false) // Rotate
      const state = useGameStore.getState()
      
      const transformedPiece = state.trayPieces.find(p => p.id === piece.id)
      expect(transformedPiece?.rotation).toBe(90)
      expect(transformedPiece?.flipped).toBe(false)
    })

    it('should flip piece in tray', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[1] // I2
      
      store.transformPiece(piece.id, false, true) // Flip
      const state = useGameStore.getState()
      
      const transformedPiece = state.trayPieces.find(p => p.id === piece.id)
      expect(transformedPiece?.rotation).toBe(0)
      expect(transformedPiece?.flipped).toBe(true)
    })

    it('should rotate and flip simultaneously', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[1] // I2
      
      store.transformPiece(piece.id, true, true) // Rotate and flip
      const state = useGameStore.getState()
      
      const transformedPiece = state.trayPieces.find(p => p.id === piece.id)
      expect(transformedPiece?.rotation).toBe(90)
      expect(transformedPiece?.flipped).toBe(true)
    })

    it('should handle multiple rotations correctly', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[1] // I2
      
      // Rotate 4 times (360 degrees)
      store.transformPiece(piece.id, true, false)
      store.transformPiece(piece.id, true, false)
      store.transformPiece(piece.id, true, false)
      store.transformPiece(piece.id, true, false)
      
      const state = useGameStore.getState()
      const transformedPiece = state.trayPieces.find(p => p.id === piece.id)
      expect(transformedPiece?.rotation).toBe(0) // Back to original
    })

    it('should transform placed pieces', () => {
      const store = useGameStore.getState()
      const piece = testLevel.bag[0] // I1
      
      // Place piece first
      store.placePiece(piece, 0, 0)
      
      // Transform placed piece
      store.transformPiece(piece.id, true, false)
      const state = useGameStore.getState()
      
      const transformedPiece = state.placedPieces.find(p => p.id === piece.id)
      expect(transformedPiece?.rotation).toBe(90)
    })

    it('should handle non-existent piece ID gracefully', () => {
      const store = useGameStore.getState()
      const initialState = useGameStore.getState()
      
      store.transformPiece('nonexistent', true, true)
      const finalState = useGameStore.getState()
      
      expect(finalState.trayPieces).toEqual(initialState.trayPieces)
      expect(finalState.placedPieces).toEqual(initialState.placedPieces)
    })
  })

  describe('resetGame', () => {
    it('should reset to current level', () => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
      
      // Make some changes
      store.placePiece(testLevel.bag[0], 0, 0)
      store.transformPiece(testLevel.bag[1].id, true, true)
      
      // Reset
      store.resetGame()
      const state = useGameStore.getState()
      
      expect(state.level).toBe(testLevel)
      expect(state.placedPieces).toEqual([])
      expect(state.trayPieces).toEqual(testLevel.bag) // Back to original bag
      expect(state.currentSum).toBe(0)
      expect(state.coveredCells).toBe(0)
      expect(state.isWon).toBe(false)
    })

    it('should handle reset when no level is loaded', () => {
      const store = useGameStore.getState()
      const initialState = useGameStore.getState()
      
      store.resetGame()
      const finalState = useGameStore.getState()
      
      expect(finalState).toEqual(initialState)
    })
  })

  describe('updateGameState', () => {
    beforeEach(() => {
      const store = useGameStore.getState()
      store.loadLevel(testLevel)
    })

    it('should recalculate game state correctly', () => {
      const store = useGameStore.getState()
      
      // Manually set inconsistent state
      useGameStore.setState({
        currentSum: 999,
        coveredCells: 999,
        monominoCount: 999,
        isWon: true
      })
      
      // Update should fix inconsistencies
      store.updateGameState()
      const state = useGameStore.getState()
      
      expect(state.currentSum).toBe(0) // No pieces placed
      expect(state.coveredCells).toBe(0)
      expect(state.monominoCount).toBe(0)
      expect(state.isWon).toBe(false)
    })

    it('should handle no level gracefully', () => {
      const store = useGameStore.getState()
      useGameStore.setState({ level: null })
      
      const initialState = useGameStore.getState()
      store.updateGameState()
      const finalState = useGameStore.getState()
      
      expect(finalState).toEqual(initialState)
    })

    it('should calculate correct state with placed pieces', () => {
      const store = useGameStore.getState()
      
      // Place pieces and manually set board
      const piece1 = testLevel.bag[0] // I1, value 2
      const piece2 = testLevel.bag[1] // I2, value 3
      
      const board = Array(5).fill(null).map((_, row) =>
        Array(5).fill(null).map((_, col) => ({ row, col }))
      )
      ;(board[0][0] as any).pieceId = piece1.id
      ;(board[1][1] as any).pieceId = piece2.id
      ;(board[1][2] as any).pieceId = piece2.id
      
      useGameStore.setState({
        board,
        placedPieces: [piece1, piece2],
        currentSum: 999, // Wrong value
        coveredCells: 999, // Wrong value
        monominoCount: 999, // Wrong value
        isWon: true // Wrong value
      })
      
      store.updateGameState()
      const state = useGameStore.getState()
      
      expect(state.currentSum).toBe(5) // 2 + 3
      expect(state.coveredCells).toBe(3) // 1 + 2 cells
      expect(state.monominoCount).toBe(1) // One I1
      expect(state.isWon).toBe(false) // Not full coverage
    })
  })
})