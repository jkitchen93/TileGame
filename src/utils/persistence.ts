import { GameState, GameLevel } from '../types'

interface GameStats {
  totalMoves: number
  undoCount: number
  timeElapsed: number
  hintsUsed: number
  puzzlesSolved: number
  averageMoves: number
  bestTime: number
}

interface SavedGameState {
  version: string
  timestamp: number
  gameState: GameState
  gameStats: GameStats
  moveHistory: any[]
  currentMoveIndex: number
  elapsedTime: number
}

interface UserPreferences {
  soundEnabled: boolean
  animationsEnabled: boolean
  hintFrequency: 'never' | 'rare' | 'normal' | 'frequent'
  theme: 'cozy' | 'minimal' | 'dark'
  autoSave: boolean
}

const STORAGE_KEYS = {
  GAME_STATE: 'cozy_polysum_game',
  USER_PREFERENCES: 'cozy_polysum_preferences',
  STATISTICS: 'cozy_polysum_stats',
  DAILY_PROGRESS: 'cozy_polysum_daily'
} as const

const CURRENT_VERSION = '1.0.0'

const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  animationsEnabled: true,
  hintFrequency: 'normal',
  theme: 'cozy',
  autoSave: true
}

// Game State Persistence
export function saveGameState(
  gameState: GameState,
  gameStats: GameStats,
  moveHistory: any[] = [],
  currentMoveIndex: number = -1,
  elapsedTime: number = 0
): boolean {
  try {
    const savedState: SavedGameState = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      gameState,
      gameStats,
      moveHistory,
      currentMoveIndex,
      elapsedTime
    }

    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(savedState))
    return true
  } catch (error) {
    console.error('Failed to save game state:', error)
    return false
  }
}

export function loadGameState(): SavedGameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE)
    if (!saved) return null

    const parsedState: SavedGameState = JSON.parse(saved)
    
    // Version compatibility check
    if (parsedState.version !== CURRENT_VERSION) {
      console.warn(`Game state version mismatch: ${parsedState.version} vs ${CURRENT_VERSION}`)
      // Could implement migration logic here in the future
      return null
    }

    return parsedState
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

export function clearSavedGame(): void {
  localStorage.removeItem(STORAGE_KEYS.GAME_STATE)
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEYS.GAME_STATE) !== null
}

// User Preferences
export function saveUserPreferences(preferences: Partial<UserPreferences>): boolean {
  try {
    const current = getUserPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('Failed to save user preferences:', error)
    return false
  }
}

export function getUserPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (!saved) return DEFAULT_PREFERENCES

    const parsed = JSON.parse(saved)
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch (error) {
    console.error('Failed to load user preferences:', error)
    return DEFAULT_PREFERENCES
  }
}

// Statistics Persistence
interface GlobalStatistics {
  totalPuzzlesSolved: number
  totalPlayTime: number // in seconds
  totalMoves: number
  averageMovesPerPuzzle: number
  bestTimes: Record<string, number> // level ID -> best time
  hintsUsed: number
  undosUsed: number
  achievementsUnlocked: string[]
  streakCount: number
  lastPlayedDate: string
}

const DEFAULT_STATS: GlobalStatistics = {
  totalPuzzlesSolved: 0,
  totalPlayTime: 0,
  totalMoves: 0,
  averageMovesPerPuzzle: 0,
  bestTimes: {},
  hintsUsed: 0,
  undosUsed: 0,
  achievementsUnlocked: [],
  streakCount: 0,
  lastPlayedDate: ''
}

export function saveGlobalStatistics(stats: Partial<GlobalStatistics>): boolean {
  try {
    const current = getGlobalStatistics()
    const updated = { ...current, ...stats }
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error('Failed to save global statistics:', error)
    return false
  }
}

export function getGlobalStatistics(): GlobalStatistics {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STATISTICS)
    if (!saved) return DEFAULT_STATS

    const parsed = JSON.parse(saved)
    return { ...DEFAULT_STATS, ...parsed }
  } catch (error) {
    console.error('Failed to load global statistics:', error)
    return DEFAULT_STATS
  }
}

export function updateBestTime(levelId: string, timeInSeconds: number): void {
  const stats = getGlobalStatistics()
  const currentBest = stats.bestTimes[levelId]
  
  if (!currentBest || timeInSeconds < currentBest) {
    stats.bestTimes[levelId] = timeInSeconds
    saveGlobalStatistics(stats)
  }
}

export function unlockAchievement(achievementId: string): boolean {
  const stats = getGlobalStatistics()
  
  if (!stats.achievementsUnlocked.includes(achievementId)) {
    stats.achievementsUnlocked.push(achievementId)
    saveGlobalStatistics(stats)
    return true
  }
  
  return false
}

// Daily Progress
interface DailyProgress {
  date: string
  levelId: string
  completed: boolean
  moves: number
  timeSpent: number
  hintsUsed: number
}

export function saveDailyProgress(progress: DailyProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progress))
    return true
  } catch (error) {
    console.error('Failed to save daily progress:', error)
    return false
  }
}

export function getDailyProgress(): DailyProgress | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS)
    if (!saved) return null

    const parsed = JSON.parse(saved)
    
    // Check if it's from today
    const today = new Date().toISOString().split('T')[0]
    if (parsed.date !== today) {
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to load daily progress:', error)
    return null
  }
}

// Auto-save functionality
let autoSaveTimeout: NodeJS.Timeout | null = null

export function scheduleAutoSave(
  gameState: GameState,
  gameStats: GameStats,
  moveHistory: any[] = [],
  currentMoveIndex: number = -1,
  elapsedTime: number = 0
): void {
  const preferences = getUserPreferences()
  if (!preferences.autoSave) return

  // Debounce auto-save to avoid excessive writes
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
  }

  autoSaveTimeout = setTimeout(() => {
    saveGameState(gameState, gameStats, moveHistory, currentMoveIndex, elapsedTime)
  }, 2000) // 2 second delay
}

export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout)
    autoSaveTimeout = null
  }
}

// Data import/export for backup
export function exportGameData(): string {
  const data = {
    gameState: localStorage.getItem(STORAGE_KEYS.GAME_STATE),
    preferences: localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
    statistics: localStorage.getItem(STORAGE_KEYS.STATISTICS),
    dailyProgress: localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS),
    exportDate: new Date().toISOString(),
    version: CURRENT_VERSION
  }
  
  return JSON.stringify(data, null, 2)
}

export function importGameData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)
    
    // Version check
    if (data.version && data.version !== CURRENT_VERSION) {
      console.warn(`Import data version mismatch: ${data.version} vs ${CURRENT_VERSION}`)
    }
    
    // Import each piece of data
    if (data.gameState) {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, data.gameState)
    }
    if (data.preferences) {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, data.preferences)
    }
    if (data.statistics) {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, data.statistics)
    }
    if (data.dailyProgress) {
      localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, data.dailyProgress)
    }
    
    return true
  } catch (error) {
    console.error('Failed to import game data:', error)
    return false
  }
}

// Storage cleanup
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}