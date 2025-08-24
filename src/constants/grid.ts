// Unified grid sizing constants used across the application
// These ensure consistent alignment between board and pieces

export const GRID_CONSTANTS = {
  // Board dimensions
  BOARD_SIZE: 5, // 5x5 grid
  
  // Cell sizing for different contexts
  BOARD_CELL_SIZE: 48, // Size of board cells in pixels
  BOARD_GAP_SIZE: 4, // Gap between board cells in pixels
  
  TRAY_CELL_SIZE: 24, // Size of tray piece cells in pixels
  TRAY_GAP_SIZE: 2, // Gap between tray piece cells in pixels
  
  DRAGGING_CELL_SIZE: 32, // Size when dragging
  DRAGGING_GAP_SIZE: 2, // Gap when dragging
  
  // Calculate total board dimensions
  get BOARD_TOTAL_WIDTH() {
    return this.BOARD_SIZE * this.BOARD_CELL_SIZE + (this.BOARD_SIZE - 1) * this.BOARD_GAP_SIZE
  },
  
  get BOARD_TOTAL_HEIGHT() {
    return this.BOARD_SIZE * this.BOARD_CELL_SIZE + (this.BOARD_SIZE - 1) * this.BOARD_GAP_SIZE
  }
}

export default GRID_CONSTANTS