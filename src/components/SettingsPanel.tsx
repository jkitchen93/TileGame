import React from 'react'
import { GameModal } from './GameModal'
import { 
  useSettingsStore,
  useSettingsActions,
  useTheme,
  useSoundEnabled,
  useAnimationsEnabled,
  useHintFrequency,
  useAutoSave,
  useReducedMotion,
  useHighContrast
} from '../stores/settingsStore'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onShowTutorial: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onShowTutorial
}) => {
  const {
    updateSettings,
    resetToDefaults,
    toggleSound,
    toggleAnimations,
    setHintFrequency,
    setTheme,
    resetTutorial
  } = useSettingsActions()

  const theme = useTheme()
  const soundEnabled = useSoundEnabled()
  const animationsEnabled = useAnimationsEnabled()
  const hintFrequency = useHintFrequency()
  const autoSave = useAutoSave()
  const reducedMotion = useReducedMotion()
  const highContrast = useHighContrast()

  const handleShowTutorial = () => {
    resetTutorial()
    onShowTutorial()
    onClose()
  }

  const handleExportData = () => {
    // This would trigger the export functionality from persistence
    const dataStr = localStorage.getItem('cozy_polysum_game') || '{}'
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `cozy-polysum-backup-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string
            localStorage.setItem('cozy_polysum_game', data)
            alert('Game data imported successfully! Please refresh the page.')
          } catch (error) {
            alert('Failed to import game data. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    
    input.click()
  }

  return (
    <GameModal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="medium"
    >
      <div className="space-y-6">
        
        {/* Theme Settings */}
        <section>
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Appearance</h3>
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="bg-white border border-purple-200 rounded-cozy px-3 py-2 text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="cozy">Cozy (Default)</option>
                <option value="minimal">Minimal</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">Animations</label>
              <button
                onClick={toggleAnimations}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  animationsEnabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">Reduced Motion</label>
              <button
                onClick={() => updateSettings({ reducedMotion: !reducedMotion })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  reducedMotion ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">High Contrast</label>
              <button
                onClick={() => updateSettings({ highContrast: !highContrast })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  highContrast ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Audio Settings */}
        <section>
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Audio</h3>
          <div className="flex justify-between items-center">
            <label className="text-purple-700 font-medium">Sound Effects</label>
            <button
              onClick={toggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                soundEnabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Gameplay Settings */}
        <section>
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Gameplay</h3>
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">Hint Frequency</label>
              <select
                value={hintFrequency}
                onChange={(e) => setHintFrequency(e.target.value as any)}
                className="bg-white border border-purple-200 rounded-cozy px-3 py-2 text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="never">Never</option>
                <option value="rare">Rare</option>
                <option value="normal">Normal</option>
                <option value="frequent">Frequent</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-purple-700 font-medium">Auto-save</label>
              <button
                onClick={() => updateSettings({ autoSave: !autoSave })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  autoSave ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Help & Tutorial */}
        <section>
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Help</h3>
          <div className="space-y-2">
            <button
              onClick={handleShowTutorial}
              className="w-full text-left px-4 py-3 bg-pastel-blue-50 hover:bg-pastel-blue-100 border border-blue-200 rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">Show Tutorial</span>
                <span className="text-2xl">🎓</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Learn how to play Cozy PolySum
              </p>
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Data</h3>
          <div className="space-y-2">
            <button
              onClick={handleExportData}
              className="w-full text-left px-4 py-3 bg-pastel-green-50 hover:bg-pastel-green-100 border border-green-200 rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">Export Game Data</span>
                <span className="text-2xl">💾</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Backup your progress and settings
              </p>
            </button>

            <button
              onClick={handleImportData}
              className="w-full text-left px-4 py-3 bg-pastel-yellow-50 hover:bg-pastel-yellow-100 border border-yellow-200 rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-yellow-800 font-medium">Import Game Data</span>
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Restore from a backup file
              </p>
            </button>
          </div>
        </section>

        {/* Reset Settings */}
        <section className="pt-4 border-t border-purple-200">
          <button
            onClick={resetToDefaults}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <div className="flex items-center justify-center">
              <span className="text-red-800 font-medium">Reset to Defaults</span>
              <span className="text-2xl ml-2">🔄</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Restore all settings to their default values
            </p>
          </button>
        </section>

        {/* App Info */}
        <section className="pt-4 border-t border-purple-200 text-center text-sm text-purple-600">
          <p>Cozy PolySum v1.0.0</p>
          <p>Made with ❤️ for puzzle lovers</p>
        </section>
      </div>
    </GameModal>
  )
}

export default SettingsPanel