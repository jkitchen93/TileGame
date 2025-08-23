import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'

const CELL_SIZE = 48

export const GameBoard: React.FC = () => {
  const { board, placedPieces, returnPieceToTray } = useGameStore()

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
    
    // Check if cell is occupied by a placed piece
    if (cell?.pieceId) {
      return 'occupied'
    }

    return 'empty'
  }

  const getCellStyles = (state: string) => {
    switch (state) {
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
        className="relative grid grid-cols-5 gap-1 p-4 bg-white rounded-cozy-lg shadow-cozy-lg border-2 border-purple-200 transition-colors"
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
        <p>Click pieces to manually place them on the board (drag disabled for testing).</p>
        <p>Click placed pieces to return them to the tray.</p>
      </div>
    </div>
  )
}

export default GameBoard