import React, { useState, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import { isValidPlacement } from '../utils/placement'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'
import GamePiece from './GamePiece'
import { GridUtils } from '../utils/gridUtils'

export const GameBoard: React.FC = () => {
  const { board, placedPieces, placePiece, pickUpPlacedPiece, monominoCount, pickedUpPiece } = useGameStore()
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
      
      // Use the actual padding from the board container style
      const actualPadding = 25 // This matches the padding: '25px' in the board container
      
      const relativeX = clientOffset.x - boardRect.left - actualPadding
      const relativeY = clientOffset.y - boardRect.top - actualPadding

      // Calculate which grid cell we're hovering over
      const col = GridUtils.toGrid(relativeX)
      const row = GridUtils.toGrid(relativeY)

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
    
    // Use the actual padding from the board container style
    const actualPadding = 25 // This matches the padding: '25px' in the board container
    
    const relativeX = e.clientX - boardRect.left - actualPadding
    const relativeY = e.clientY - boardRect.top - actualPadding

    // Calculate which grid cell we're hovering over
    const col = GridUtils.toGrid(relativeX)
    const row = GridUtils.toGrid(relativeY)

    // Only update if we're within the board bounds
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      setHoveredPosition({ row, col })
    } else {
      setHoveredPosition(null)
    }
  }

  // Handle clicking on the board container
  const handleBoardClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent bubbling to tray area click handler
    
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
      
      // Use the actual padding from the board container style
      const actualPadding = 25 // This matches the padding: '25px' in the board container
      
      const relativeX = e.clientX - boardRect.left - actualPadding
      const relativeY = e.clientY - boardRect.top - actualPadding

      // Calculate which grid cell was clicked
      const col = GridUtils.toGrid(relativeX)
      const row = GridUtils.toGrid(relativeY)

      // Only handle if we're within the board bounds
      if (row >= 0 && row < 5 && col >= 0 && col < 5) {
        const cell = board[row]?.[col]
        if (cell?.pieceId) {
          pickUpPlacedPiece(cell.pieceId)
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
        {/* Absolute positioned grid container */}
        <div 
          className="relative"
          style={{
            width: `${GridUtils.getPieceSpan(GridUtils.BOARD_SIZE)}px`,
            height: `${GridUtils.getPieceSpan(GridUtils.BOARD_SIZE)}px`
          }}
        >
          {/* Grid cells positioned absolutely */}
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellState = getCellState(rowIndex, colIndex)
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`absolute rounded-xl ${
                    cellState === 'empty' ? getCellStyles(cellState) : ''
                  } ${
                    hoveredPosition && hoveredPosition.row === rowIndex && hoveredPosition.col === colIndex ? 
                    'ring-2 ring-blue-400 ring-offset-1' : ''
                  }`}
                  style={{
                    left: `${GridUtils.toPixels(colIndex)}px`,
                    top: `${GridUtils.toPixels(rowIndex)}px`,
                    width: `${GridUtils.CELL_SIZE}px`,
                    height: `${GridUtils.CELL_SIZE}px`,
                    background: cellState === 'ghost-valid' ? 
                      'linear-gradient(135deg, #bbf7d0, #86efac)' :
                      cellState === 'ghost-invalid' ?
                      'linear-gradient(135deg, #fecaca, #fca5a5)' :
                      cellState === 'empty' ? 
                      'linear-gradient(135deg, #faf5ff, #f3e8ff)' : 
                      'transparent'
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                  role="gridcell"
                  aria-label={`Board cell ${rowIndex + 1}, ${colIndex + 1}${cell.pieceId ? ' - occupied' : ' - empty'}`}
                  tabIndex={cell.pieceId ? 0 : -1}
                />
              )
            })
          )}

          {/* Render placed pieces as unified SVG overlays */}
          {placedPieces.map(piece => {
            const leftPosition = GridUtils.toPixels(piece.position.x)
            const topPosition = GridUtils.toPixels(piece.position.y)
            
            return (
              <div
                key={piece.id}
                className="absolute cursor-pointer hover:z-50"
                style={{
                  left: `${leftPosition}px`,
                  top: `${topPosition}px`,
                  pointerEvents: 'auto'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  pickUpPlacedPiece(piece.id)
                }}
              >
                <GamePiece
                  piece={piece}
                  state="placed"
                  cellSize={GridUtils.CELL_SIZE}
                  gapSize={GridUtils.GAP_SIZE}
                />
              </div>
            )
          })}

          {/* Ghost preview for dragging/picked up pieces */}
          {(draggedPieceRef.current || pickedUpPiece) && hoveredPosition && isValidPosition && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${GridUtils.toPixels(hoveredPosition.col)}px`,
                top: `${GridUtils.toPixels(hoveredPosition.row)}px`
              }}
            >
              <GamePiece
                piece={draggedPieceRef.current || pickedUpPiece!}
                state="ghost"
                cellSize={GridUtils.CELL_SIZE}
                gapSize={GridUtils.GAP_SIZE}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameBoard