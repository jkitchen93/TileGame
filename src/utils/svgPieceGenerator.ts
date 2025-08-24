import { Coordinates } from './polyominoes'
import { GridUtils } from './gridUtils'

/**
 * Generates an SVG path for a polyomino piece as a single unified shape
 * Always creates a unified appearance regardless of gap size
 */
export function generatePiecePath(
  shape: Coordinates[],
  cellSize: number,
  gapSize: number
): string {
  if (shape.length === 0) return ''

  // Find bounds and normalize
  const minX = Math.min(...shape.map(c => c.x))
  const minY = Math.min(...shape.map(c => c.y))
  
  // Normalize coordinates to start at 0,0
  const normalizedShape = shape.map(coord => ({
    x: coord.x - minX,
    y: coord.y - minY
  }))

  // Always render as unified shape
  // Position cells according to grid spacing, but render them touching
  const gridStep = cellSize + gapSize
  const radius = Math.min(8, cellSize * 0.15)
  
  // Create a set of cell coordinates for quick lookup
  const cellSet = new Set(normalizedShape.map(c => `${c.x},${c.y}`))
  
  // Build paths for each cell, positioned on grid but sized to touch
  const paths: string[] = []
  
  normalizedShape.forEach(coord => {
    // Position based on grid
    const x = coord.x * gridStep
    const y = coord.y * gridStep
    
    // Check adjacent cells to determine which edges to round
    const hasTop = cellSet.has(`${coord.x},${coord.y - 1}`)
    const hasBottom = cellSet.has(`${coord.x},${coord.y + 1}`)
    const hasLeft = cellSet.has(`${coord.x - 1},${coord.y}`)
    const hasRight = cellSet.has(`${coord.x + 1},${coord.y}`)
    
    // Extend cell to connect with adjacent cells
    const extendTop = hasTop ? gapSize / 2 : 0
    const extendBottom = hasBottom ? gapSize / 2 : 0
    const extendLeft = hasLeft ? gapSize / 2 : 0
    const extendRight = hasRight ? gapSize / 2 : 0
    
    // Draw cell with extensions to create unified shape
    paths.push(`
      M ${x - extendLeft + radius} ${y - extendTop}
      h ${cellSize + extendLeft + extendRight - 2 * radius}
      a ${radius} ${radius} 0 0 1 ${radius} ${radius}
      v ${cellSize + extendTop + extendBottom - 2 * radius}
      a ${radius} ${radius} 0 0 1 -${radius} ${radius}
      h -${cellSize - extendLeft - extendRight + 2 * radius}
      a ${radius} ${radius} 0 0 1 -${radius} -${radius}
      v -${cellSize - extendTop - extendBottom + 2 * radius}
      a ${radius} ${radius} 0 0 1 ${radius} -${radius}
      Z
    `)
  })
  
  return paths.join(' ')
}

/**
 * Generates SVG dimensions for a piece
 * Returns the total area the piece spans (including gaps between cells)
 */
export function getPieceDimensions(
  shape: Coordinates[],
  _cellSize: number,
  _gapSize: number
): { width: number; height: number } {
  if (shape.length === 0) return { width: 0, height: 0 }

  const minX = Math.min(...shape.map(c => c.x))
  const maxX = Math.max(...shape.map(c => c.x))
  const minY = Math.min(...shape.map(c => c.y))
  const maxY = Math.max(...shape.map(c => c.y))

  const numCellsX = maxX - minX + 1
  const numCellsY = maxY - minY + 1

  // Pieces span the full area including gaps between cells
  // e.g., a 2x2 piece spans: 2 cells + 1 gap = 48*2 + 4*1 = 100px
  const width = GridUtils.getPieceSpan(numCellsX)
  const height = GridUtils.getPieceSpan(numCellsY)

  return { width, height }
}

/**
 * Gets gradient colors for a piece value
 */
export function getGradientColors(value: number): [string, string] {
  switch (value) {
    case 1: return ['#60a5fa', '#3b82f6'] // Blue
    case 2: return ['#4ade80', '#22c55e'] // Green
    case 3: return ['#fbbf24', '#f59e0b'] // Yellow
    case 4: return ['#c084fc', '#a855f7'] // Purple
    case 5: return ['#f472b6', '#ec4899'] // Pink
    case 6: return ['#fb923c', '#f97316'] // Coral
    default: return ['#c084fc', '#a855f7'] // Default purple
  }
}

/**
 * Gets the center position of the first cell for value overlay
 */
export function getValueOverlayPosition(
  shape: Coordinates[],
  cellSize: number,
  gapSize: number
): { x: number; y: number } {
  if (shape.length === 0) return { x: 0, y: 0 }

  // Normalize shape to start at 0,0
  const minX = Math.min(...shape.map(c => c.x))
  const minY = Math.min(...shape.map(c => c.y))
  
  // Find the top-left most cell for consistent value placement
  const topLeftCell = shape
    .map(c => ({ x: c.x - minX, y: c.y - minY }))
    .sort((a, b) => {
      const sumA = a.x + a.y
      const sumB = b.x + b.y
      if (sumA !== sumB) return sumA - sumB
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })[0]

  const cellWithGap = cellSize + gapSize
  
  return {
    x: topLeftCell.x * cellWithGap + cellSize / 2,
    y: topLeftCell.y * cellWithGap + cellSize / 2
  }
}