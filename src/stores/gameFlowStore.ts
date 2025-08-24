import { create } from 'zustand'
import { GameState, GameLevel, GamePiece } from '../types'
import { analyzeWinCondition, WinAnalysis } from '../utils/winConditions'
import { validateGameRules, GameRuleCheck } from '../utils/gameRules'

interface GameMove {
  id: string
  timestamp: number
  type: 'place' | 'remove' | 'transform'
  piece: GamePiece
  position?: { row: number; col: number }
  previousState: GameState
}

interface GameStats {
  totalMoves: number
  undoCount: number
  timeElapsed: number
  hintsUsed: number
  puzzlesSolved: number
  averageMoves: number
  bestTime: number
}

interface GameFlowState {
  // Game flow
  gameStats: GameStats
  moveHistory: GameMove[]
  currentMoveIndex: number
  isPaused: boolean
  startTime: number | null
  lastHintTime: number | null
  
  // Analysis
  currentAnalysis: WinAnalysis | null
  lastRuleCheck: GameRuleCheck | null
  
  // Actions
  startGame: (level: GameLevel) => void
  recordMove: (move: Omit<GameMove, 'id' | 'timestamp'>) => void
  undoMove: () => boolean
  redoMove: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
  pauseGame: () => void
  resumeGame: () => void
  updateAnalysis: (gameState: GameState) => void
  setRuleCheck: (ruleCheck: GameRuleCheck) => void
  useHint: () => void
  resetStats: () => void
  getElapsedTime: () => number
}

const initialStats: GameStats = {
  totalMoves: 0,
  undoCount: 0,
  timeElapsed: 0,
  hintsUsed: 0,
  puzzlesSolved: 0,
  averageMoves: 0,
  bestTime: 0
}

export const useGameFlowStore = create<GameFlowState>((set, get) => ({
  gameStats: initialStats,
  moveHistory: [],
  currentMoveIndex: -1,
  isPaused: false,
  startTime: null,
  lastHintTime: null,
  currentAnalysis: null,
  lastRuleCheck: null,

  startGame: (level: GameLevel) => {
    const now = Date.now()
    set({
      startTime: now,
      moveHistory: [],
      currentMoveIndex: -1,
      isPaused: false,
      currentAnalysis: null,
      lastRuleCheck: null,
      gameStats: {
        ...get().gameStats,
        totalMoves: 0,
        timeElapsed: 0
      }
    })
  },

  recordMove: (moveData) => {
    const state = get()
    const move: GameMove = {
      ...moveData,
      id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    // Remove any moves after current index (for redo functionality)
    const newHistory = [
      ...state.moveHistory.slice(0, state.currentMoveIndex + 1),
      move
    ]

    set({
      moveHistory: newHistory,
      currentMoveIndex: newHistory.length - 1,
      gameStats: {
        ...state.gameStats,
        totalMoves: state.gameStats.totalMoves + 1
      }
    })
  },

  undoMove: () => {
    const state = get()
    if (state.currentMoveIndex >= 0) {
      set({
        currentMoveIndex: state.currentMoveIndex - 1,
        gameStats: {
          ...state.gameStats,
          undoCount: state.gameStats.undoCount + 1
        }
      })
      return true
    }
    return false
  },

  redoMove: () => {
    const state = get()
    if (state.currentMoveIndex < state.moveHistory.length - 1) {
      set({
        currentMoveIndex: state.currentMoveIndex + 1
      })
      return true
    }
    return false
  },

  canUndo: () => {
    return get().currentMoveIndex >= 0
  },

  canRedo: () => {
    const state = get()
    return state.currentMoveIndex < state.moveHistory.length - 1
  },

  pauseGame: () => {
    const state = get()
    if (state.startTime && !state.isPaused) {
      const elapsed = Date.now() - state.startTime
      set({
        isPaused: true,
        gameStats: {
          ...state.gameStats,
          timeElapsed: state.gameStats.timeElapsed + elapsed
        }
      })
    }
  },

  resumeGame: () => {
    set({
      isPaused: false,
      startTime: Date.now()
    })
  },

  updateAnalysis: (gameState: GameState) => {
    if (!gameState.level) return

    const analysis = analyzeWinCondition(
      gameState.board,
      gameState.placedPieces,
      gameState.level.target
    )

    set({ currentAnalysis: analysis })

    // Update stats if puzzle is solved
    if (analysis.winState.isWon && !get().currentAnalysis?.winState.isWon) {
      const state = get()
      const currentTime = get().getElapsedTime()
      
      set({
        gameStats: {
          ...state.gameStats,
          puzzlesSolved: state.gameStats.puzzlesSolved + 1,
          averageMoves: Math.round(
            (state.gameStats.averageMoves * (state.gameStats.puzzlesSolved - 1) + state.gameStats.totalMoves) / 
            state.gameStats.puzzlesSolved
          ),
          bestTime: state.gameStats.bestTime === 0 ? currentTime : Math.min(state.gameStats.bestTime, currentTime)
        }
      })
    }
  },

  setRuleCheck: (ruleCheck: GameRuleCheck) => {
    set({ lastRuleCheck: ruleCheck })
  },

  useHint: () => {
    const state = get()
    set({
      lastHintTime: Date.now(),
      gameStats: {
        ...state.gameStats,
        hintsUsed: state.gameStats.hintsUsed + 1
      }
    })
  },

  resetStats: () => {
    set({ gameStats: { ...initialStats } })
  },

  getElapsedTime: () => {
    const state = get()
    if (!state.startTime) return 0
    
    let elapsed = state.gameStats.timeElapsed
    if (!state.isPaused) {
      elapsed += Date.now() - state.startTime
    }
    
    return Math.floor(elapsed / 1000) // Return seconds
  }
}))

// Helper hooks for common operations
export const useCanUndo = () => useGameFlowStore(state => state.canUndo())
export const useCanRedo = () => useGameFlowStore(state => state.canRedo())
export const useGameStats = () => useGameFlowStore(state => state.gameStats)
export const useCurrentAnalysis = () => useGameFlowStore(state => state.currentAnalysis)
export const useLastRuleCheck = () => useGameFlowStore(state => state.lastRuleCheck)
export const useElapsedTime = () => useGameFlowStore(state => state.getElapsedTime())

// Action hooks
export const useGameFlowActions = () => {
  const store = useGameFlowStore()
  return {
    startGame: store.startGame,
    recordMove: store.recordMove,
    undoMove: store.undoMove,
    redoMove: store.redoMove,
    pauseGame: store.pauseGame,
    resumeGame: store.resumeGame,
    updateAnalysis: store.updateAnalysis,
    setRuleCheck: store.setRuleCheck,
    useHint: store.useHint,
    resetStats: store.resetStats
  }
}