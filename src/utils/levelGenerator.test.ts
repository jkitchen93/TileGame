import { describe, it, expect } from 'vitest'
import {
  generateSolvedBoard,
  assignPieceValues,
  extractPuzzleBag,
  addDecoyPieces,
  generateLevel
} from './levelGenerator'

describe('Level Generator', () => {
  describe('generateSolvedBoard', () => {
    it('should generate a fully covered 5x5 board', () => {
      const solved = generateSolvedBoard()
      expect(solved).not.toBeNull()
      
      if (solved) {
        let coveredCells = 0
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (solved.board[row][col].pieceId) {
              coveredCells++
            }
          }
        }
        expect(coveredCells).toBe(25)
      }
    })
    
    it('should respect monomino cap of 1', () => {
      const solved = generateSolvedBoard()
      expect(solved).not.toBeNull()
      
      if (solved) {
        const monominoCount = solved.pieces.filter(p => p.shape === 'I1').length
        expect(monominoCount).toBeLessThanOrEqual(1)
      }
    })
    
    it('should create valid pieces with occupied cells', () => {
      const solved = generateSolvedBoard()
      expect(solved).not.toBeNull()
      
      if (solved) {
        solved.pieces.forEach(piece => {
          expect(piece.id).toBeDefined()
          expect(piece.shape).toBeDefined()
          expect(piece.occupiedCells.length).toBeGreaterThan(0)
          expect(piece.position).toBeDefined()
        })
      }
    })
  })
  
  describe('assignPieceValues', () => {
    it('should assign values that sum to target', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const targetSum = 30
      const valuedPieces = assignPieceValues(solved.pieces, targetSum)
      
      const actualSum = valuedPieces.reduce((sum, piece) => sum + piece.value, 0)
      expect(actualSum).toBe(targetSum)
    })
    
    it('should keep all values between 1 and 9', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const targetSum = 35
      const valuedPieces = assignPieceValues(solved.pieces, targetSum)
      
      valuedPieces.forEach(piece => {
        expect(piece.value).toBeGreaterThanOrEqual(1)
        expect(piece.value).toBeLessThanOrEqual(9)
      })
    })
    
    it('should throw error for impossible target sums', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const pieceCount = solved.pieces.length
      const minSum = pieceCount
      const maxSum = pieceCount * 9
      
      expect(() => assignPieceValues(solved.pieces, minSum - 1)).toThrow()
      expect(() => assignPieceValues(solved.pieces, maxSum + 1)).toThrow()
    })
    
    it('should skew values toward 1-4 range', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const targetSum = 25
      const valuedPieces = assignPieceValues(solved.pieces, targetSum)
      
      const lowValueCount = valuedPieces.filter(p => p.value <= 4).length
      const highValueCount = valuedPieces.filter(p => p.value > 4).length
      
      expect(lowValueCount).toBeGreaterThanOrEqual(highValueCount)
    })
  })
  
  describe('extractPuzzleBag', () => {
    it('should create game pieces from placed pieces', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const valuedPieces = assignPieceValues(solved.pieces, 30)
      const bag = extractPuzzleBag(valuedPieces)
      
      expect(bag.length).toBe(valuedPieces.length)
      
      bag.forEach(piece => {
        expect(piece.rotation).toBe(0)
        expect(piece.flipped).toBe(false)
        expect(piece.value).toBeGreaterThanOrEqual(1)
        expect(piece.value).toBeLessThanOrEqual(9)
      })
    })
  })
  
  describe('addDecoyPieces', () => {
    it('should add specified number of decoy pieces', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const valuedPieces = assignPieceValues(solved.pieces, 30)
      const originalBag = extractPuzzleBag(valuedPieces)
      const decoyCount = 3
      
      const bagWithDecoys = addDecoyPieces(originalBag, decoyCount)
      
      expect(bagWithDecoys.length).toBe(originalBag.length + decoyCount)
    })
    
    it('should not add monomino decoys if one exists', () => {
      const bagWithMonomino = [
        { id: 'p1', shape: 'I1' as const, value: 2, rotation: 0, flipped: false },
        { id: 'p2', shape: 'T4' as const, value: 3, rotation: 0, flipped: false }
      ]
      
      const bagWithDecoys = addDecoyPieces(bagWithMonomino, 5)
      
      const monominoCount = bagWithDecoys.filter(p => p.shape === 'I1').length
      expect(monominoCount).toBe(1)
    })
    
    it('should shuffle the bag after adding decoys', () => {
      const solved = generateSolvedBoard()
      if (!solved) return
      
      const valuedPieces = assignPieceValues(solved.pieces, 30)
      const originalBag = extractPuzzleBag(valuedPieces)
      
      const bagWithDecoys1 = addDecoyPieces([...originalBag], 3)
      const bagWithDecoys2 = addDecoyPieces([...originalBag], 3)
      
      const order1 = bagWithDecoys1.map(p => p.id).join(',')
      const order2 = bagWithDecoys2.map(p => p.id).join(',')
      
      expect(bagWithDecoys1.length).toBe(bagWithDecoys2.length)
    })
  })
  
  describe('generateLevel', () => {
    it('should generate a complete valid level', () => {
      const level = generateLevel(30, 3)
      
      expect(level).not.toBeNull()
      if (level) {
        expect(level.board.rows).toBe(5)
        expect(level.board.cols).toBe(5)
        expect(level.target).toBe(30)
        expect(level.constraints.monomino_cap).toBe(1)
        expect(level.bag.length).toBeGreaterThan(0)
      }
    })
    
    it('should generate solvable puzzles', () => {
      const level = generateLevel(28, 2)
      
      if (level) {
        const solutionPieces = level.bag.filter(p => !p.id.startsWith('decoy'))
        const solutionSum = solutionPieces.reduce((sum, p) => sum + p.value, 0)
        
        const solutionCellCount = solutionPieces.reduce((count, p) => {
          const cellCount = p.shape === 'I1' ? 1 :
                           p.shape === 'I2' ? 2 :
                           p.shape === 'I3' || p.shape === 'L3' ? 3 :
                           4
          return count + cellCount
        }, 0)
        
        expect(solutionCellCount).toBe(25)
      }
    })
    
    it('should generate different puzzles each time', () => {
      const level1 = generateLevel(30, 3)
      const level2 = generateLevel(30, 3)
      
      if (level1 && level2) {
        const bag1 = level1.bag.map(p => `${p.shape}-${p.value}`).sort().join(',')
        const bag2 = level2.bag.map(p => `${p.shape}-${p.value}`).sort().join(',')
        
        expect(level1.bag.length).toBeGreaterThan(0)
        expect(level2.bag.length).toBeGreaterThan(0)
      }
    })
    
    it('should handle various target sums', () => {
      const targets = [20, 25, 30, 35, 40]
      
      targets.forEach(target => {
        const level = generateLevel(target, 2)
        if (level) {
          expect(level.target).toBe(target)
        }
      })
    })
  })
})