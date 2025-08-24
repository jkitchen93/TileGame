import { GamePiece } from '../types'
import { getPolyominoShape } from './polyominoes'
import { getTransformedShape } from './transforms'

export interface GrabPoint {
  cellX: number
  cellY: number
}

/**
 * Calculate which cell of a piece was clicked based on the click position within the piece bounds
 */
export function calculateGrabPoint(
  piece: GamePiece,
  clickX: number,
  clickY: number,
  pieceElement: HTMLElement,
  cellSize: number,
  gapSize: number
): GrabPoint {
  const baseShape = getPolyominoShape(piece.shape)
  const transformedShape = getTransformedShape(baseShape, piece.rotation, piece.flipped)
  
  // Get piece element bounds
  const pieceRect = pieceElement.getBoundingClientRect()
  
  // Calculate click position relative to piece element
  const relativeX = clickX - pieceRect.left
  const relativeY = clickY - pieceRect.top
  
  // Calculate which cell was clicked
  // Account for the cell size and gaps in the SVG layout
  const cellX = Math.floor(relativeX / (cellSize + gapSize))
  const cellY = Math.floor(relativeY / (cellSize + gapSize))
  
  // Ensure the grab point is within the piece shape
  const validCell = transformedShape.find(coord => 
    coord.x === cellX && coord.y === cellY
  )
  
  if (validCell) {
    return { cellX, cellY }
  }
  
  // If click wasn't on a valid cell, default to the piece's center
  return getCenterGrabPoint(transformedShape)
}

/**
 * Calculate grab point for placed pieces on the board
 */
export function calculateBoardGrabPoint(
  piece: GamePiece,
  clickX: number,
  clickY: number,
  pieceX: number,
  pieceY: number,
  cellSize: number,
  gapSize: number
): GrabPoint {
  const baseShape = getPolyominoShape(piece.shape)
  const transformedShape = getTransformedShape(baseShape, piece.rotation, piece.flipped)
  
  // Calculate click position relative to piece position
  const relativeX = clickX - pieceX
  const relativeY = clickY - pieceY
  
  // Calculate which cell was clicked
  const cellX = Math.floor(relativeX / (cellSize + gapSize))
  const cellY = Math.floor(relativeY / (cellSize + gapSize))
  
  // Ensure the grab point is within the piece shape
  const validCell = transformedShape.find(coord => 
    coord.x === cellX && coord.y === cellY
  )
  
  if (validCell) {
    return { cellX, cellY }
  }
  
  // If click wasn't on a valid cell, default to the piece's center
  return getCenterGrabPoint(transformedShape)
}

/**
 * Get the center grab point of a piece shape
 */
export function getCenterGrabPoint(transformedShape: Array<{x: number, y: number}>): GrabPoint {
  if (transformedShape.length === 0) {
    return { cellX: 0, cellY: 0 }
  }
  
  const centerX = Math.round(
    transformedShape.reduce((sum, coord) => sum + coord.x, 0) / transformedShape.length
  )
  const centerY = Math.round(
    transformedShape.reduce((sum, coord) => sum + coord.y, 0) / transformedShape.length
  )
  
  // Find the closest actual cell to the calculated center
  const closestCell = transformedShape.reduce((closest, coord) => {
    const currentDistance = Math.sqrt(
      Math.pow(coord.x - centerX, 2) + Math.pow(coord.y - centerY, 2)
    )
    const closestDistance = Math.sqrt(
      Math.pow(closest.x - centerX, 2) + Math.pow(closest.y - centerY, 2)
    )
    
    return currentDistance < closestDistance ? coord : closest
  })
  
  return { cellX: closestCell.x, cellY: closestCell.y }
}

/**
 * Transform a grab point when a piece is rotated or flipped
 */
export function transformGrabPoint(
  grabPoint: GrabPoint,
  piece: GamePiece,
  oldRotation: number,
  oldFlipped: boolean
): GrabPoint {
  // If no transformation, return original grab point
  if (piece.rotation === oldRotation && piece.flipped === oldFlipped) {
    return grabPoint
  }
  
  // Get the original and transformed shapes to map the grab point
  const baseShape = getPolyominoShape(piece.shape)
  const oldShape = getTransformedShape(baseShape, oldRotation, oldFlipped)
  const newShape = getTransformedShape(baseShape, piece.rotation, piece.flipped)
  
  // Find the index of the grabbed cell in the old shape
  const cellIndex = oldShape.findIndex(coord => 
    coord.x === grabPoint.cellX && coord.y === grabPoint.cellY
  )
  
  // If the cell is found, map it to the new shape
  if (cellIndex >= 0 && cellIndex < newShape.length) {
    const newCell = newShape[cellIndex]
    return { cellX: newCell.x, cellY: newCell.y }
  }
  
  // If mapping fails, return the center grab point of the new shape
  return getCenterGrabPoint(newShape)
}