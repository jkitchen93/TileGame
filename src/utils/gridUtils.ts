/**
 * Grid utility functions for consistent coordinate calculations
 * This centralizes all grid-to-pixel conversions to avoid alignment bugs
 */

export const GridUtils = {
  // Base measurements - ENLARGED for 50% bigger interactive grid
  CELL_SIZE: 72,    // Size of a single cell in pixels (enlarged from 48px)
  GAP_SIZE: 6,      // Gap between cells in pixels (enlarged from 4px)
  GRID_STEP: 78,    // Total step size (cell + gap) (72 + 6 = 78)
  BOARD_SIZE: 5,    // 5x5 grid
  
  /**
   * Convert grid coordinate to pixel position
   * @param gridPos Grid coordinate (0-4 for 5x5 board)
   * @returns Pixel position
   */
  toPixels: (gridPos: number): number => {
    return gridPos * GridUtils.GRID_STEP
  },
  
  /**
   * Convert pixel position to grid coordinate
   * @param pixels Pixel position
   * @returns Grid coordinate
   */
  toGrid: (pixels: number): number => {
    return Math.floor(pixels / GridUtils.GRID_STEP)
  },
  
  /**
   * Get the total size a piece spans (including gaps between its cells)
   * For example, a 2x2 piece spans 2 cells + 1 gap = 100px
   * @param numCells Number of cells in one dimension
   * @returns Total span in pixels
   */
  getPieceSpan: (numCells: number): number => {
    if (numCells <= 0) return 0
    return numCells * GridUtils.CELL_SIZE + (numCells - 1) * GridUtils.GAP_SIZE
  },
  
  /**
   * Get total board dimensions
   */
  getBoardDimensions: () => {
    const size = GridUtils.getPieceSpan(GridUtils.BOARD_SIZE)
    return { width: size, height: size }
  },
  
  /**
   * Check if a grid position is within board bounds
   */
  isInBounds: (row: number, col: number): boolean => {
    return row >= 0 && row < GridUtils.BOARD_SIZE && 
           col >= 0 && col < GridUtils.BOARD_SIZE
  }
}

export default GridUtils