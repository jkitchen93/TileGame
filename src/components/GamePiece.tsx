import React from 'react'
import { GamePiece as GamePieceType } from '../types'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'
import { generatePiecePath, getPieceDimensions, getValueOverlayPosition, getGradientColors } from '../utils/svgPieceGenerator'

interface GamePieceProps {
  piece: GamePieceType
  state?: 'tray' | 'dragging' | 'placed' | 'ghost'
  onClick?: () => void
  className?: string
  cellSize?: number // Size of each cell in pixels
  gapSize?: number // Gap between cells in pixels
}

export const GamePiece: React.FC<GamePieceProps> = ({
  piece,
  state = 'tray',
  onClick,
  className = '',
  cellSize = 24, // Default size for tray pieces
  gapSize = 2 // Default gap for tray pieces
}) => {
  const baseShape = getPolyominoShape(piece.shape)
  const transformedShape = getTransformedShape(baseShape, piece.rotation, piece.flipped)

  // Get piece dimensions (with gaps for proper spanning)
  const { width, height } = getPieceDimensions(transformedShape, cellSize, gapSize)
  
  // Generate SVG path for the piece (will create unified appearance)
  const piecePath = generatePiecePath(transformedShape, cellSize, gapSize)
  
  // Get value overlay position
  const valuePosition = getValueOverlayPosition(transformedShape, cellSize, gapSize)

  // Get gradient colors for this piece
  const [gradientStart, gradientEnd] = getGradientColors(piece.value)
  const gradientId = `gradient-${piece.id}-${state}`
  const shadowId = `shadow-${piece.id}-${state}`

  const getStateStyles = () => {
    switch (state) {
      case 'dragging':
        return 'opacity-90' // Show the piece in drag layer with slight transparency
      case 'ghost':
        return 'opacity-50'
      case 'placed':
        return 'cursor-pointer hover:scale-105 transition-transform'
      default:
        return 'cursor-grab hover:scale-105 hover:z-40 transition-all duration-200'
    }
  }

  return (
    <div
      className={`relative inline-block ${getStateStyles()} ${className}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Piece ${piece.shape}, value ${piece.value}, rotation ${piece.rotation}°${piece.flipped ? ', flipped' : ''}`}
      style={{ width, height }}
      data-piece-id={piece.id}
      data-piece-state={state}
    >
      {/* SVG Piece */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <defs>
          {/* Gradient definition */}
          {state !== 'ghost' && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          )}
          {/* Shadow filter */}
          {state !== 'ghost' && (
            <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          )}
        </defs>
        
        {/* Piece path */}
        <path
          d={piecePath}
          fill={state === 'ghost' ? 'transparent' : `url(#${gradientId})`}
          stroke={state === 'ghost' ? '#4ade80' : 'none'}
          strokeWidth={state === 'ghost' ? '2' : '0'}
          filter={state !== 'ghost' ? `url(#${shadowId})` : undefined}
        />
        
        {/* Value text overlay */}
        {state !== 'ghost' && (
          <text
            x={valuePosition.x}
            y={valuePosition.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(cellSize * 0.4, 14)}
            fontWeight="bold"
            fill="white"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {piece.value}
          </text>
        )}
      </svg>
    </div>
  )
}

export default GamePiece