export interface TrayPosition {
  left: string
  top: string
  transform?: string
}

export interface TraySlot {
  id: number
  position: TrayPosition
  occupied: boolean
  pieceId?: string
  side: 'left' | 'right' | 'bottom'
}

// U-shaped wrapping configuration - pieces wrap around the board
export const TRAY_CONFIG = {
  SLOT_WIDTH: 180,
  SLOT_HEIGHT: 120,
  GAP: 20,
  BOARD_SIZE: 450, // Game board is 450x450px
  BOARD_PADDING: 50 // Distance from board edge to tray slots
}

// U-shaped slots that wrap around the board: left, right, bottom (no top - creates U)
export const U_SHAPED_WRAPPING_SLOTS: Array<{ side: 'left' | 'right' | 'bottom', index: number }> = [
  // Left side slots (left of the board)
  { side: 'left' as const, index: 0 },
  { side: 'left' as const, index: 1 },
  { side: 'left' as const, index: 2 },
  
  // Right side slots (right of the board)
  { side: 'right' as const, index: 0 },
  { side: 'right' as const, index: 1 },
  { side: 'right' as const, index: 2 },
  
  // Bottom side slots (below the board)
  { side: 'bottom' as const, index: 0 },
  { side: 'bottom' as const, index: 1 },
  { side: 'bottom' as const, index: 2 },
  { side: 'bottom' as const, index: 3 }
]

/**
 * Calculate pixel position for a slot that wraps around the board
 */
function calculateWrappingSlotPosition(slotConfig: { side: 'left' | 'right' | 'bottom', index: number }): TrayPosition {
  const { SLOT_WIDTH, SLOT_HEIGHT, GAP, BOARD_SIZE, BOARD_PADDING } = TRAY_CONFIG
  const { side, index } = slotConfig
  
  // Center the board area - board container is centered in the page
  const boardCenterX = '50%'
  const boardCenterY = '50%'
  
  switch (side) {
    case 'left':
      // Slots to the left of the board
      return {
        left: `calc(${boardCenterX} - ${BOARD_SIZE/2}px - ${BOARD_PADDING + SLOT_WIDTH}px)`,
        top: `calc(${boardCenterY} - ${BOARD_SIZE/2}px + ${index * (SLOT_HEIGHT + GAP)}px)`
      }
    
    case 'right':
      // Slots to the right of the board
      return {
        left: `calc(${boardCenterX} + ${BOARD_SIZE/2}px + ${BOARD_PADDING}px)`,
        top: `calc(${boardCenterY} - ${BOARD_SIZE/2}px + ${index * (SLOT_HEIGHT + GAP)}px)`
      }
    
    case 'bottom':
      // Slots below the board (horizontal row)
      return {
        left: `calc(${boardCenterX} - ${BOARD_SIZE/2}px + ${index * (SLOT_WIDTH + GAP)}px)`,
        top: `calc(${boardCenterY} + ${BOARD_SIZE/2}px + ${BOARD_PADDING}px)`
      }
    
    default:
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
}

/**
 * Generate U-shaped wrapping slots around the board
 */
export function generateUShapedSlots(): TraySlot[] {
  return U_SHAPED_WRAPPING_SLOTS.map((slotConfig, index) => ({
    id: index,
    position: calculateWrappingSlotPosition(slotConfig),
    occupied: false,
    side: slotConfig.side
  }))
}

/**
 * Generate initial tray positions for pieces using U-shaped wrapping slots
 * This ensures pieces are positioned around the board perimeter without overlap
 */
export function generateTrayPositions(pieceIds: string[]): Record<string, TrayPosition> {
  const positions: Record<string, TrayPosition> = {}
  const availableSlots = generateUShapedSlots()
  
  // Sort piece IDs to ensure consistent assignment
  const sortedIds = [...pieceIds].sort()
  
  sortedIds.forEach((id, index) => {
    if (index < availableSlots.length) {
      positions[id] = availableSlots[index].position
    } else {
      // FIXED: Instead of center-screen, stack excess pieces in last available slot with offset
      console.warn(`[TRAY_POSITIONING] Excess piece detected: ${id} (index ${index}). Using stacked fallback position.`)
      const lastSlot = availableSlots[availableSlots.length - 1]
      const excessOffset = (index - availableSlots.length + 1) * 10 // 10px offset per excess piece
      positions[id] = {
        left: `calc(${lastSlot.position.left} + ${excessOffset}px)`,
        top: `calc(${lastSlot.position.top} + ${excessOffset}px)`,
        transform: lastSlot.position.transform
      }
    }
  })
  
  return positions
}

/**
 * Find an available slot for a returning piece
 */
export function findAvailablePosition(
  occupiedPositions: Record<string, TrayPosition>,
  excludePieceId?: string
): TrayPosition {
  const availableSlots = generateUShapedSlots()
  const occupiedSlotPositions = new Set<string>()
  
  // Track which slots are occupied
  Object.entries(occupiedPositions).forEach(([pieceId, position]) => {
    if (excludePieceId && pieceId === excludePieceId) return
    occupiedSlotPositions.add(`${position.left},${position.top}`)
  })
  
  // Find first available slot
  for (const slot of availableSlots) {
    const positionKey = `${slot.position.left},${slot.position.top}`
    if (!occupiedSlotPositions.has(positionKey)) {
      return slot.position
    }
  }
  
  // FIXED: Instead of center-screen, use bottom-right slot with offset
  console.warn('[TRAY_POSITIONING] All tray slots occupied, using bottom-right fallback with offset')
  const bottomRightSlot = availableSlots[availableSlots.length - 1]
  return {
    left: `calc(${bottomRightSlot.position.left} + 20px)`,
    top: `calc(${bottomRightSlot.position.top} + 20px)`,
    transform: bottomRightSlot.position.transform
  }
}

/**
 * No longer needed - pieces wrap around board instead of container
 */
export function getTrayContainerDimensions() {
  return {
    width: '100%',
    height: '100%'
  }
}