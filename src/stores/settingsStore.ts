import { create } from 'zustand'
import { getUserPreferences, saveUserPreferences } from '../utils/persistence'

interface UserPreferences {
  soundEnabled: boolean
  animationsEnabled: boolean
  hintFrequency: 'never' | 'rare' | 'normal' | 'frequent'
  theme: 'cozy' | 'minimal' | 'dark'
  autoSave: boolean
  showTutorial: boolean
  reducedMotion: boolean
  highContrast: boolean
}

interface SettingsState extends UserPreferences {
  // Actions
  updateSettings: (settings: Partial<UserPreferences>) => void
  resetToDefaults: () => void
  toggleSound: () => void
  toggleAnimations: () => void
  setHintFrequency: (frequency: UserPreferences['hintFrequency']) => void
  setTheme: (theme: UserPreferences['theme']) => void
  completeTutorial: () => void
  resetTutorial: () => void
}

const defaultSettings: UserPreferences = {
  soundEnabled: true,
  animationsEnabled: true,
  hintFrequency: 'normal',
  theme: 'cozy',
  autoSave: true,
  showTutorial: true,
  reducedMotion: false,
  highContrast: false
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Load initial settings from localStorage
  const savedSettings = getUserPreferences()
  const initialSettings = { ...defaultSettings, ...savedSettings }

  return {
    ...initialSettings,

    updateSettings: (newSettings) => {
      const currentSettings = get()
      const updatedSettings = { ...currentSettings, ...newSettings }
      
      // Extract only the preference properties for saving
      const preferencesToSave: UserPreferences = {
        soundEnabled: updatedSettings.soundEnabled,
        animationsEnabled: updatedSettings.animationsEnabled,
        hintFrequency: updatedSettings.hintFrequency,
        theme: updatedSettings.theme,
        autoSave: updatedSettings.autoSave,
        showTutorial: updatedSettings.showTutorial,
        reducedMotion: updatedSettings.reducedMotion,
        highContrast: updatedSettings.highContrast
      }
      
      saveUserPreferences(preferencesToSave)
      set(updatedSettings)
      
      // Apply theme changes immediately
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
      
      // Apply accessibility settings
      if (newSettings.reducedMotion !== undefined) {
        applyReducedMotion(newSettings.reducedMotion)
      }
      
      if (newSettings.highContrast !== undefined) {
        applyHighContrast(newSettings.highContrast)
      }
    },

    resetToDefaults: () => {
      saveUserPreferences(defaultSettings)
      set(defaultSettings)
      applyTheme(defaultSettings.theme)
      applyReducedMotion(defaultSettings.reducedMotion)
      applyHighContrast(defaultSettings.highContrast)
    },

    toggleSound: () => {
      const current = get()
      const newValue = !current.soundEnabled
      get().updateSettings({ soundEnabled: newValue })
    },

    toggleAnimations: () => {
      const current = get()
      const newValue = !current.animationsEnabled
      get().updateSettings({ animationsEnabled: newValue })
    },

    setHintFrequency: (frequency) => {
      get().updateSettings({ hintFrequency: frequency })
    },

    setTheme: (theme) => {
      get().updateSettings({ theme })
    },

    completeTutorial: () => {
      get().updateSettings({ showTutorial: false })
    },

    resetTutorial: () => {
      get().updateSettings({ showTutorial: true })
    }
  }
})

// Apply theme to document
function applyTheme(theme: UserPreferences['theme']) {
  const root = document.documentElement
  
  // Remove existing theme classes
  root.classList.remove('theme-cozy', 'theme-minimal', 'theme-dark')
  
  // Apply new theme
  root.classList.add(`theme-${theme}`)
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    const themeColors = {
      cozy: '#f3e8ff', // pastel purple
      minimal: '#f9fafb', // light gray
      dark: '#111827' // dark gray
    }
    metaThemeColor.setAttribute('content', themeColors[theme])
  }
}

// Apply reduced motion preference
function applyReducedMotion(enabled: boolean) {
  if (enabled) {
    document.documentElement.style.setProperty('--animation-duration', '0s')
    document.documentElement.style.setProperty('--transition-duration', '0s')
  } else {
    document.documentElement.style.removeProperty('--animation-duration')
    document.documentElement.style.removeProperty('--transition-duration')
  }
}

// Apply high contrast mode
function applyHighContrast(enabled: boolean) {
  const root = document.documentElement
  
  if (enabled) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }
}

// Initialize theme on load
export function initializeTheme() {
  const settings = getUserPreferences()
  applyTheme(settings.theme || 'cozy')
  applyReducedMotion(settings.reducedMotion || false)
  applyHighContrast(settings.highContrast || false)
}

// Convenience hooks
export const useTheme = () => useSettingsStore(state => state.theme)
export const useSoundEnabled = () => useSettingsStore(state => state.soundEnabled)
export const useAnimationsEnabled = () => useSettingsStore(state => state.animationsEnabled)
export const useHintFrequency = () => useSettingsStore(state => state.hintFrequency)
export const useAutoSave = () => useSettingsStore(state => state.autoSave)
export const useShowTutorial = () => useSettingsStore(state => state.showTutorial)
export const useReducedMotion = () => useSettingsStore(state => state.reducedMotion)
export const useHighContrast = () => useSettingsStore(state => state.highContrast)

// Settings actions
export const useSettingsActions = () => {
  const store = useSettingsStore()
  return {
    updateSettings: store.updateSettings,
    resetToDefaults: store.resetToDefaults,
    toggleSound: store.toggleSound,
    toggleAnimations: store.toggleAnimations,
    setHintFrequency: store.setHintFrequency,
    setTheme: store.setTheme,
    completeTutorial: store.completeTutorial,
    resetTutorial: store.resetTutorial
  }
}