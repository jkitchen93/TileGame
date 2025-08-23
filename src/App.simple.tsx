import { useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import { GameBoard, GameHUD, PieceTray } from './components'
import { GameLevel } from './types'

// Sample level for testing
const sampleLevel: GameLevel = {
  id: "2025-08-23-sample",
  board: { rows: 5, cols: 5 },
  target: 28,
  constraints: { monomino_cap: 1, max_leftovers: 3 },
  bag: [
    { id: "p1", shape: "T4", value: 4, rotation: 0, flipped: false },
    { id: "p2", shape: "L4", value: 3, rotation: 0, flipped: false },
    { id: "p3", shape: "I4", value: 5, rotation: 0, flipped: false },
    { id: "p4", shape: "O4", value: 2, rotation: 0, flipped: false },
    { id: "p5", shape: "S4", value: 3, rotation: 0, flipped: false },
    { id: "p6", shape: "I3", value: 2, rotation: 0, flipped: false },
    { id: "p7", shape: "L3", value: 2, rotation: 0, flipped: false },
    { id: "p8", shape: "I2", value: 1, rotation: 0, flipped: false },
    { id: "p9", shape: "I2", value: 1, rotation: 0, flipped: false },
    { id: "p10", shape: "I1", value: 5, rotation: 0, flipped: false },
  ]
}

function App() {
  const { loadLevel } = useGameStore()

  // Load sample level on app start
  useEffect(() => {
    loadLevel(sampleLevel)
  }, [loadLevel])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100">
      {/* Header */}
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">Cozy PolySum</h1>
        <p className="text-lg text-purple-600">Daily Puzzle Game</p>
      </header>

      {/* Main game layout */}
      <main className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          
          {/* Left sidebar - Game HUD */}
          <div className="xl:col-span-1 space-y-6">
            <GameHUD />
          </div>

          {/* Center - Game Board */}
          <div className="xl:col-span-1 flex justify-center">
            <div className="text-center p-8 bg-white rounded-cozy-lg shadow-cozy">
              <p>Board placeholder - DnD temporarily disabled for testing</p>
            </div>
          </div>

          {/* Right sidebar - Piece Tray */}
          <div className="xl:col-span-1">
            <PieceTray />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App