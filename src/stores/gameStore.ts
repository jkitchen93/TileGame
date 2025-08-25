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
import { transformGrabPoint } from '../utils/grabPoint'

interface GameStore extends GameState {
  // Enhanced state
  lastMoveValid: boolean
  lastMoveMessage: string
  moveCount: number
  
  // Click-to-pickup state
  pickedUpPiece: GamePiece | null
  pickedUpPieceSource: 'board' | 'tray' | null
  grabPoint: { cellX: number, cellY: number } | null
  
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
  
  // Click-to-pickup actions
  pickUpPiece: (piece: GamePiece, grabPoint?: { cellX: number, cellY: number }) => void
  pickUpPlacedPiece: (pieceId: string, grabPoint?: { cellX: number, cellY: number }) => void
  cancelPickup: () => void
  returnPickedUpPieceToTray: () => void
  isPickedUp: (pieceId: string) => boolean
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
  pickedUpPiece: null,
  pickedUpPieceSource: null,
  grabPoint: null,

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
      pickedUpPiece: null,
      pickedUpPieceSource: null,
      grabPoint: null,
    })
  },

  placePiece: (piece: GamePiece, row: number, col: number) => {
    const state = get()
    
    if (!state.level) return false
    
    // Defensive check: ensure piece exists and is valid
    if (!piece || !piece.id) {
      console.warn('Invalid piece provided to placePiece:', piece)
      return false
    }
    
    // Check if piece is being repositioned - use both source tracking AND piece existence check
    // This handles both UI-driven placement and programmatic placement scenarios
    const isRepositioning = state.pickedUpPieceSource === 'board' || state.placedPieces.some(p => p.id === piece.id)
    
    // For validation, exclude the piece if it's being repositioned
    const validationPlacedPieces = isRepositioning 
      ? state.placedPieces.filter(p => p.id !== piece.id)
      : state.placedPieces
    
    // Enhanced validation using new game rules
    const ruleCheck = validateGameRules(piece, row, col, state.board, validationPlacedPieces, state.level)
    const feedback = generateMoveValidationFeedback(ruleCheck)
    
    if (!ruleCheck.valid) {
      set({
        lastMoveValid: false,
        lastMoveMessage: feedback.message
      })
      return false
    }
    
    // Atomic state update: prepare all new state before setting
    const newBoard = placePieceOnBoard(state.board, piece, row, col)
    
    // Create PlacedPiece with position and occupied cells
    const placedPiece: PlacedPiece = {
      ...piece,
      position: { x: col, y: row },
      occupiedCells: getOccupiedCells(piece, row, col)
    }
    
    // Update placed pieces: remove old position if repositioning, then add new position
    // This prevents duplicates and handles all placement scenarios
    const newPlacedPieces = isRepositioning
      ? [...state.placedPieces.filter(p => p.id !== piece.id), placedPiece]
      : [...state.placedPieces, placedPiece]
    
    // Update tray pieces: only remove if piece came from tray (not repositioning)
    const newTrayPieces = isRepositioning
      ? state.trayPieces
      : state.trayPieces.filter(p => p.id !== piece.id)
    
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
      moveCount: newMoveCount,
      pickedUpPiece: null, // Clear picked up piece when placing
      pickedUpPieceSource: null, // Clear source when placing
      grabPoint: null, // Clear grab point when placing
    }
    
    // Verify the new state is consistent before setting
    if (newPlacedPieces.length > state.level.bag.length) {
      console.error('State inconsistency detected: more placed pieces than bag pieces')
      return false
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
    
    // Defensive check: ensure piece ID is valid
    if (!pieceId) {
      console.warn('Invalid pieceId provided to returnPieceToTray:', pieceId)
      return
    }
    
    const placedPiece = state.placedPieces.find((p) => p.id === pieceId)
    if (!placedPiece) {
      console.warn('Piece not found in placed pieces:', pieceId)
      return
    }

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

    // Store old values for grab point transformation
    const oldRotation = state.pickedUpPiece?.rotation ?? 0
    const oldFlipped = state.pickedUpPiece?.flipped ?? false

    // Also update picked up piece if it matches
    const updatedPickedUpPiece = state.pickedUpPiece?.id === pieceId
      ? {
          ...state.pickedUpPiece,
          rotation: rotate ? (state.pickedUpPiece.rotation + 90) % 360 : state.pickedUpPiece.rotation,
          flipped: flip ? !state.pickedUpPiece.flipped : state.pickedUpPiece.flipped,
        }
      : state.pickedUpPiece

    // Transform grab point if we have one and we're transforming the picked up piece
    const updatedGrabPoint = state.grabPoint && state.pickedUpPiece?.id === pieceId && updatedPickedUpPiece
      ? transformGrabPoint(state.grabPoint, updatedPickedUpPiece, oldRotation, oldFlipped)
      : state.grabPoint

    set({
      trayPieces: updateGamePieces(state.trayPieces),
      placedPieces: updatePlacedPieces(state.placedPieces),
      pickedUpPiece: updatedPickedUpPiece,
      grabPoint: updatedGrabPoint,
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
  },

  // Click-to-pickup implementation
  pickUpPiece: (piece: GamePiece, grabPoint?: { cellX: number, cellY: number }) => {
    set({ 
      pickedUpPiece: piece,
      pickedUpPieceSource: 'tray' as 'tray',
      grabPoint: grabPoint || null
    })
  },

  pickUpPlacedPiece: (pieceId: string, grabPoint?: { cellX: number, cellY: number }) => {
    const state = get()
    
    // Defensive check: ensure piece ID is valid
    if (!pieceId) {
      console.warn('Invalid pieceId provided to pickUpPlacedPiece:', pieceId)
      return
    }
    
    const placedPiece = state.placedPieces.find((p) => p.id === pieceId)
    if (!placedPiece) {
      console.warn('Piece not found in placed pieces:', pieceId)
      return
    }

    // Remove from board and placed pieces
    const newBoard = removePieceFromBoard(state.board, pieceId)
    const newPlacedPieces = state.placedPieces.filter((p) => p.id !== pieceId)
    
    // Convert PlacedPiece back to GamePiece and set as picked up
    const gamePiece: GamePiece = {
      id: placedPiece.id,
      shape: placedPiece.shape,
      value: placedPiece.value,
      rotation: placedPiece.rotation,
      flipped: placedPiece.flipped
    }
    
    // Update game state
    const newMonominoCount = countMonominoes(newPlacedPieces)
    const newCurrentSum = calculateSum(newPlacedPieces)
    const newCoveredCells = getBoardCoverage(newBoard)
    const newIsWon = state.level ? isWinCondition(newBoard, newPlacedPieces, state.level.target) : false
    const newMoveCount = state.moveCount + 1

    const newState = {
      board: newBoard,
      placedPieces: newPlacedPieces,
      currentSum: newCurrentSum,
      coveredCells: newCoveredCells,
      monominoCount: newMonominoCount,
      isWon: newIsWon,
      moveCount: newMoveCount,
      pickedUpPiece: gamePiece,
      pickedUpPieceSource: 'board' as 'board',
      grabPoint: grabPoint || null,
      lastMoveValid: true,
      lastMoveMessage: 'Piece picked up from board'
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

  cancelPickup: () => {
    set({ 
      pickedUpPiece: null,
      pickedUpPieceSource: null,
      grabPoint: null
    })
  },

  returnPickedUpPieceToTray: () => {
    const state = get()
    if (!state.pickedUpPiece) return

    // Check if the piece is already in the tray (was picked up from tray)
    const isInTray = state.trayPieces.some(p => p.id === state.pickedUpPiece!.id)
    
    if (!isInTray) {
      // Piece was picked up from the board, add it to tray
      const newTrayPieces = [...state.trayPieces, state.pickedUpPiece]
      set({
        trayPieces: newTrayPieces,
        pickedUpPiece: null,
        pickedUpPieceSource: null,
        grabPoint: null,
        lastMoveValid: true,
        lastMoveMessage: 'Piece returned to tray'
      })
    } else {
      // Piece was from tray, just cancel pickup
      set({ 
        pickedUpPiece: null,
        pickedUpPieceSource: null,
        grabPoint: null
      })
    }
  },

  isPickedUp: (pieceId: string) => {
    const state = get()
    return state.pickedUpPiece?.id === pieceId
  }
}))