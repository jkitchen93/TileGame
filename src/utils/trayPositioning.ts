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
  side: 'left' | 'right'
  width: number
  height: number
}

// Left/right only configuration - pieces only appear on the left and right sides of the board
export const TRAY_CONFIG = {
  SLOT_WIDTH: 140,  // Accommodates most pieces
  SLOT_HEIGHT: 100, // Accommodates most pieces
  GAP: 65,          // Increased further to eliminate all overlaps
  BOARD_SIZE: 420,  // Game board container is 420x420px (reduced from 650px)
  BOARD_PADDING: 90 // Increased for better spacing from board
}

// Left and right slots only - no bottom slots allowed
export const LEFT_RIGHT_ONLY_SLOTS: Array<{ side: 'left' | 'right', index: number }> = [
  // Left side slots (left of the board)
  { side: 'left' as const, index: 0 },
  { side: 'left' as const, index: 1 },
  { side: 'left' as const, index: 2 },
  { side: 'left' as const, index: 3 },
  
  // Right side slots (right of the board)
  { side: 'right' as const, index: 0 },
  { side: 'right' as const, index: 1 },
  { side: 'right' as const, index: 2 },
  { side: 'right' as const, index: 3 }
]

/**
 * Calculate pixel position for a slot on the left or right side of the board
 */
function calculateSideSlotPosition(slotConfig: { side: 'left' | 'right', index: number }): TrayPosition {
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
    
    default:
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
}

/**
 * Calculate additional left/right column slots beyond the initial left/right columns.
 * This allows unlimited pieces without overlap by adding columns further from the board.
 */
function calculateExtendedSideSlotPosition(extraIndex: number): TrayPosition {
  const { SLOT_WIDTH, SLOT_HEIGHT, GAP, BOARD_SIZE, BOARD_PADDING } = TRAY_CONFIG
  const boardCenterX = '50%'
  const boardCenterY = '50%'

  // Alternate between left and right sides for additional columns
  const slotsPerColumn = 4
  const columnIndex = Math.floor(extraIndex / (slotsPerColumn * 2)) // Which additional column (0, 1, 2, ...)
  const slotInColumn = Math.floor((extraIndex % (slotsPerColumn * 2)) / 2) // Which slot in the column (0-3)
  const isLeftSide = (extraIndex % 2) === 0 // Alternate left/right

  // Additional spacing between columns
  const columnSpacing = SLOT_WIDTH + GAP

  if (isLeftSide) {
    // Additional left columns, moving further left from the board
    return {
      left: `calc(${boardCenterX} - ${BOARD_SIZE/2}px - ${BOARD_PADDING + SLOT_WIDTH + (columnIndex + 1) * columnSpacing}px)`,
      top: `calc(${boardCenterY} - ${BOARD_SIZE/2}px + ${slotInColumn * (SLOT_HEIGHT + GAP)}px)`
    }
  } else {
    // Additional right columns, moving further right from the board
    return {
      left: `calc(${boardCenterX} + ${BOARD_SIZE/2}px + ${BOARD_PADDING + (columnIndex + 1) * columnSpacing}px)`,
      top: `calc(${boardCenterY} - ${BOARD_SIZE/2}px + ${slotInColumn * (SLOT_HEIGHT + GAP)}px)`
    }
  }
}

/**
 * Get a slot position by a global index, extending beyond the initial left/right set
 * by creating additional left/right columns as needed.
 */
function getSlotPositionByIndex(globalIndex: number): TrayPosition {
  const initialSlots = generateLeftRightSlots()
  if (globalIndex < initialSlots.length) {
    return initialSlots[globalIndex].position
  }

  // For indices beyond the initial slots, map to extended left/right columns
  const extraIndex = globalIndex - initialSlots.length
  return calculateExtendedSideSlotPosition(extraIndex)
}

/**
 * Generate left/right side slots around the board
 */
export function generateLeftRightSlots(): TraySlot[] {
  return LEFT_RIGHT_ONLY_SLOTS.map((slotConfig, index) => ({
    id: index,
    position: calculateSideSlotPosition(slotConfig),
    occupied: false,
    side: slotConfig.side,
    width: TRAY_CONFIG.SLOT_WIDTH,
    height: TRAY_CONFIG.SLOT_HEIGHT
  }))
}

/**
 * Generate initial tray positions for pieces using left/right side slots only
 * This ensures pieces are positioned on the sides of the board perimeter without overlap
 */
export function generateTrayPositions(pieceIds: string[]): Record<string, TrayPosition> {
  const positions: Record<string, TrayPosition> = {}
  
  // Sort piece IDs to ensure consistent assignment
  const sortedIds = [...pieceIds].sort()
  
  sortedIds.forEach((id, index) => {
    // Assign each piece a unique non-overlapping slot, extending columns as needed
    positions[id] = getSlotPositionByIndex(index)
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
  const occupiedSlotPositions = new Set<string>()

  // Track which positions are occupied
  Object.entries(occupiedPositions).forEach(([pieceId, position]) => {
    if (excludePieceId && pieceId === excludePieceId) return
    occupiedSlotPositions.add(`${position.left},${position.top}`)
  })

  // Search initial left/right side slots first
  const baseSlots = generateLeftRightSlots()
  for (const slot of baseSlots) {
    const key = `${slot.position.left},${slot.position.top}`
    if (!occupiedSlotPositions.has(key)) {
      return slot.position
    }
  }

  // Extend search across additional left/right columns until a free slot is found
  // Reasonable cap to avoid infinite loops; can be increased if needed
  for (let i = 0; i < 200; i++) {
    const pos = calculateExtendedSideSlotPosition(i)
    const key = `${pos.left},${pos.top}`
    if (!occupiedSlotPositions.has(key)) {
      return pos
    }
  }

  // Extremely unlikely: fallback to left side first extended column
  console.warn('[TRAY_POSITIONING] Exhausted extended slots; using safe fallback')
  return calculateExtendedSideSlotPosition(0)
}

/**
 * No longer needed - pieces are positioned on left/right sides only
 */
export function getTrayContainerDimensions() {
  return {
    width: '100%',
    height: '100%'
  }
}
