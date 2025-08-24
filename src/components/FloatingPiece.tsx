import React, { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import GamePiece from './GamePiece'
import { GridUtils } from '../utils/gridUtils'
import { getPolyominoShape } from '../utils/polyominoes'
import { getTransformedShape } from '../utils/transforms'
import { getCenterGrabPoint } from '../utils/grabPoint'

const FloatingPiece: React.FC = () => {
  const { pickedUpPiece, grabPoint } = useGameStore()
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

  // Calculate the offset based on grab point
  const calculateOffset = () => {
    if (!grabPoint) {
      // No grab point, use center offset
      const baseShape = getPolyominoShape(pickedUpPiece.shape)
      const transformedShape = getTransformedShape(baseShape, pickedUpPiece.rotation, pickedUpPiece.flipped)
      const centerGrabPoint = getCenterGrabPoint(transformedShape)
      
      const offsetX = centerGrabPoint.cellX * (GridUtils.CELL_SIZE + GridUtils.GAP_SIZE) + GridUtils.CELL_SIZE / 2
      const offsetY = centerGrabPoint.cellY * (GridUtils.CELL_SIZE + GridUtils.GAP_SIZE) + GridUtils.CELL_SIZE / 2
      
      return { offsetX, offsetY }
    }
    
    // Use the actual grab point
    const offsetX = grabPoint.cellX * (GridUtils.CELL_SIZE + GridUtils.GAP_SIZE) + GridUtils.CELL_SIZE / 2
    const offsetY = grabPoint.cellY * (GridUtils.CELL_SIZE + GridUtils.GAP_SIZE) + GridUtils.CELL_SIZE / 2
    
    return { offsetX, offsetY }
  }

  const { offsetX, offsetY } = calculateOffset()

  return (
    <div
      className="fixed pointer-events-none z-[1000]"
      style={{
        left: mousePosition.x - offsetX,
        top: mousePosition.y - offsetY,
      }}
    >
      <GamePiece
        piece={pickedUpPiece}
        state="dragging"
        cellSize={GridUtils.CELL_SIZE}
        gapSize={GridUtils.GAP_SIZE}
        className="scale-110"
      />
    </div>
  )
}

export default FloatingPiece