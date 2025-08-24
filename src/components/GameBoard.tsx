import React, { useState, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import { isValidPlacement } from '../utils/placement'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'
import GRID_CONSTANTS from '../constants/grid'

export const GameBoard: React.FC = () => {
  const { board, placedPieces, placePiece, returnPieceToTray, monominoCount, pickedUpPiece } = useGameStore()
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null)
  const draggedPieceRef = useRef<GamePieceType | null>(null)
  const currentHoverPositionRef = useRef<{ row: number; col: number } | null>(null)

  // Setup drop zone for the entire board
  const [{ }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item: { piece: GamePieceType }) => {
      console.log('Drop event triggered with piece:', item.piece?.id)
      console.log('Current hover position (ref):', currentHoverPositionRef.current)
      console.log('Dragged piece (ref):', draggedPieceRef.current?.id)
      
      const currentPosition = currentHoverPositionRef.current
      const currentDraggedPiece = draggedPieceRef.current
      
      if (!currentPosition || !currentDraggedPiece) {
        console.log('Drop failed: missing position or piece')
        return { dropped: false }
      }

      const success = placePiece(currentDraggedPiece, currentPosition.row, currentPosition.col)
      console.log('Piece placement result:', success)
      
      if (success) {
        draggedPieceRef.current = null
        currentHoverPositionRef.current = null
        setHoveredPosition(null)
        return { dropped: true }
      }
      return { dropped: false }
    },
    hover: (item: { piece: GamePieceType }, monitor: any) => {
      draggedPieceRef.current = item.piece
      
      // Get the current mouse position relative to the board
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) {
        currentHoverPositionRef.current = null
        setHoveredPosition(null)
        return
      }

      // Get board element bounds  
      const boardElement = document.querySelector('[data-board="true"]')
      if (!boardElement) {
        currentHoverPositionRef.current = null
        setHoveredPosition(null)
        return
      }

      const boardRect = boardElement.getBoundingClientRect()
      
      // Calculate board padding dynamically based on container size
      const containerSize = 450 // From the fixed container size
      const boardTotalSize = GRID_CONSTANTS.BOARD_TOTAL_WIDTH
      const padding = (containerSize - boardTotalSize) / 2
      
      const relativeX = clientOffset.x - boardRect.left - padding
      const relativeY = clientOffset.y - boardRect.top - padding

      // Calculate which grid cell we're hovering over
      const cellWithGap = GRID_CONSTANTS.BOARD_CELL_SIZE + GRID_CONSTANTS.BOARD_GAP_SIZE
      const col = Math.floor(relativeX / cellWithGap)
      const row = Math.floor(relativeY / cellWithGap)

      // Only update if we're within the board bounds
      if (row >= 0 && row < 5 && col >= 0 && col < 5) {
        const position = { row, col }
        currentHoverPositionRef.current = position
        setHoveredPosition(position)
      } else {
        currentHoverPositionRef.current = null
        setHoveredPosition(null)
      }
    },
    collect: (monitor: any) => ({
      isOver: monitor.isOver(),
    }),
  }))

  // Get ghost preview coordinates if piece is being dragged/picked up over a valid position
  const getGhostPreviewCells = () => {
    const activePiece = draggedPieceRef.current || pickedUpPiece
    if (!activePiece || !hoveredPosition) return []

    const baseShape = getPolyominoShape(activePiece.shape)
    const transformedShape = getTransformedShape(baseShape, activePiece.rotation, activePiece.flipped)

    return transformedShape.map(coord => ({
      row: hoveredPosition.row + coord.y,
      col: hoveredPosition.col + coord.x
    }))
  }

  // Check if current hover position is valid for placement
  const isValidHoverPosition = () => {
    const activePiece = draggedPieceRef.current || pickedUpPiece
    if (!activePiece || !hoveredPosition) return false

    const placementResult = isValidPlacement(
      activePiece,
      hoveredPosition.row,
      hoveredPosition.col,
      board,
      placedPieces.filter(p => p.id !== activePiece!.id), // Exclude the active piece if it's already placed
      monominoCount
    )

    return placementResult.valid
  }

  const ghostCells = getGhostPreviewCells()
  const isValidPosition = isValidHoverPosition()

  // Handle mouse movement for picked up pieces (not dragged)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!pickedUpPiece) return

    // Get board element bounds  
    const boardElement = e.currentTarget
    const boardRect = boardElement.getBoundingClientRect()
    
    // Calculate board padding dynamically based on container size
    const containerSize = 450 // From the fixed container size
    const boardTotalSize = GRID_CONSTANTS.BOARD_TOTAL_WIDTH
    const padding = (containerSize - boardTotalSize) / 2
    
    const relativeX = e.clientX - boardRect.left - padding
    const relativeY = e.clientY - boardRect.top - padding

    // Calculate which grid cell we're hovering over
    const cellWithGap = GRID_CONSTANTS.BOARD_CELL_SIZE + GRID_CONSTANTS.BOARD_GAP_SIZE
    const col = Math.floor(relativeX / cellWithGap)
    const row = Math.floor(relativeY / cellWithGap)

    // Only update if we're within the board bounds
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      setHoveredPosition({ row, col })
    } else {
      setHoveredPosition(null)
    }
  }

  // Handle clicking on the board container
  const handleBoardClick = (e: React.MouseEvent) => {
    // If there's a picked up piece, try to place it using hoveredPosition
    if (pickedUpPiece && hoveredPosition) {
      const success = placePiece(pickedUpPiece, hoveredPosition.row, hoveredPosition.col)
      if (!success) {
        // If placement failed, piece remains picked up (user can try elsewhere or press ESC)
        console.log('Invalid placement, piece remains picked up')
      }
      return
    }
    
    // If no piece is picked up, handle returning placed pieces to tray
    if (!pickedUpPiece) {
      // Calculate which cell was clicked for returning pieces
      const boardElement = e.currentTarget
      const boardRect = boardElement.getBoundingClientRect()
      
      // Calculate board padding dynamically based on container size
      const containerSize = 450 // From the fixed container size
      const boardTotalSize = GRID_CONSTANTS.BOARD_TOTAL_WIDTH
      const padding = (containerSize - boardTotalSize) / 2
      
      const relativeX = e.clientX - boardRect.left - padding
      const relativeY = e.clientY - boardRect.top - padding

      // Calculate which grid cell was clicked
      const cellWithGap = GRID_CONSTANTS.BOARD_CELL_SIZE + GRID_CONSTANTS.BOARD_GAP_SIZE
      const col = Math.floor(relativeX / cellWithGap)
      const row = Math.floor(relativeY / cellWithGap)

      // Only handle if we're within the board bounds
      if (row >= 0 && row < 5 && col >= 0 && col < 5) {
        const cell = board[row]?.[col]
        if (cell?.pieceId) {
          returnPieceToTray(cell.pieceId)
        }
      }
    }
  }


  // Get the visual state for a cell
  const getCellState = (row: number, col: number) => {
    const cell = board[row]?.[col]
    
    // Check if this cell is part of ghost preview
    const isGhostCell = ghostCells.some(ghost => ghost.row === row && ghost.col === col)
    if (isGhostCell) {
      return isValidPosition ? 'ghost-valid' : 'ghost-invalid'
    }

    // Check if cell is occupied by a placed piece
    if (cell?.pieceId) {
      return 'occupied'
    }

    return 'empty'
  }

  // Get piece color based on value
  const getPieceColor = (value: number) => {
    switch (value) {
      case 1: return { 
        background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        border: '2px solid #2563eb'
      }
      case 2: return { 
        background: 'linear-gradient(135deg, #4ade80, #22c55e)',
        border: '2px solid #16a34a'
      }
      case 3: return { 
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        border: '2px solid #d97706'
      }
      case 4: return { 
        background: 'linear-gradient(135deg, #c084fc, #a855f7)',
        border: '2px solid #9333ea'
      }
      case 5: return { 
        background: 'linear-gradient(135deg, #f472b6, #ec4899)',
        border: '2px solid #db2777'
      }
      case 6: return { 
        background: 'linear-gradient(135deg, #fb923c, #f97316)',
        border: '2px solid #ea580c'
      }
      default: return { 
        background: 'linear-gradient(135deg, #c084fc, #a855f7)',
        border: '2px solid #9333ea'
      }
    }
  }

  const getCellStyles = (state: string) => {
    switch (state) {
      case 'ghost-valid':
        return 'border-2 border-green-400 bg-green-100 scale-105 transition-all duration-200 shadow-md'
      case 'ghost-invalid':
        return 'bg-rose-200 border-2 border-rose-400 scale-105 transition-all duration-200 shadow-md'
      case 'occupied':
        return 'cursor-pointer transition-all duration-200 hover:scale-105 shadow-md'
      default:
        return 'border-2 border-dashed border-purple-300 transition-all duration-200 hover:border-purple-400'
    }
  }


  return (
    <div className="flex flex-col items-center">
      
      <div
        ref={drop as any}
        className={`relative bg-white border-2 transition-colors z-10 ${draggedPieceRef.current || pickedUpPiece ? 'border-green-400 shadow-lg' : 'border-purple-200'}`}
        style={{
          borderRadius: '20px',
          padding: '25px',
          width: '450px',
          height: '450px',
          boxShadow: '0 20px 40px rgba(147, 51, 234, 0.15), 0 10px 20px rgba(147, 51, 234, 0.1)'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPosition(null)}
        onClick={handleBoardClick}
        data-board="true"
        role="grid"
        aria-label="5x5 game board for placing polyomino pieces"
        aria-describedby="board-instructions"
      >
        {/* Grid container with consistent sizing */}
        <div 
          className="grid grid-cols-5"
          style={{
            gap: `${GRID_CONSTANTS.BOARD_GAP_SIZE}px`,
            width: `${GRID_CONSTANTS.BOARD_TOTAL_WIDTH}px`,
            height: `${GRID_CONSTANTS.BOARD_TOTAL_HEIGHT}px`
          }}
        >
          {/* Grid cells */}
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellState = getCellState(rowIndex, colIndex)
              
              // Get piece color if cell is occupied
              const pieceColor = cell.pieceValue ? getPieceColor(cell.pieceValue) : null
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`rounded-xl ${getCellStyles(cellState)} ${
                    hoveredPosition && hoveredPosition.row === rowIndex && hoveredPosition.col === colIndex ? 
                    'ring-2 ring-blue-400 ring-offset-1' : ''
                  } flex items-center justify-center relative`}
                  style={{
                    width: `${GRID_CONSTANTS.BOARD_CELL_SIZE}px`,
                    height: `${GRID_CONSTANTS.BOARD_CELL_SIZE}px`,
                    gridColumn: colIndex + 1,
                    gridRow: rowIndex + 1,
                    background: cellState === 'ghost-valid' ? 
                      'linear-gradient(135deg, #bbf7d0, #86efac)' :
                      cellState === 'occupied' && pieceColor ?
                      pieceColor.background :
                      cellState === 'empty' ? 
                      'linear-gradient(135deg, #faf5ff, #f3e8ff)' : 
                      'transparent',
                    border: cellState === 'occupied' && pieceColor ? 
                      pieceColor.border : 
                      undefined
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                  role="gridcell"
                  aria-label={`Board cell ${rowIndex + 1}, ${colIndex + 1}${cell.pieceId ? ' - occupied' : ' - empty'}`}
                  tabIndex={cell.pieceId ? 0 : -1}
                >
                  {/* Show piece value if cell is occupied */}
                  {cellState === 'occupied' && cell.pieceValue && (
                    <div
                      className="font-bold text-white pointer-events-none select-none"
                      style={{
                        fontSize: `${Math.max(GRID_CONSTANTS.BOARD_CELL_SIZE * 0.4, 18)}px`,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {cell.pieceValue}
                    </div>
                  )}
                </div>
              )
            })
          )}

        </div>
      </div>
    </div>
  )
}

export default GameBoard