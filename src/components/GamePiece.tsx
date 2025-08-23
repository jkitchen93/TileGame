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
}

export const GamePiece: React.FC<GamePieceProps> = ({
  piece,
  state = 'tray',
  onClick,
  onTransform,
  className = ''
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

  // Color based on piece value with pastel theme
  const getValueColor = (value: number) => {
    switch (value) {
      case 1: return 'bg-pastel-blue-200'
      case 2: return 'bg-pastel-green-200'
      case 3: return 'bg-pastel-yellow-200'
      case 4: return 'bg-pastel-pink-200'
      case 5: return 'bg-pastel-purple-200'
      case 6: return 'bg-pastel-blue-300'
      case 7: return 'bg-pastel-green-300'
      case 8: return 'bg-pastel-yellow-300'
      case 9: return 'bg-pastel-pink-300'
      default: return 'bg-pastel-purple-300'
    }
  }

  const getStateStyles = () => {
    switch (state) {
      case 'dragging':
        return 'opacity-75 scale-110 z-50'
      case 'ghost':
        return 'opacity-50 border-2 border-pastel-green-400 bg-transparent'
      case 'placed':
        return 'cursor-pointer hover:scale-105 transition-transform'
      default:
        return 'cursor-grab hover:scale-105 transition-transform'
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

  const cellSize = state === 'dragging' ? 'w-8 h-8' : 'w-6 h-6'
  const valueColor = getValueColor(piece.value)

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
        className="relative"
        style={{
          width: `${width * (state === 'dragging' ? 32 : 24)}px`,
          height: `${height * (state === 'dragging' ? 32 : 24)}px`
        }}
      >
        {/* Render each cell of the piece */}
        {transformedShape.map((coord, index) => (
          <div
            key={index}
            className={`absolute ${cellSize} ${state === 'ghost' ? 'border-2 border-pastel-green-400' : valueColor} rounded-cozy shadow-cozy transition-all duration-200`}
            style={{
              left: `${(coord.x - minX) * (state === 'dragging' ? 32 : 24)}px`,
              top: `${(coord.y - minY) * (state === 'dragging' ? 32 : 24)}px`,
            }}
          />
        ))}

        {/* Value overlay - only show on first cell */}
        {state !== 'ghost' && (
          <div
            className="absolute flex items-center justify-center text-xs font-bold text-purple-800 pointer-events-none"
            style={{
              left: `${0 * (state === 'dragging' ? 32 : 24)}px`,
              top: `${0 * (state === 'dragging' ? 32 : 24)}px`,
              width: `${state === 'dragging' ? 32 : 24}px`,
              height: `${state === 'dragging' ? 32 : 24}px`
            }}
          >
            {piece.value}
          </div>
        )}
      </div>

      {/* Transform indicators for tray pieces */}
      {state === 'tray' && onTransform && (
        <div className="absolute -bottom-6 left-0 text-xs text-purple-600 space-x-2">
          <span className="opacity-60">R:rotate F:flip</span>
        </div>
      )}
    </div>
  )
}

export default GamePiece