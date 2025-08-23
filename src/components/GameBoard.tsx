import React, { useState } from 'react'
import { useDrop } from 'react-dnd'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import { isValidPlacement } from '../utils/placement'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'
import GamePiece from './GamePiece'

const CELL_SIZE = 48 // 48px cells for good visibility

export const GameBoard: React.FC = () => {
  const { board, placedPieces, placePiece, returnPieceToTray, monominoCount } = useGameStore()
  const [hoveredPosition, setHoveredPosition] = useState<{ row: number; col: number } | null>(null)
  const [draggedPiece, setDraggedPiece] = useState<GamePieceType | null>(null)

  // Setup drop zone for the entire board
  const [{ isOver }, drop] = useDrop({
    accept: 'piece',
    drop: (item: { piece: GamePieceType }, monitor) => {
      if (!hoveredPosition || !draggedPiece) return

      const success = placePiece(draggedPiece, hoveredPosition.row, hoveredPosition.col)
      if (success) {
        setDraggedPiece(null)
        setHoveredPosition(null)
      }
    },
    hover: (item: { piece: GamePieceType }, monitor) => {
      setDraggedPiece(item.piece)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  // Get ghost preview coordinates if piece is being dragged over a valid position
  const getGhostPreviewCells = () => {
    if (!draggedPiece || !hoveredPosition) return []

    const baseShape = getPolyominoShape(draggedPiece.shape)
    const transformedShape = getTransformedShape(baseShape, draggedPiece.rotation, draggedPiece.flipped)

    return transformedShape.map(coord => ({
      row: hoveredPosition.row + coord.y,
      col: hoveredPosition.col + coord.x
    }))
  }

  // Check if current hover position is valid for placement
  const isValidHoverPosition = () => {
    if (!draggedPiece || !hoveredPosition) return false

    const placementResult = isValidPlacement(
      draggedPiece,
      hoveredPosition.row,
      hoveredPosition.col,
      board,
      placedPieces.filter(p => p.id !== draggedPiece.id), // Exclude the dragged piece if it's already placed
      monominoCount
    )

    return placementResult.valid
  }

  const ghostCells = getGhostPreviewCells()
  const isValidPosition = isValidHoverPosition()

  // Handle mouse move over cells to update hover position
  const handleCellMouseEnter = (row: number, col: number) => {
    if (draggedPiece) {
      setHoveredPosition({ row, col })
    }
  }

  const handleCellMouseLeave = () => {
    // Only clear if we're leaving the board entirely, not just moving between cells
  }

  // Handle clicking on placed pieces to return them to tray
  const handleCellClick = (row: number, col: number) => {
    const cell = board[row]?.[col]
    if (cell?.pieceId) {
      returnPieceToTray(cell.pieceId)
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
        return 'bg-pastel-green-200 border-2 border-pastel-green-400 scale-105'
      case 'ghost-invalid':
        return 'bg-rose-200 border-2 border-rose-400'
      case 'occupied':
        return 'cursor-pointer hover:bg-purple-100'
      default:
        return 'hover:bg-purple-50 border border-purple-200'
    }
  }

  // Find pieces that should be rendered on the board
  const getBoardPieces = () => {
    const pieces: Array<{ piece: GamePieceType; row: number; col: number }> = []
    
    placedPieces.forEach(piece => {
      // Find where this piece is placed
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          if (board[row][col].pieceId === piece.id) {
            // This is the top-left position of the piece
            pieces.push({ piece, row, col })
            return
          }
        }
      }
    })
    
    return pieces
  }

  const boardPieces = getBoardPieces()

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-semibold text-purple-800">Game Board</h2>
      
      <div
        ref={drop}
        className={`relative grid grid-cols-5 gap-1 p-4 bg-white rounded-cozy-lg shadow-cozy-lg border-2 ${
          isOver ? 'border-purple-400' : 'border-purple-200'
        } transition-colors`}
        onMouseLeave={() => setHoveredPosition(null)}
        role="grid"
        aria-label="5x5 game board for placing polyomino pieces"
        aria-describedby="board-instructions"
      >
        {/* Grid cells */}
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellState = getCellState(rowIndex, colIndex)
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-12 h-12 rounded-cozy transition-all duration-200 ${getCellStyles(cellState)}`}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  gridColumn: colIndex + 1,
                  gridRow: rowIndex + 1,
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

        {/* Render placed pieces on top of the grid */}
        {boardPieces.map(({ piece, row, col }) => (
          <div
            key={piece.id}
            className="absolute pointer-events-none"
            style={{
              left: `${col * (CELL_SIZE + 4) + 16}px`, // 4px gap + 16px padding
              top: `${row * (CELL_SIZE + 4) + 16}px`,
            }}
          >
            <GamePiece
              piece={piece}
              state="placed"
              className="pointer-events-auto"
              onClick={() => returnPieceToTray(piece.id)}
            />
          </div>
        ))}
      </div>

      {/* Board instructions */}
      <div id="board-instructions" className="text-sm text-purple-600 text-center max-w-md">
        <p>Drag pieces from the tray below to place them on the board.</p>
        <p>Click placed pieces to return them to the tray.</p>
        <p className="mt-1 text-xs opacity-75">Green = valid placement, Red = invalid placement</p>
      </div>
    </div>
  )
}

export default GameBoard