export interface TrayPosition {
  left?: string
  right?: string
  top?: string
  bottom?: string
  transform?: string
}

// Pre-defined scattered positions for pieces within the tray area (300px height)
export const SCATTERED_POSITIONS: TrayPosition[] = [
  // Position 0: Top left area
  { left: '10%', top: '20px', transform: 'rotate(-8deg)' },
  // Position 1: Top right area
  { right: '10%', top: '30px', transform: 'rotate(12deg)' },
  // Position 2: Left side (long pieces need space)
  { left: '5%', top: '120px', transform: 'rotate(-5deg)' },
  // Position 3: Bottom left
  { left: '15%', bottom: '40px', transform: 'rotate(7deg)' },
  // Position 4: Right side middle
  { right: '8%', top: '100px', transform: 'rotate(-10deg)' },
  // Position 5: Bottom right
  { right: '12%', bottom: '50px', transform: 'rotate(15deg)' },
  // Position 6: Top center
  { left: '50%', top: '15px', transform: 'translateX(-50%) rotate(-3deg)' },
  // Position 7: Left middle
  { left: '25%', top: '80px', transform: 'rotate(20deg)' },
  // Position 8: Right top
  { right: '25%', top: '60px', transform: 'rotate(-15deg)' },
  // Position 9: Bottom center
  { left: '50%', bottom: '30px', transform: 'translateX(-50%) rotate(5deg)' },
  // Additional positions for larger bags
  { left: '35%', top: '160px', transform: 'rotate(8deg)' },
  { right: '15%', top: '180px', transform: 'rotate(-12deg)' }
]

/**
 * Generate initial tray positions for pieces based on their IDs
 * This ensures pieces always get the same position regardless of array order
 */
export function generateTrayPositions(pieceIds: string[]): Record<string, TrayPosition> {
  const positions: Record<string, TrayPosition> = {}
  
  // Sort piece IDs to ensure consistent assignment
  const sortedIds = [...pieceIds].sort()
  
  sortedIds.forEach((id, index) => {
    // Use modulo to cycle through positions if there are more pieces than positions
    const positionIndex = index % SCATTERED_POSITIONS.length
    positions[id] = SCATTERED_POSITIONS[positionIndex]
  })
  
  return positions
}

/**
 * Find an available position for a returning piece that doesn't overlap with existing pieces
 */
export function findAvailablePosition(
  occupiedPositions: Record<string, TrayPosition>,
  excludePieceId?: string
): TrayPosition {
  // Get list of currently occupied position indices
  const occupiedIndices = new Set<number>()
  
  Object.entries(occupiedPositions).forEach(([pieceId, position]) => {
    if (excludePieceId && pieceId === excludePieceId) return
    
    // Find which predefined position this matches
    const index = SCATTERED_POSITIONS.findIndex(pos => 
      JSON.stringify(pos) === JSON.stringify(position)
    )
    if (index !== -1) {
      occupiedIndices.add(index)
    }
  })
  
  // Find first available position
  for (let i = 0; i < SCATTERED_POSITIONS.length; i++) {
    if (!occupiedIndices.has(i)) {
      return SCATTERED_POSITIONS[i]
    }
  }
  
  // Fallback to center position if all are occupied (shouldn't happen normally)
  return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
}