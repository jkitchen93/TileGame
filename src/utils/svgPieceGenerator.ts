import { Coordinates } from './polyominoes'

/**
 * Generates an SVG path for a polyomino piece as a single unified shape
 * Creates a single continuous shape by merging adjacent cells
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

  // When gapSize is 0, we want a unified shape
  // When gapSize > 0, we still keep cells separate
  if (gapSize > 0) {
    // Keep cells separate with gaps (original behavior)
    const cellWithGap = cellSize + gapSize
    const radius = Math.min(8, cellSize * 0.15)
    
    const paths: string[] = []
    normalizedShape.forEach(coord => {
      const x = coord.x * cellWithGap
      const y = coord.y * cellWithGap
      
      paths.push(`
        M ${x + radius} ${y}
        h ${cellSize - 2 * radius}
        a ${radius} ${radius} 0 0 1 ${radius} ${radius}
        v ${cellSize - 2 * radius}
        a ${radius} ${radius} 0 0 1 -${radius} ${radius}
        h -${cellSize - 2 * radius}
        a ${radius} ${radius} 0 0 1 -${radius} -${radius}
        v -${cellSize - 2 * radius}
        a ${radius} ${radius} 0 0 1 ${radius} -${radius}
        Z
      `)
    })
    
    return paths.join(' ')
  }
  
  // For unified shape (gapSize === 0), create a single merged path
  const unitSize = cellSize
  const radius = Math.min(8, cellSize * 0.15)
  
  // Create a set of cell coordinates for quick lookup
  const cellSet = new Set(normalizedShape.map(c => `${c.x},${c.y}`))
  
  // Build the unified shape as a single path
  const rects: string[] = []
  
  normalizedShape.forEach(coord => {
    const x = coord.x * unitSize
    const y = coord.y * unitSize
    
    // Check adjacent cells
    const hasTop = cellSet.has(`${coord.x},${coord.y - 1}`)
    const hasBottom = cellSet.has(`${coord.x},${coord.y + 1}`)
    const hasLeft = cellSet.has(`${coord.x - 1},${coord.y}`)
    const hasRight = cellSet.has(`${coord.x + 1},${coord.y}`)
    
    // Draw a rectangle for this cell
    rects.push(`
      M ${x} ${y}
      h ${unitSize}
      v ${unitSize}
      h -${unitSize}
      Z
    `)
  })
  
  // Use a single path with fill-rule evenodd to merge overlapping rectangles
  return rects.join(' ')
}

/**
 * Generates SVG dimensions for a piece
 */
export function getPieceDimensions(
  shape: Coordinates[],
  cellSize: number,
  gapSize: number
): { width: number; height: number } {
  if (shape.length === 0) return { width: 0, height: 0 }

  const minX = Math.min(...shape.map(c => c.x))
  const maxX = Math.max(...shape.map(c => c.x))
  const minY = Math.min(...shape.map(c => c.y))
  const maxY = Math.max(...shape.map(c => c.y))

  const cellWithGap = cellSize + gapSize
  const width = (maxX - minX + 1) * cellWithGap - gapSize
  const height = (maxY - minY + 1) * cellWithGap - gapSize

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