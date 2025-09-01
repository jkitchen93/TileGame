import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'
import { GridUtils } from '../utils/gridUtils'
import { calculateGrabPoint } from '../utils/grabPoint'


interface PieceTrayItemProps {
  piece: GamePieceType
  position: any
  index: number
}

const PieceTrayItem: React.FC<PieceTrayItemProps> = ({ piece, position }) => {
  const { pickUpPiece, cancelPickup, isPickedUp, pickedUpPiece, getTrayPosition } = useGameStore()
  
  // Use position from store (by piece ID) instead of passed position
  const actualPosition = getTrayPosition(piece.id) || position



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
      // Calculate grab point based on where the user clicked
      const pieceElement = (e.target as HTMLElement).closest('[role="button"]')
      if (pieceElement) {
        const grabPoint = calculateGrabPoint(
          piece,
          e.clientX,
          e.clientY,
          pieceElement as HTMLElement,
          GridUtils.CELL_SIZE,
          GridUtils.GAP_SIZE
        )
        pickUpPiece(piece, grabPoint)
      } else {
        // Fallback: pickup without grab point
        pickUpPiece(piece)
      }
    }
  }

  const isPiecePicked = isPickedUp(piece.id)

  return (
    <div
      className={`absolute z-20 cursor-pointer transition-transform duration-200 ${
        !isPiecePicked ? 'hover:scale-105 hover:z-100' : ''
      } ${isPiecePicked ? 'opacity-0' : 'opacity-100'}`}
      style={{
        ...actualPosition,
        transform: `${actualPosition.transform || ''}`,
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
      onMouseEnter={(e) => {
        if (!isPiecePicked) {
          e.currentTarget.style.transform = `${actualPosition.transform || ''} scale(1.05) rotate(0deg)`
        }
      }}
      onMouseLeave={(e) => {
        if (!isPiecePicked) {
          e.currentTarget.style.transform = actualPosition.transform || ''
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

  // Fallback position in case piece position not found in store
  const fallbackPosition = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  return (
    <>
      {trayPieces.map((piece, index) => (
        <PieceTrayItem
          key={piece.id}
          piece={piece}
          position={fallbackPosition}
          index={index}
        />
      ))}
    </>
  )
}

export default PieceTray