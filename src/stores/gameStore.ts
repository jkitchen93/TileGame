import { create } from 'zustand'
import { GameState, GameLevel, GamePiece } from '../types'
import { 
  isValidPlacement, 
  placePieceOnBoard, 
  removePieceFromBoard, 
  getBoardCoverage, 
  calculateSum, 
  countMonominoes, 
  isWinCondition 
} from '../utils/placement'

interface GameStore extends GameState {
  loadLevel: (level: GameLevel) => void
  placePiece: (piece: GamePiece, row: number, col: number) => boolean
  returnPieceToTray: (pieceId: string) => void
  transformPiece: (pieceId: string, rotate?: boolean, flip?: boolean) => void
  resetGame: () => void
  updateGameState: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  level: null,
  board: [],
  placedPieces: [],
  trayPieces: [],
  currentSum: 0,
  coveredCells: 0,
  monominoCount: 0,
  isWon: false,

  loadLevel: (level: GameLevel) => {
    const board = Array(5)
      .fill(null)
      .map((_, row) =>
        Array(5)
          .fill(null)
          .map((_, col) => ({ row, col }))
      )

    set({
      level,
      board,
      trayPieces: [...level.bag],
      placedPieces: [],
      currentSum: 0,
      coveredCells: 0,
      monominoCount: 0,
      isWon: false,
    })
  },

  placePiece: (piece: GamePiece, row: number, col: number) => {
    const state = get()
    
    if (!state.level) return false
    
    const placementResult = isValidPlacement(
      piece,
      row,
      col,
      state.board,
      state.placedPieces,
      state.monominoCount
    )
    
    if (!placementResult.valid) {
      console.warn('Invalid placement:', placementResult.reason)
      return false
    }
    
    const newBoard = placePieceOnBoard(state.board, piece, row, col)
    const newPlacedPieces = [...state.placedPieces, piece]
    const newTrayPieces = state.trayPieces.filter(p => p.id !== piece.id)
    
    const newMonominoCount = countMonominoes(newPlacedPieces)
    const newCurrentSum = calculateSum(newPlacedPieces)
    const newCoveredCells = getBoardCoverage(newBoard)
    const newIsWon = isWinCondition(newBoard, newPlacedPieces, state.level.target)
    
    set({
      board: newBoard,
      placedPieces: newPlacedPieces,
      trayPieces: newTrayPieces,
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon
    })
    
    return true
  },

  returnPieceToTray: (pieceId: string) => {
    const state = get()
    const piece = state.placedPieces.find((p) => p.id === pieceId)
    if (!piece) return

    const newBoard = removePieceFromBoard(state.board, pieceId)
    const newPlacedPieces = state.placedPieces.filter((p) => p.id !== pieceId)
    const newTrayPieces = [...state.trayPieces, piece]
    
    const newMonominoCount = countMonominoes(newPlacedPieces)
    const newCurrentSum = calculateSum(newPlacedPieces)
    const newCoveredCells = getBoardCoverage(newBoard)
    const newIsWon = state.level ? isWinCondition(newBoard, newPlacedPieces, state.level.target) : false

    set({
      board: newBoard,
      placedPieces: newPlacedPieces,
      trayPieces: newTrayPieces,
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon
    })
  },

  transformPiece: (pieceId: string, rotate = false, flip = false) => {
    const state = get()
    const updatePieces = (pieces: GamePiece[]) =>
      pieces.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              rotation: rotate ? (p.rotation + 90) % 360 : p.rotation,
              flipped: flip ? !p.flipped : p.flipped,
            }
          : p
      )

    set({
      trayPieces: updatePieces(state.trayPieces),
      placedPieces: updatePieces(state.placedPieces),
    })
  },

  resetGame: () => {
    const state = get()
    if (state.level) {
      get().loadLevel(state.level)
    }
  },

  updateGameState: () => {
    const state = get()
    if (!state.level) return

    const newMonominoCount = countMonominoes(state.placedPieces)
    const newCurrentSum = calculateSum(state.placedPieces)
    const newCoveredCells = getBoardCoverage(state.board)
    const newIsWon = isWinCondition(state.board, state.placedPieces, state.level.target)

    set({
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon
    })
  },
}))