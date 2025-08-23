import React from 'react'
import { useDrag } from 'react-dnd'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'

interface DraggablePieceProps {
  piece: GamePieceType
}

const DraggablePiece: React.FC<DraggablePieceProps> = ({ piece }) => {
  const { transformPiece } = useGameStore()

  const [{ isDragging }, drag] = useDrag({
    type: 'piece',
    item: { piece },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const handleTransform = (rotate?: boolean, flip?: boolean) => {
    transformPiece(piece.id, rotate, flip)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'r':
        e.preventDefault()
        handleTransform(true, false)
        break
      case 'f':
        e.preventDefault()
        handleTransform(false, true)
        break
    }
  }

  return (
    <div
      ref={drag}
      className={`p-2 ${isDragging ? 'opacity-50' : 'opacity-100'} transition-opacity`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Draggable piece: ${piece.shape}, value ${piece.value}. Press R to rotate, F to flip`}
      aria-describedby="piece-controls"
    >
      <GamePiece
        piece={piece}
        state={isDragging ? 'dragging' : 'tray'}
        onTransform={handleTransform}
        className="hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
      />
    </div>
  )
}

export const PieceTray: React.FC = () => {
  const { trayPieces, level } = useGameStore()

  if (!level) {
    return (
      <div className="text-center text-purple-600 p-8">
        <p>Load a level to see available pieces</p>
      </div>
    )
  }

  if (trayPieces.length === 0) {
    return (
      <div className="text-center text-purple-600 p-8">
        <p>🎉 All pieces have been placed!</p>
        <p className="text-sm opacity-75">Check if you've won the puzzle</p>
      </div>
    )
  }

  // Group pieces by shape for better organization
  const groupedPieces = trayPieces.reduce((groups, piece) => {
    if (!groups[piece.shape]) {
      groups[piece.shape] = []
    }
    groups[piece.shape].push(piece)
    return groups
  }, {} as Record<string, GamePieceType[]>)

  const shapeOrder = ['I1', 'I2', 'I3', 'L3', 'I4', 'O4', 'T4', 'L4', 'S4']

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy-lg p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-purple-800">Piece Tray</h2>
        <div className="text-sm text-purple-600">
          {trayPieces.length} piece{trayPieces.length !== 1 ? 's' : ''} remaining
        </div>
      </div>

      {/* Pieces organized by shape */}
      <div className="space-y-4">
        {shapeOrder.map(shape => {
          const pieces = groupedPieces[shape]
          if (!pieces || pieces.length === 0) return null

          return (
            <div key={shape} className="space-y-2">
              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                {shape} ({pieces.length})
              </div>
              <div className="flex flex-wrap gap-3 p-3 bg-purple-50 rounded-cozy">
                {pieces.map(piece => (
                  <DraggablePiece key={piece.id} piece={piece} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Transform instructions */}
      <div id="piece-controls" className="mt-6 p-3 bg-pastel-purple-100 rounded-cozy text-sm text-purple-700">
        <div className="font-medium mb-1">Piece Controls:</div>
        <div className="space-y-1 text-xs">
          <div><kbd className="px-1 py-0.5 bg-white rounded text-purple-800">R</kbd> - Rotate piece 90°</div>
          <div><kbd className="px-1 py-0.5 bg-white rounded text-purple-800">F</kbd> - Flip piece horizontally</div>
          <div className="opacity-75">Focus a piece and use keyboard, or drag to board</div>
        </div>
      </div>

      {/* Piece count summary */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <div className="grid grid-cols-3 gap-2 text-xs text-purple-600">
          <div className="text-center">
            <div className="font-medium text-purple-800">{trayPieces.filter(p => p.shape === 'I1').length}</div>
            <div>Monominoes</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-800">{trayPieces.filter(p => ['I2', 'I3', 'L3'].includes(p.shape)).length}</div>
            <div>Small Pieces</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-800">{trayPieces.filter(p => ['I4', 'O4', 'T4', 'L4', 'S4'].includes(p.shape)).length}</div>
            <div>Tetrominoes</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PieceTray