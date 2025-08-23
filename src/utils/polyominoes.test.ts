import { describe, it, expect } from 'vitest'
import { 
  POLYOMINO_SHAPES, 
  getPolyominoShape, 
  getPolyominoSize, 
  getPolyominoBounds,
  Coordinates 
} from './polyominoes'
import { PolyominoShape } from '../types'

describe('polyominoes', () => {
  describe('POLYOMINO_SHAPES', () => {
    it('should have all required shapes defined', () => {
      const expectedShapes: PolyominoShape[] = ['I4', 'O4', 'T4', 'L4', 'S4', 'I3', 'L3', 'I2', 'I1']
      
      expectedShapes.forEach(shape => {
        expect(POLYOMINO_SHAPES[shape]).toBeDefined()
        expect(Array.isArray(POLYOMINO_SHAPES[shape])).toBe(true)
        expect(POLYOMINO_SHAPES[shape].length).toBeGreaterThan(0)
      })
    })

    it('should have correct cell counts for each shape', () => {
      expect(POLYOMINO_SHAPES.I4).toHaveLength(4)
      expect(POLYOMINO_SHAPES.O4).toHaveLength(4)
      expect(POLYOMINO_SHAPES.T4).toHaveLength(4)
      expect(POLYOMINO_SHAPES.L4).toHaveLength(4)
      expect(POLYOMINO_SHAPES.S4).toHaveLength(4)
      expect(POLYOMINO_SHAPES.I3).toHaveLength(3)
      expect(POLYOMINO_SHAPES.L3).toHaveLength(3)
      expect(POLYOMINO_SHAPES.I2).toHaveLength(2)
      expect(POLYOMINO_SHAPES.I1).toHaveLength(1)
    })

    it('should have valid coordinate objects', () => {
      Object.values(POLYOMINO_SHAPES).forEach(shape => {
        shape.forEach(coord => {
          expect(typeof coord.x).toBe('number')
          expect(typeof coord.y).toBe('number')
          expect(Number.isInteger(coord.x)).toBe(true)
          expect(Number.isInteger(coord.y)).toBe(true)
        })
      })
    })
  })

  describe('getPolyominoShape', () => {
    it('should return correct shapes', () => {
      expect(getPolyominoShape('I1')).toEqual([{ x: 0, y: 0 }])
      expect(getPolyominoShape('I2')).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }])
      expect(getPolyominoShape('I3')).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }])
    })

    it('should return references to the same arrays as POLYOMINO_SHAPES', () => {
      const shapes: PolyominoShape[] = ['I4', 'O4', 'T4', 'L4', 'S4', 'I3', 'L3', 'I2', 'I1']
      
      shapes.forEach(shape => {
        expect(getPolyominoShape(shape)).toBe(POLYOMINO_SHAPES[shape])
      })
    })
  })

  describe('getPolyominoSize', () => {
    it('should return correct sizes', () => {
      expect(getPolyominoSize('I1')).toBe(1)
      expect(getPolyominoSize('I2')).toBe(2)
      expect(getPolyominoSize('I3')).toBe(3)
      expect(getPolyominoSize('L3')).toBe(3)
      expect(getPolyominoSize('I4')).toBe(4)
      expect(getPolyominoSize('O4')).toBe(4)
      expect(getPolyominoSize('T4')).toBe(4)
      expect(getPolyominoSize('L4')).toBe(4)
      expect(getPolyominoSize('S4')).toBe(4)
    })
  })

  describe('getPolyominoBounds', () => {
    it('should calculate correct bounds for I1 (monomino)', () => {
      const bounds = getPolyominoBounds('I1')
      expect(bounds).toEqual({
        width: 1,
        height: 1,
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
      })
    })

    it('should calculate correct bounds for I2 (domino)', () => {
      const bounds = getPolyominoBounds('I2')
      expect(bounds).toEqual({
        width: 2,
        height: 1,
        minX: 0,
        maxX: 1,
        minY: 0,
        maxY: 0
      })
    })

    it('should calculate correct bounds for I4 (tetromino line)', () => {
      const bounds = getPolyominoBounds('I4')
      expect(bounds).toEqual({
        width: 4,
        height: 1,
        minX: 0,
        maxX: 3,
        minY: 0,
        maxY: 0
      })
    })

    it('should calculate correct bounds for O4 (tetromino square)', () => {
      const bounds = getPolyominoBounds('O4')
      expect(bounds).toEqual({
        width: 2,
        height: 2,
        minX: 0,
        maxX: 1,
        minY: 0,
        maxY: 1
      })
    })

    it('should calculate correct bounds for T4 (tetromino T-shape)', () => {
      const bounds = getPolyominoBounds('T4')
      expect(bounds).toEqual({
        width: 3,
        height: 2,
        minX: 0,
        maxX: 2,
        minY: 0,
        maxY: 1
      })
    })

    it('should calculate correct bounds for L4 (tetromino L-shape)', () => {
      const bounds = getPolyominoBounds('L4')
      expect(bounds).toEqual({
        width: 2,
        height: 3,
        minX: 0,
        maxX: 1,
        minY: 0,
        maxY: 2
      })
    })

    it('should calculate correct bounds for all shapes', () => {
      const shapes: PolyominoShape[] = ['I4', 'O4', 'T4', 'L4', 'S4', 'I3', 'L3', 'I2', 'I1']
      
      shapes.forEach(shape => {
        const bounds = getPolyominoBounds(shape)
        
        expect(bounds.width).toBeGreaterThan(0)
        expect(bounds.height).toBeGreaterThan(0)
        expect(bounds.maxX).toBeGreaterThanOrEqual(bounds.minX)
        expect(bounds.maxY).toBeGreaterThanOrEqual(bounds.minY)
        expect(bounds.width).toBe(bounds.maxX - bounds.minX + 1)
        expect(bounds.height).toBe(bounds.maxY - bounds.minY + 1)
      })
    })
  })

  describe('shape definitions validation', () => {
    it('should have connected pieces (no isolated cells)', () => {
      const shapes: PolyominoShape[] = ['I4', 'O4', 'T4', 'L4', 'S4', 'I3', 'L3', 'I2']
      
      shapes.forEach(shape => {
        const coords = getPolyominoShape(shape)
        if (coords.length <= 1) return
        
        const isConnected = (c1: Coordinates, c2: Coordinates) => {
          return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y) === 1
        }
        
        const visited = new Set<string>()
        const toVisit = [coords[0]]
        visited.add(`${coords[0].x},${coords[0].y}`)
        
        while (toVisit.length > 0) {
          const current = toVisit.pop()!
          
          coords.forEach(coord => {
            const key = `${coord.x},${coord.y}`
            if (!visited.has(key) && isConnected(current, coord)) {
              visited.add(key)
              toVisit.push(coord)
            }
          })
        }
        
        expect(visited.size).toBe(coords.length)
      })
    })

    it('should not have duplicate coordinates', () => {
      Object.entries(POLYOMINO_SHAPES).forEach(([_shape, coords]) => {
        const coordStrings = coords.map(c => `${c.x},${c.y}`)
        const uniqueCoords = new Set(coordStrings)
        expect(uniqueCoords.size).toBe(coords.length)
      })
    })
  })
})