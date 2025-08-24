import React, { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'
import GRID_CONSTANTS from '../constants/grid'


interface PieceTrayItemProps {
  piece: GamePieceType
  position: any
  index: number
}

const PieceTrayItem: React.FC<PieceTrayItemProps> = ({ piece, position }) => {
  const { transformPiece } = useGameStore()

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'piece',
    item: { piece },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  // Disable the native HTML5 drag preview to prevent duplication
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true })
  }, [dragPreview])

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
      className={`absolute z-20 cursor-grab transition-transform duration-200 ${
        !isDragging ? 'hover:scale-105 hover:z-100' : ''
      } ${isDragging ? 'opacity-0' : 'opacity-100'}`}
      style={{
        ...position,
        transform: `${position.transform || ''}`,
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = `${position.transform || ''} scale(1.05) rotate(0deg)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = position.transform || ''
        }
      }}
    >
      <div 
        ref={drag as any}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Draggable piece: ${piece.shape}, value ${piece.value}. Press R to rotate, F to flip`}
      >
        <GamePiece
          piece={piece}
          state="tray"
          onTransform={handleTransform}
          cellSize={GRID_CONSTANTS.BOARD_CELL_SIZE}
          gapSize={GRID_CONSTANTS.BOARD_GAP_SIZE}
          className="transition-all duration-200"
        />
      </div>
    </div>
  )
}

export const PieceTray: React.FC = () => {
  const { trayPieces, level } = useGameStore()

  if (!level) {
    return null
  }

  if (trayPieces.length === 0) {
    return null
  }

  // Define scattered positions for pieces (adjusted for larger 48px cells)
  const scatteredPositions = [
    // T-piece (value 4) - top left (needs more space for 4-cell piece)
    { left: '60px', top: '40px', transform: 'rotate(-8deg)' },
    // L-piece (value 3) - top right  
    { right: '80px', top: '60px', transform: 'rotate(12deg)' },
    // I-piece (value 5) - left side (long piece needs space)
    { left: '20px', top: '220px', transform: 'rotate(-5deg)' },
    // O-piece (value 2) - bottom left (2x2 square)
    { left: '120px', bottom: '80px', transform: 'rotate(7deg)' },
    // S-piece (value 3) - right side
    { right: '50px', top: '200px', transform: 'rotate(-10deg)' },
    // I3-piece (value 2) - bottom right
    { right: '100px', bottom: '120px', transform: 'rotate(15deg)' },
    // L3-piece (value 2) - top center
    { left: '50%', top: '30px', transform: 'translateX(-50%) rotate(-3deg)' },
    // I2-piece (value 1) - left bottom
    { left: '40px', bottom: '180px', transform: 'rotate(20deg)' },
    // I2-piece (value 1) - right top
    { right: '20px', top: '140px', transform: 'rotate(-15deg)' },
    // I1-piece (value 5) - bottom center
    { left: '48%', bottom: '50px', transform: 'translateX(-50%) rotate(5deg)' }
  ]

  return (
    <>
      {trayPieces.map((piece, index) => {
        const position = scatteredPositions[index] || { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
        
        return (
          <PieceTrayItem
            key={piece.id}
            piece={piece}
            position={position}
            index={index}
          />
        )
      })}
    </>
  )
}

export default PieceTray