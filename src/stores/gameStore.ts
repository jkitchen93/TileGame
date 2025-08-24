import { create } from 'zustand'
import { GameState, GameLevel, GamePiece, PlacedPiece } from '../types'
import { 
  placePieceOnBoard, 
  removePieceFromBoard, 
  getBoardCoverage, 
  calculateSum, 
  countMonominoes, 
  isWinCondition,
  getOccupiedCells
} from '../utils/placement'
import { analyzeWinCondition } from '../utils/winConditions'
import { validateGameRules, generateMoveValidationFeedback } from '../utils/gameRules'
import { scheduleAutoSave } from '../utils/persistence'

interface GameStore extends GameState {
  // Enhanced state
  lastMoveValid: boolean
  lastMoveMessage: string
  moveCount: number
  
  // Actions
  loadLevel: (level: GameLevel) => void
  placePiece: (piece: GamePiece, row: number, col: number) => boolean
  returnPieceToTray: (pieceId: string) => void
  transformPiece: (pieceId: string, rotate?: boolean, flip?: boolean) => void
  resetGame: () => void
  updateGameState: () => void
  
  // Enhanced actions
  validatePlacement: (piece: GamePiece, row: number, col: number) => { valid: boolean; message: string }
  getGameAnalysis: () => ReturnType<typeof analyzeWinCondition> | null
  incrementMoveCount: () => void
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
  lastMoveValid: true,
  lastMoveMessage: '',
  moveCount: 0,

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
      lastMoveValid: true,
      lastMoveMessage: '',
      moveCount: 0,
    })
  },

  placePiece: (piece: GamePiece, row: number, col: number) => {
    const state = get()
    
    if (!state.level) return false
    
    // Enhanced validation using new game rules
    const ruleCheck = validateGameRules(piece, row, col, state.board, state.placedPieces, state.level)
    const feedback = generateMoveValidationFeedback(ruleCheck)
    
    if (!ruleCheck.valid) {
      set({
        lastMoveValid: false,
        lastMoveMessage: feedback.message
      })
      return false
    }
    
    const newBoard = placePieceOnBoard(state.board, piece, row, col)
    
    // Create PlacedPiece with position and occupied cells
    const placedPiece: PlacedPiece = {
      ...piece,
      position: { x: col, y: row },
      occupiedCells: getOccupiedCells(piece, row, col)
    }
    
    const newPlacedPieces = [...state.placedPieces, placedPiece]
    const newTrayPieces = state.trayPieces.filter(p => p.id !== piece.id)
    
    const newMonominoCount = countMonominoes(newPlacedPieces)
    const newCurrentSum = calculateSum(newPlacedPieces)
    const newCoveredCells = getBoardCoverage(newBoard)
    const newIsWon = isWinCondition(newBoard, newPlacedPieces, state.level.target)
    const newMoveCount = state.moveCount + 1
    
    const newState = {
      board: newBoard,
      placedPieces: newPlacedPieces,
      trayPieces: newTrayPieces,
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon,
      lastMoveValid: true,
      lastMoveMessage: feedback.message,
      moveCount: newMoveCount
    }
    
    set(newState)
    
    // Schedule auto-save with enhanced state
    scheduleAutoSave(
      { ...state, ...newState }, // Full game state
      { totalMoves: newMoveCount, undoCount: 0, timeElapsed: 0, hintsUsed: 0, puzzlesSolved: 0, averageMoves: 0, bestTime: 0 }, // Basic stats
      [], // Move history (would come from game flow store)
      -1, // Current move index
      0 // Elapsed time
    )
    
    return true
  },

  returnPieceToTray: (pieceId: string) => {
    const state = get()
    const placedPiece = state.placedPieces.find((p) => p.id === pieceId)
    if (!placedPiece) return

    const newBoard = removePieceFromBoard(state.board, pieceId)
    const newPlacedPieces = state.placedPieces.filter((p) => p.id !== pieceId)
    
    // Convert PlacedPiece back to GamePiece for the tray
    const gamePiece: GamePiece = {
      id: placedPiece.id,
      shape: placedPiece.shape,
      value: placedPiece.value,
      rotation: placedPiece.rotation,
      flipped: placedPiece.flipped
    }
    const newTrayPieces = [...state.trayPieces, gamePiece]
    
    const newMonominoCount = countMonominoes(newPlacedPieces)
    const newCurrentSum = calculateSum(newPlacedPieces)
    const newCoveredCells = getBoardCoverage(newBoard)
    const newIsWon = state.level ? isWinCondition(newBoard, newPlacedPieces, state.level.target) : false
    const newMoveCount = state.moveCount + 1

    const newState = {
      board: newBoard,
      placedPieces: newPlacedPieces,
      trayPieces: newTrayPieces,
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon,
      moveCount: newMoveCount,
      lastMoveValid: true,
      lastMoveMessage: 'Piece returned to tray'
    }

    set(newState)
    
    // Schedule auto-save
    scheduleAutoSave(
      { ...state, ...newState },
      { totalMoves: newMoveCount, undoCount: 0, timeElapsed: 0, hintsUsed: 0, puzzlesSolved: 0, averageMoves: 0, bestTime: 0 },
      [],
      -1,
      0
    )
  },

  transformPiece: (pieceId: string, rotate = false, flip = false) => {
    const state = get()
    
    const updateGamePieces = (pieces: GamePiece[]) =>
      pieces.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              rotation: rotate ? (p.rotation + 90) % 360 : p.rotation,
              flipped: flip ? !p.flipped : p.flipped,
            }
          : p
      )
    
    const updatePlacedPieces = (pieces: PlacedPiece[]) =>
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
      trayPieces: updateGamePieces(state.trayPieces),
      placedPieces: updatePlacedPieces(state.placedPieces),
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

  validatePlacement: (piece: GamePiece, row: number, col: number) => {
    const state = get()
    if (!state.level) return { valid: false, message: 'No level loaded' }
    
    const ruleCheck = validateGameRules(piece, row, col, state.board, state.placedPieces, state.level)
    const feedback = generateMoveValidationFeedback(ruleCheck)
    
    return {
      valid: ruleCheck.valid,
      message: feedback.message
    }
  },

  getGameAnalysis: () => {
    const state = get()
    if (!state.level) return null
    
    return analyzeWinCondition(state.board, state.placedPieces, state.level.target)
  },

  incrementMoveCount: () => {
    const state = get()
    set({ moveCount: state.moveCount + 1 })
  }
}))