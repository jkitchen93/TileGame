import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'
import { GridUtils } from '../utils/gridUtils'


interface PieceTrayItemProps {
  piece: GamePieceType
  position: any
  index: number
}

const PieceTrayItem: React.FC<PieceTrayItemProps> = ({ piece, position }) => {
  const { pickUpPiece, cancelPickup, isPickedUp, pickedUpPiece } = useGameStore()



  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent bubbling to tray area click handler
    
    // If there's already a picked up piece that's different, cancel it first
    if (pickedUpPiece && pickedUpPiece.id !== piece.id) {
      cancelPickup()
    }
    
    // Toggle pickup state for this piece
    if (isPickedUp(piece.id)) {
      cancelPickup()
    } else {
      pickUpPiece(piece)
    }
  }

  const isPiecePicked = isPickedUp(piece.id)

  return (
    <div
      className={`absolute z-20 cursor-pointer transition-transform duration-200 ${
        !isPiecePicked ? 'hover:scale-105 hover:z-100' : ''
      } ${isPiecePicked ? 'opacity-0' : 'opacity-100'}`}
      style={{
        ...position,
        transform: `${position.transform || ''}`,
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
      onMouseEnter={(e) => {
        if (!isPiecePicked) {
          e.currentTarget.style.transform = `${position.transform || ''} scale(1.05) rotate(0deg)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isPiecePicked) {
          e.currentTarget.style.transform = position.transform || ''
        }
      }}
    >
      <div 
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label={`Clickable piece: ${piece.shape}, value ${piece.value}. Click to pick up`}
      >
        <GamePiece
          piece={piece}
          state="tray"
          cellSize={GridUtils.CELL_SIZE}
          gapSize={GridUtils.GAP_SIZE}
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