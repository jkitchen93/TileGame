import React, { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import GamePiece from './GamePiece'
import GRID_CONSTANTS from '../constants/grid'

const FloatingPiece: React.FC = () => {
  const { pickedUpPiece } = useGameStore()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    if (pickedUpPiece) {
      document.addEventListener('mousemove', handleMouseMove)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [pickedUpPiece])

  if (!pickedUpPiece) {
    return null
  }

  return (
    <div
      className="fixed pointer-events-none z-[1000]"
      style={{
        left: mousePosition.x - 20,
        top: mousePosition.y - 20,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <GamePiece
        piece={pickedUpPiece}
        state="dragging"
        cellSize={GRID_CONSTANTS.BOARD_CELL_SIZE}
        gapSize={GRID_CONSTANTS.BOARD_GAP_SIZE}
        className="scale-110"
      />
    </div>
  )
}

export default FloatingPiece