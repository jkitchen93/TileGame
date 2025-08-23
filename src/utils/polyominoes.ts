import { PolyominoShape } from '../types'

export interface Coordinates {
  x: number
  y: number
}

export const POLYOMINO_SHAPES: Record<PolyominoShape, Coordinates[]> = {
  // Tetrominoes (4 cells)
  I4: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 }
  ],
  O4: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  T4: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 }
  ],
  L4: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 }
  ],
  S4: [
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  
  // Triominoes (3 cells)
  I3: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ],
  L3: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ],
  
  // Domino (2 cells)
  I2: [
    { x: 0, y: 0 },
    { x: 1, y: 0 }
  ],
  
  // Monomino (1 cell)
  I1: [
    { x: 0, y: 0 }
  ]
}

export function getPolyominoShape(shape: PolyominoShape): Coordinates[] {
  return POLYOMINO_SHAPES[shape]
}

export function getPolyominoSize(shape: PolyominoShape): number {
  return POLYOMINO_SHAPES[shape].length
}

export function getPolyominoBounds(shape: PolyominoShape): {
  width: number
  height: number
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  const coords = POLYOMINO_SHAPES[shape]
  const minX = Math.min(...coords.map(c => c.x))
  const maxX = Math.max(...coords.map(c => c.x))
  const minY = Math.min(...coords.map(c => c.y))
  const maxY = Math.max(...coords.map(c => c.y))
  
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    minX,
    maxX,
    minY,
    maxY
  }
}