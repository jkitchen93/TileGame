import React from 'react'
import { GamePiece as GamePieceType } from '../types'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'

interface GamePieceProps {
  piece: GamePieceType
  state?: 'tray' | 'dragging' | 'placed' | 'ghost'
  onClick?: () => void
  onTransform?: (rotate?: boolean, flip?: boolean) => void
  className?: string
  cellSize?: number // Size of each cell in pixels
  gapSize?: number // Gap between cells in pixels
}

export const GamePiece: React.FC<GamePieceProps> = ({
  piece,
  state = 'tray',
  onClick,
  onTransform,
  className = '',
  cellSize = 24, // Default size for tray pieces
  gapSize = 2 // Default gap for tray pieces
}) => {
  const baseShape = getPolyominoShape(piece.shape)
  const transformedShape = getTransformedShape(baseShape, piece.rotation, piece.flipped)

  // Calculate bounding box for proper sizing
  const minX = Math.min(...transformedShape.map(c => c.x))
  const maxX = Math.max(...transformedShape.map(c => c.x))
  const minY = Math.min(...transformedShape.map(c => c.y))
  const maxY = Math.max(...transformedShape.map(c => c.y))
  const width = maxX - minX + 1
  const height = maxY - minY + 1

  // Color based on piece value with gradient backgrounds matching mockup
  const getValueColor = (value: number) => {
    switch (value) {
      case 1: return { 
        className: 'piece-blue', 
        style: { background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      case 2: return { 
        className: 'piece-green', 
        style: { background: 'linear-gradient(135deg, #4ade80, #22c55e)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      case 3: return { 
        className: 'piece-yellow', 
        style: { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      case 4: return { 
        className: 'piece-purple', 
        style: { background: 'linear-gradient(135deg, #c084fc, #a855f7)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      case 5: return { 
        className: 'piece-pink', 
        style: { background: 'linear-gradient(135deg, #f472b6, #ec4899)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      case 6: return { 
        className: 'piece-coral', 
        style: { background: 'linear-gradient(135deg, #fb923c, #f97316)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
      default: return { 
        className: 'piece-purple', 
        style: { background: 'linear-gradient(135deg, #c084fc, #a855f7)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      }
    }
  }

  const getStateStyles = () => {
    switch (state) {
      case 'dragging':
        return 'opacity-0' // Hide the original piece during drag since CustomDragLayer shows it
      case 'ghost':
        return 'opacity-50 border-2 border-green-400 bg-transparent'
      case 'placed':
        return 'cursor-pointer hover:scale-105 transition-transform'
      default:
        return 'cursor-grab hover:scale-105 hover:z-100 transition-all duration-200'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onTransform) return
    
    switch (e.key.toLowerCase()) {
      case 'r':
        e.preventDefault()
        onTransform(true, false)
        break
      case 'f':
        e.preventDefault()
        onTransform(false, true)
        break
    }
  }

  // Adjust cell size for different states - no more scaling since we're using consistent sizes
  const actualCellSize = cellSize
  const actualGapSize = gapSize
  const colorInfo = getValueColor(piece.value)

  return (
    <div
      className={`relative inline-block ${getStateStyles()} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Piece ${piece.shape}, value ${piece.value}, rotation ${piece.rotation}°${piece.flipped ? ', flipped' : ''}`}
    >
      {/* Piece grid container */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${width}, ${actualCellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${actualCellSize}px)`,
          gap: `${actualGapSize}px`
        }}
      >
        {/* Render each cell of the piece */}
        {transformedShape.map((coord, index) => (
          <div
            key={index}
            className={`${state === 'ghost' ? 'border-2 border-green-400' : colorInfo.className} rounded-md transition-all duration-200`}
            style={{
              gridColumn: coord.x - minX + 1,
              gridRow: coord.y - minY + 1,
              width: `${actualCellSize}px`,
              height: `${actualCellSize}px`,
              ...(state !== 'ghost' ? colorInfo.style : {})
            }}
          />
        ))}

        {/* Value overlay - only show on first cell */}
        {state !== 'ghost' && transformedShape.length > 0 && (
          <div
            className="absolute flex items-center justify-center font-bold text-white pointer-events-none"
            style={{
              left: '0',
              top: '0',
              width: `${actualCellSize}px`,
              height: `${actualCellSize}px`,
              fontSize: `${Math.max(actualCellSize * 0.4, 14)}px`,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {piece.value}
          </div>
        )}
      </div>

    </div>
  )
}

export default GamePiece