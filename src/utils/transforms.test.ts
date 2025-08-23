import { describe, it, expect } from 'vitest'
import {
  rotatePiece90,
  flipHorizontal,
  flipVertical,
  normalizeCoordinates,
  getTransformedShape,
  applyTransform,
  getAllTransformations,
  Coordinates
} from './transforms'

describe('transforms', () => {
  describe('rotatePiece90', () => {
    it('should rotate a single point correctly', () => {
      const coords: Coordinates[] = [{ x: 1, y: 0 }]
      const rotated = rotatePiece90(coords)
      expect(rotated).toHaveLength(1)
      expect(rotated[0].x).toBe(0)
      expect(rotated[0].y).toBe(1)
    })

    it('should rotate multiple points correctly', () => {
      const coords: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
      const rotated = rotatePiece90(coords)
      expect(rotated).toHaveLength(3)
      expect(rotated).toContainEqual({ x: 0, y: 0 })
      expect(rotated).toContainEqual({ x: 0, y: 1 })
      expect(rotated).toContainEqual({ x: -1, y: 0 })
    })

    it('should rotate a square correctly', () => {
      const square: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ]
      const rotated = rotatePiece90(square)
      expect(rotated).toHaveLength(4)
      expect(rotated).toContainEqual({ x: 0, y: 0 })
      expect(rotated).toContainEqual({ x: 0, y: 1 })
      expect(rotated).toContainEqual({ x: -1, y: 0 })
      expect(rotated).toContainEqual({ x: -1, y: 1 })
    })
  })

  describe('flipHorizontal', () => {
    it('should flip coordinates horizontally', () => {
      const coords: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 1 }
      ]
      const flipped = flipHorizontal(coords)
      expect(flipped).toHaveLength(3)
      expect(flipped).toContainEqual({ x: 0, y: 0 })
      expect(flipped).toContainEqual({ x: -1, y: 0 })
      expect(flipped).toContainEqual({ x: -2, y: 1 })
    })

    it('should not affect y coordinates', () => {
      const coords: Coordinates[] = [{ x: 5, y: 3 }]
      const flipped = flipHorizontal(coords)
      expect(flipped[0].y).toBe(3)
      expect(flipped[0].x).toBe(-5)
    })
  })

  describe('flipVertical', () => {
    it('should flip coordinates vertically', () => {
      const coords: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ]
      const flipped = flipVertical(coords)
      expect(flipped).toHaveLength(3)
      expect(flipped).toContainEqual({ x: 0, y: 0 })
      expect(flipped).toContainEqual({ x: 1, y: -1 })
      expect(flipped).toContainEqual({ x: 2, y: -2 })
    })

    it('should not affect x coordinates', () => {
      const coords: Coordinates[] = [{ x: 3, y: 5 }]
      const flipped = flipVertical(coords)
      expect(flipped[0].x).toBe(3)
      expect(flipped[0].y).toBe(-5)
    })
  })

  describe('normalizeCoordinates', () => {
    it('should handle empty array', () => {
      expect(normalizeCoordinates([])).toEqual([])
    })

    it('should normalize to origin when already at origin', () => {
      const coords: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ]
      const normalized = normalizeCoordinates(coords)
      expect(normalized).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ])
    })

    it('should move coordinates to start at origin', () => {
      const coords: Coordinates[] = [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 3, y: 4 }
      ]
      const normalized = normalizeCoordinates(coords)
      expect(normalized).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ])
    })

    it('should handle negative coordinates', () => {
      const coords: Coordinates[] = [
        { x: -2, y: -1 },
        { x: -1, y: -1 },
        { x: 0, y: 0 }
      ]
      const normalized = normalizeCoordinates(coords)
      expect(normalized).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 1 }
      ])
    })
  })

  describe('getTransformedShape', () => {
    const testShape: Coordinates[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ]

    it('should return normalized shape with no transformation', () => {
      const result = getTransformedShape(testShape, 0, false)
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ])
    })

    it('should handle 90 degree rotation', () => {
      const result = getTransformedShape(testShape, 90, false)
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 }
      ])
    })

    it('should handle 180 degree rotation', () => {
      const result = getTransformedShape(testShape, 180, false)
      expect(result).toHaveLength(3)
      // After 180° rotation and normalization, it should still be a horizontal line
      expect(result).toContainEqual({ x: 0, y: 0 })
      expect(result).toContainEqual({ x: 1, y: 0 })
      expect(result).toContainEqual({ x: 2, y: 0 })
    })

    it('should handle 270 degree rotation', () => {
      const result = getTransformedShape(testShape, 270, false)
      expect(result).toHaveLength(3)
      // After 270° rotation and normalization, it should be a vertical line
      expect(result).toContainEqual({ x: 0, y: 0 })
      expect(result).toContainEqual({ x: 0, y: 1 })
      expect(result).toContainEqual({ x: 0, y: 2 })
    })

    it('should handle horizontal flip', () => {
      const result = getTransformedShape(testShape, 0, true)
      expect(result).toHaveLength(3)
      // After horizontal flip and normalization, it should still be a horizontal line
      expect(result).toContainEqual({ x: 0, y: 0 })
      expect(result).toContainEqual({ x: 1, y: 0 })
      expect(result).toContainEqual({ x: 2, y: 0 })
    })

    it('should handle flip and rotation combination', () => {
      const lShape: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ]
      const result = getTransformedShape(lShape, 90, true)
      expect(result.length).toBe(3)
      expect(result).toContainEqual({ x: 0, y: 0 })
    })

    it('should handle negative rotations', () => {
      const result = getTransformedShape(testShape, -90, false)
      expect(result).toHaveLength(3)
      // After -90° rotation and normalization, it should be a vertical line
      expect(result).toContainEqual({ x: 0, y: 0 })
      expect(result).toContainEqual({ x: 0, y: 1 })
      expect(result).toContainEqual({ x: 0, y: 2 })
    })

    it('should handle rotations over 360 degrees', () => {
      const result = getTransformedShape(testShape, 450, false) // 450 = 90 degrees
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 }
      ])
    })
  })

  describe('applyTransform', () => {
    it('should offset coordinates by given amounts', () => {
      const coords: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ]
      const result = applyTransform(coords, 5, 3)
      expect(result).toEqual([
        { x: 5, y: 3 },
        { x: 6, y: 4 }
      ])
    })

    it('should handle negative offsets', () => {
      const coords: Coordinates[] = [{ x: 5, y: 5 }]
      const result = applyTransform(coords, -3, -2)
      expect(result).toEqual([{ x: 2, y: 3 }])
    })

    it('should handle zero offsets', () => {
      const coords: Coordinates[] = [{ x: 1, y: 2 }]
      const result = applyTransform(coords, 0, 0)
      expect(result).toEqual([{ x: 1, y: 2 }])
    })
  })

  describe('getAllTransformations', () => {
    it('should return transformations for a simple line', () => {
      const line: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }
      ]
      const transformations = getAllTransformations(line)
      
      expect(transformations.length).toBeGreaterThan(0)
      expect(transformations.length).toBeLessThanOrEqual(8) // max 8 transformations
      
      transformations.forEach(t => {
        expect(typeof t.rotation).toBe('number')
        expect(typeof t.flipped).toBe('boolean')
        expect(Array.isArray(t.coords)).toBe(true)
        expect(t.coords.length).toBe(line.length)
      })
    })

    it('should return only unique transformations', () => {
      const square: Coordinates[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ]
      const transformations = getAllTransformations(square)
      
      // Square should have fewer unique transformations due to symmetry
      expect(transformations.length).toBeLessThanOrEqual(8)
      
      // Check that all transformations are actually unique
      for (let i = 0; i < transformations.length; i++) {
        for (let j = i + 1; j < transformations.length; j++) {
          const coords1 = transformations[i].coords
          const coords2 = transformations[j].coords
          
          const sorted1 = coords1.slice().sort((a, b) => a.x - b.x || a.y - b.y)
          const sorted2 = coords2.slice().sort((a, b) => a.x - b.x || a.y - b.y)
          
          const areEqual = sorted1.every((c, idx) => 
            c.x === sorted2[idx].x && c.y === sorted2[idx].y
          )
          
          expect(areEqual).toBe(false)
        }
      }
    })

    it('should handle single cell', () => {
      const singleCell: Coordinates[] = [{ x: 0, y: 0 }]
      const transformations = getAllTransformations(singleCell)
      
      expect(transformations.length).toBe(1) // single cell has only one transformation
      expect(transformations[0].coords).toEqual([{ x: 0, y: 0 }])
    })
  })
})