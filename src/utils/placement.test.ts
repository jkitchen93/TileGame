import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOccupiedCells,
  isValidPlacement,
  canPlacePiece,
  getBoardCoverage,
  calculateSum,
  countMonominoes,
  isWinCondition,
  findBestPlacement,
  getPlacedPieceInfo,
  removePieceFromBoard,
  placePieceOnBoard
} from './placement'
import { GamePiece, BoardCell } from '../types'

describe('placement', () => {
  let emptyBoard: BoardCell[][]
  let testPieces: GamePiece[]

  beforeEach(() => {
    emptyBoard = Array(5).fill(null).map((_, row) =>
      Array(5).fill(null).map((_, col) => ({ row, col }))
    )

    testPieces = [
      { id: 'p1', shape: 'I1', value: 2, rotation: 0, flipped: false },
      { id: 'p2', shape: 'I2', value: 3, rotation: 0, flipped: false },
      { id: 'p3', shape: 'I3', value: 4, rotation: 0, flipped: false },
      { id: 'p4', shape: 'O4', value: 5, rotation: 0, flipped: false },
      { id: 'p5', shape: 'T4', value: 6, rotation: 0, flipped: false }
    ]
  })

  describe('getOccupiedCells', () => {
    it('should return correct cells for monomino at origin', () => {
      const cells = getOccupiedCells(testPieces[0], 0, 0) // I1 at (0,0)
      expect(cells).toEqual([{ x: 0, y: 0 }])
    })

    it('should return correct cells for monomino at different position', () => {
      const cells = getOccupiedCells(testPieces[0], 2, 3) // I1 at (2,3)
      expect(cells).toEqual([{ x: 3, y: 2 }])
    })

    it('should return correct cells for domino', () => {
      const cells = getOccupiedCells(testPieces[1], 0, 0) // I2 at (0,0)
      expect(cells).toHaveLength(2)
      expect(cells).toContainEqual({ x: 0, y: 0 })
      expect(cells).toContainEqual({ x: 1, y: 0 })
    })

    it('should handle rotation correctly', () => {
      const rotatedPiece = { ...testPieces[1], rotation: 90 } // I2 rotated 90°
      const cells = getOccupiedCells(rotatedPiece, 0, 0)
      expect(cells).toHaveLength(2)
      expect(cells).toContainEqual({ x: 0, y: 0 })
      expect(cells).toContainEqual({ x: 0, y: 1 })
    })

    it('should handle flip correctly', () => {
      const flippedPiece = { ...testPieces[1], flipped: true } // I2 flipped
      const cells = getOccupiedCells(flippedPiece, 0, 0)
      expect(cells).toHaveLength(2)
      expect(cells).toContainEqual({ x: 0, y: 0 })
      expect(cells).toContainEqual({ x: 1, y: 0 })
    })
  })

  describe('isValidPlacement', () => {
    it('should allow valid placement at origin', () => {
      const result = isValidPlacement(testPieces[0], 0, 0, emptyBoard, [], 0)
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should reject placement outside board bounds', () => {
      const result = isValidPlacement(testPieces[1], 0, 5, emptyBoard, [], 0) // I2 at (0,5) - out of bounds
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Piece extends beyond board boundaries')
    })

    it('should reject placement outside board bounds on y-axis', () => {
      const result = isValidPlacement(testPieces[2], 5, 0, emptyBoard, [], 0) // I3 at (5,0) - out of bounds
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Piece extends beyond board boundaries')
    })

    it('should reject placement on occupied cell', () => {
      const occupiedBoard = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      occupiedBoard[1][1].pieceId = 'existing'
      
      const result = isValidPlacement(testPieces[0], 1, 1, occupiedBoard, [], 0)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Cell already occupied by another piece')
    })

    it('should enforce monomino constraint', () => {
      const result = isValidPlacement(testPieces[0], 0, 0, emptyBoard, [], 1) // Already have 1 monomino
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Maximum 1 monomino allowed per level')
    })

    it('should allow monomino when count is 0', () => {
      const result = isValidPlacement(testPieces[0], 0, 0, emptyBoard, [], 0)
      expect(result.valid).toBe(true)
    })

    it('should return occupied cells for valid placement', () => {
      const result = isValidPlacement(testPieces[1], 0, 0, emptyBoard, [], 0) // I2 at origin
      expect(result.valid).toBe(true)
      expect(result.occupiedCells).toHaveLength(2)
    })

    it('should return occupied cells for invalid placement', () => {
      const result = isValidPlacement(testPieces[1], 0, 5, emptyBoard, [], 0) // I2 out of bounds
      expect(result.valid).toBe(false)
      expect(result.occupiedCells).toHaveLength(2)
    })
  })

  describe('canPlacePiece', () => {
    it('should return true for valid placement', () => {
      const result = canPlacePiece(testPieces[0], 0, 0, emptyBoard, [], 0)
      expect(result).toBe(true)
    })

    it('should return false for invalid placement', () => {
      const result = canPlacePiece(testPieces[1], 0, 5, emptyBoard, [], 0)
      expect(result).toBe(false)
    })
  })

  describe('getBoardCoverage', () => {
    it('should return 0 for empty board', () => {
      const coverage = getBoardCoverage(emptyBoard)
      expect(coverage).toBe(0)
    })

    it('should count occupied cells correctly', () => {
      const board = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      board[0][0].pieceId = 'p1'
      board[0][1].pieceId = 'p1'
      board[1][0].pieceId = 'p2'
      
      const coverage = getBoardCoverage(board)
      expect(coverage).toBe(3)
    })

    it('should handle full board', () => {
      const board = emptyBoard.map(row => 
        row.map(cell => ({ ...cell, pieceId: 'full' }))
      )
      const coverage = getBoardCoverage(board)
      expect(coverage).toBe(25)
    })
  })

  describe('calculateSum', () => {
    it('should return 0 for empty array', () => {
      const sum = calculateSum([])
      expect(sum).toBe(0)
    })

    it('should sum piece values correctly', () => {
      const sum = calculateSum(testPieces.slice(0, 3)) // Values: 2, 3, 4
      expect(sum).toBe(9)
    })

    it('should handle single piece', () => {
      const sum = calculateSum([testPieces[0]]) // Value: 2
      expect(sum).toBe(2)
    })
  })

  describe('countMonominoes', () => {
    it('should return 0 when no monominoes', () => {
      const count = countMonominoes(testPieces.slice(1)) // Skip I1
      expect(count).toBe(0)
    })

    it('should count monominoes correctly', () => {
      const pieces = [testPieces[0], testPieces[1], testPieces[0]] // Two I1s
      const count = countMonominoes(pieces)
      expect(count).toBe(2)
    })

    it('should handle empty array', () => {
      const count = countMonominoes([])
      expect(count).toBe(0)
    })
  })

  describe('isWinCondition', () => {
    it('should return false for empty board', () => {
      const isWon = isWinCondition(emptyBoard, [], 0)
      expect(isWon).toBe(false)
    })

    it('should return false when coverage is full but sum is wrong', () => {
      const fullBoard = emptyBoard.map(row => 
        row.map(cell => ({ ...cell, pieceId: 'p1' }))
      )
      const pieces = [{ id: 'p1', shape: 'I1', value: 10, rotation: 0, flipped: false } as GamePiece]
      
      const isWon = isWinCondition(fullBoard, pieces, 20) // Sum is 10, target is 20
      expect(isWon).toBe(false)
    })

    it('should return false when sum is correct but coverage is incomplete', () => {
      const partialBoard = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      partialBoard[0][0].pieceId = 'p1'
      
      const pieces = [{ id: 'p1', shape: 'I1', value: 10, rotation: 0, flipped: false } as GamePiece]
      
      const isWon = isWinCondition(partialBoard, pieces, 10) // Sum matches but coverage is 1/25
      expect(isWon).toBe(false)
    })

    it('should return true when both coverage and sum are correct', () => {
      const fullBoard = emptyBoard.map(row => 
        row.map(cell => ({ ...cell, pieceId: 'p1' }))
      )
      const pieces = [{ id: 'p1', shape: 'I1', value: 15, rotation: 0, flipped: false } as GamePiece]
      
      const isWon = isWinCondition(fullBoard, pieces, 15)
      expect(isWon).toBe(true)
    })
  })

  describe('findBestPlacement', () => {
    it('should find all valid placements for monomino', () => {
      const placements = findBestPlacement(testPieces[0], emptyBoard, [], 0)
      expect(placements).toHaveLength(25) // Can be placed anywhere on 5x5 board
    })

    it('should find valid placements for domino', () => {
      const placements = findBestPlacement(testPieces[1], emptyBoard, [], 0) // I2 horizontal
      expect(placements.length).toBeGreaterThan(0)
      expect(placements.length).toBeLessThanOrEqual(25)
      
      placements.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0)
        expect(pos.x).toBeLessThan(5)
        expect(pos.y).toBeGreaterThanOrEqual(0)
        expect(pos.y).toBeLessThan(5)
      })
    })

    it('should find no placements when board is full', () => {
      const fullBoard = emptyBoard.map(row => 
        row.map(cell => ({ ...cell, pieceId: 'existing' }))
      )
      const placements = findBestPlacement(testPieces[0], fullBoard, [], 0)
      expect(placements).toHaveLength(0)
    })

    it('should respect monomino constraint', () => {
      const placements = findBestPlacement(testPieces[0], emptyBoard, [], 1) // Already have 1 monomino
      expect(placements).toHaveLength(0)
    })
  })

  describe('getPlacedPieceInfo', () => {
    it('should return correct piece info', () => {
      const position = { x: 2, y: 3 }
      const info = getPlacedPieceInfo(testPieces[0], position)
      
      expect(info.piece).toBe(testPieces[0])
      expect(info.position).toBe(position)
      expect(info.occupiedCells).toEqual([{ x: 2, y: 3 }])
    })

    it('should calculate occupied cells correctly for domino', () => {
      const position = { x: 1, y: 1 }
      const info = getPlacedPieceInfo(testPieces[1], position) // I2
      
      expect(info.occupiedCells).toHaveLength(2)
      expect(info.occupiedCells).toContainEqual({ x: 1, y: 1 })
      expect(info.occupiedCells).toContainEqual({ x: 2, y: 1 })
    })
  })

  describe('removePieceFromBoard', () => {
    it('should remove piece from board', () => {
      const board = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      board[0][0].pieceId = 'p1'
      board[0][1].pieceId = 'p1'
      board[1][0].pieceId = 'p2'
      
      const newBoard = removePieceFromBoard(board, 'p1')
      
      expect(newBoard[0][0].pieceId).toBeUndefined()
      expect(newBoard[0][1].pieceId).toBeUndefined()
      expect(newBoard[1][0].pieceId).toBe('p2') // Different piece should remain
    })

    it('should not modify original board', () => {
      const board = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      board[0][0].pieceId = 'p1'
      
      const newBoard = removePieceFromBoard(board, 'p1')
      
      expect(board[0][0].pieceId).toBe('p1') // Original unchanged
      expect(newBoard[0][0].pieceId).toBeUndefined() // New board modified
    })

    it('should handle non-existent piece ID', () => {
      const board = emptyBoard.map(row => row.map(cell => ({ ...cell })))
      board[0][0].pieceId = 'p1'
      
      const newBoard = removePieceFromBoard(board, 'nonexistent')
      
      expect(newBoard[0][0].pieceId).toBe('p1') // Should remain unchanged
    })
  })

  describe('placePieceOnBoard', () => {
    it('should place monomino on board', () => {
      const newBoard = placePieceOnBoard(emptyBoard, testPieces[0], 2, 3)
      expect(newBoard[2][3].pieceId).toBe('p1')
    })

    it('should place domino on board', () => {
      const newBoard = placePieceOnBoard(emptyBoard, testPieces[1], 1, 1)
      expect(newBoard[1][1].pieceId).toBe('p2') // I2 at (1,1)
      expect(newBoard[1][2].pieceId).toBe('p2') // I2 extends to (1,2)
    })

    it('should not modify original board', () => {
      const newBoard = placePieceOnBoard(emptyBoard, testPieces[0], 0, 0)
      expect(emptyBoard[0][0].pieceId).toBeUndefined() // Original unchanged
      expect(newBoard[0][0].pieceId).toBe('p1') // New board modified
    })

    it('should handle placement outside bounds gracefully', () => {
      const newBoard = placePieceOnBoard(emptyBoard, testPieces[1], 0, 5) // I2 at (0,5) - partially out of bounds
      // Should only place cells that are within bounds
      expect(newBoard[0][4].pieceId).toBeUndefined() // No modification to existing cells
    })

    it('should handle rotated piece correctly', () => {
      const rotatedPiece = { ...testPieces[1], rotation: 90 } // I2 rotated to vertical
      const newBoard = placePieceOnBoard(emptyBoard, rotatedPiece, 1, 1)
      
      expect(newBoard[1][1].pieceId).toBe('p2')
      expect(newBoard[2][1].pieceId).toBe('p2')
    })
  })
})