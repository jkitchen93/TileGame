import React from 'react'
import { useDragLayer } from 'react-dnd'
import { GamePiece as GamePieceType } from '../types'
import GamePiece from './GamePiece'
import { GridUtils } from '../utils/gridUtils'

const CustomDragLayer: React.FC = () => {
  const {
    item,
    itemType,
    isDragging,
    currentOffset
  } = useDragLayer((monitor: any) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset()
  }))

  if (!isDragging || itemType !== 'piece' || !currentOffset) {
    return null
  }

  const piece = item?.piece as GamePieceType
  if (!piece) {
    return null
  }

  return (
    <div
      className="fixed pointer-events-none z-[1000]"
      style={{
        left: currentOffset.x - 20, // Offset to center on cursor
        top: currentOffset.y - 20,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <GamePiece
        piece={piece}
        state="dragging"
        cellSize={GridUtils.CELL_SIZE}
        gapSize={GridUtils.GAP_SIZE}
        className="scale-110"
      />
    </div>
  )
}

export default CustomDragLayer