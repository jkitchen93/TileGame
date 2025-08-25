import { GameLevel, GamePiece, PolyominoShape, BoardCell, PlacedPiece } from '../types'
import { POLYOMINO_SHAPES, Coordinates } from './polyominoes'
import { getTransformedShape } from './transforms'

interface SolvedPuzzle {
  board: BoardCell[][]
  pieces: PlacedPiece[]
}

const ALL_SHAPES: PolyominoShape[] = ['I4', 'O4', 'T4', 'L4', 'S4', 'I3', 'L3', 'I2', 'I1']

const SHAPE_SIZES: Record<PolyominoShape, number> = {
  'I4': 4, 'O4': 4, 'T4': 4, 'L4': 4, 'S4': 4,
  'I3': 3, 'L3': 3,
  'I2': 2,
  'I1': 1
}

export function generateSolvedBoard(): SolvedPuzzle | null {
  const board: BoardCell[][] = Array(5).fill(null).map((_, row) =>
    Array(5).fill(null).map((_, col) => ({ row, col }))
  )
  
  const placedPieces: PlacedPiece[] = []
  let pieceIdCounter = 1
  
  function canPlacePiece(
    shape: PolyominoShape,
    row: number,
    col: number,
    rotation: number,
    flipped: boolean
  ): Coordinates[] | null {
    const baseCoords = POLYOMINO_SHAPES[shape]
    const transformedCoords = getTransformedShape(baseCoords, rotation, flipped)
    
    const occupiedCells: Coordinates[] = []
    
    for (const coord of transformedCoords) {
      const boardRow = row + coord.y
      const boardCol = col + coord.x
      
      if (boardRow < 0 || boardRow >= 5 || boardCol < 0 || boardCol >= 5) {
        return null
      }
      
      if (board[boardRow][boardCol].pieceId) {
        return null
      }
      
      occupiedCells.push({ x: boardCol, y: boardRow })
    }
    
    return occupiedCells
  }
  
  function placePiece(
    shape: PolyominoShape,
    row: number,
    col: number,
    rotation: number,
    flipped: boolean,
    occupiedCells: Coordinates[]
  ): PlacedPiece {
    const pieceId = `p${pieceIdCounter++}`
    
    for (const cell of occupiedCells) {
      board[cell.y][cell.x] = {
        ...board[cell.y][cell.x],
        pieceId,
        pieceShape: shape
      }
    }
    
    const piece: PlacedPiece = {
      id: pieceId,
      shape,
      value: 0,
      rotation,
      flipped,
      position: { x: col, y: row },
      occupiedCells
    }
    
    placedPieces.push(piece)
    return piece
  }
  
  function removePiece(piece: PlacedPiece): void {
    for (const cell of piece.occupiedCells) {
      board[cell.y][cell.x] = { row: cell.y, col: cell.x }
    }
    placedPieces.pop()
    pieceIdCounter--
  }
  
  function getEmptyCells(): number {
    let count = 0
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (!board[row][col].pieceId) count++
      }
    }
    return count
  }
  
  function backtrack(): boolean {
    const emptyCells = getEmptyCells()
    if (emptyCells === 0) return true
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (board[row][col].pieceId) continue
        
        const shapesToTry = emptyCells === 1 
          ? ['I1'] 
          : emptyCells === 2 
          ? ['I2', 'I1'] 
          : emptyCells === 3 
          ? ['I3', 'L3', 'I2', 'I1']
          : ALL_SHAPES.filter(s => SHAPE_SIZES[s] <= emptyCells)
        
        const monominoCount = placedPieces.filter(p => p.shape === 'I1').length
        const filteredShapes = shapesToTry.filter(shape => 
          shape !== 'I1' || monominoCount < 1
        )
        
        shuffleArray(filteredShapes)
        
        for (const shape of filteredShapes) {
          const rotations = shape === 'O4' ? [0] : [0, 90, 180, 270]
          const flips = shape === 'O4' ? [false] : [false, true]
          
          for (const rotation of rotations) {
            for (const flipped of flips) {
              const occupiedCells = canPlacePiece(shape, row, col, rotation, flipped)
              
              if (occupiedCells) {
                placePiece(shape, row, col, rotation, flipped, occupiedCells)
                
                if (backtrack()) {
                  return true
                }
                
                removePiece(placedPieces[placedPieces.length - 1])
              }
            }
          }
        }
        
        return false
      }
    }
    
    return false
  }
  
  if (backtrack()) {
    return { board, pieces: placedPieces }
  }
  
  return null
}

export function assignPieceValues(
  pieces: PlacedPiece[],
  targetSum: number
): PlacedPiece[] {
  const totalCells = pieces.reduce((sum, piece) => sum + piece.occupiedCells.length, 0)
  
  if (totalCells !== 25) {
    throw new Error('Board must be fully covered (25 cells)')
  }
  
  const minSum = pieces.length
  const maxSum = pieces.length * 9
  
  if (targetSum < minSum || targetSum > maxSum) {
    throw new Error(`Target sum ${targetSum} is not achievable with ${pieces.length} pieces`)
  }
  
  const piecesCopy = pieces.map(p => ({ ...p }))
  
  piecesCopy.forEach(piece => {
    piece.value = 1
  })
  
  let currentSum = pieces.length
  
  while (currentSum < targetSum) {
    const randomPiece = piecesCopy[Math.floor(Math.random() * piecesCopy.length)]
    
    if (randomPiece.value < 9) {
      const maxIncrease = Math.min(9 - randomPiece.value, targetSum - currentSum)
      const increase = Math.floor(Math.random() * maxIncrease) + 1
      randomPiece.value += increase
      currentSum += increase
    }
  }
  
  const skewedPieces = piecesCopy.map(piece => {
    if (piece.value > 4 && Math.random() < 0.6) {
      const otherPiece = piecesCopy.find(p => p.id !== piece.id && p.value < 4)
      if (otherPiece) {
        const transfer = Math.min(piece.value - 4, 4 - otherPiece.value)
        piece.value -= transfer
        otherPiece.value += transfer
      }
    }
    return piece
  })
  
  return skewedPieces
}

export function extractPuzzleBag(pieces: PlacedPiece[]): GamePiece[] {
  return pieces.map(piece => ({
    id: piece.id,
    shape: piece.shape,
    value: piece.value,
    rotation: 0,
    flipped: false
  }))
}

export function addDecoyPieces(
  bag: GamePiece[],
  count: number = 3
): GamePiece[] {
  const decoyShapes: PolyominoShape[] = []
  const existingMonominoes = bag.filter(p => p.shape === 'I1').length
  
  for (let i = 0; i < count; i++) {
    let availableShapes = ALL_SHAPES.filter(shape => 
      shape !== 'I1' || existingMonominoes === 0
    )
    
    const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)]
    decoyShapes.push(shape)
  }
  
  const decoyPieces: GamePiece[] = decoyShapes.map((shape, index) => ({
    id: `decoy${index + 1}`,
    shape,
    value: Math.floor(Math.random() * 4) + 1,
    rotation: 0,
    flipped: false
  }))
  
  const allPieces = [...bag, ...decoyPieces]
  shuffleArray(allPieces)
  
  return allPieces
}

export function generateLevel(
  targetSum: number = 30,
  decoyCount: number = 3
): GameLevel | null {
  const solved = generateSolvedBoard()
  if (!solved) return null
  
  try {
    const valuedPieces = assignPieceValues(solved.pieces, targetSum)
    const solutionBag = extractPuzzleBag(valuedPieces)
    
    // Store solution piece IDs and placements before adding decoys
    const solutionPieceIds = solutionBag.map(p => p.id)
    const solutionPlacements = valuedPieces.map(piece => ({
      pieceId: piece.id,
      row: piece.position.y,
      col: piece.position.x,
      rotation: piece.rotation,
      flipped: piece.flipped
    }))
    
    // Calculate final sum and coverage
    const finalSum = valuedPieces.reduce((sum, p) => sum + p.value, 0)
    const cellsCovered = valuedPieces.reduce((sum, p) => sum + p.occupiedCells.length, 0)
    
    // Add decoys to the bag
    const fullBag = addDecoyPieces(solutionBag, decoyCount)
    
    const date = new Date().toISOString().split('T')[0]
    
    return {
      id: date,
      board: { rows: 5, cols: 5 },
      target: targetSum,
      constraints: {
        monomino_cap: 1,
        max_leftovers: decoyCount + 2
      },
      bag: fullBag,
      solution: {
        pieceIds: solutionPieceIds,
        placements: solutionPlacements,
        finalSum,
        cellsCovered
      }
    }
  } catch (error) {
    console.error('Failed to generate level:', error)
    return null
  }
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}