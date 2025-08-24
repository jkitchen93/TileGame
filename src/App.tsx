
import { useEffect, useState } from 'react'
import { useGameStore } from './stores/gameStore'
import { useGameFlowActions, useCurrentAnalysis } from './stores/gameFlowStore'
import { useShowTutorial, useSettingsActions } from './stores/settingsStore'
import { 
  GameBoard, 
  GameHUD, 
  PieceTray,
  CustomDragLayer,
  FloatingPiece,
  WinModal,
  Tutorial,
  SettingsPanel,
  ToastContainer,
  useToast
} from './components'
import { GameLevel } from './types'
import { initializeTheme } from './stores/settingsStore'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// Sample level for testing - in Phase 5 this will come from level generation
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
  const { loadLevel, isWon, moveCount, cancelPickup, returnPickedUpPieceToTray, pickedUpPiece, transformPiece } = useGameStore()
  const { startGame, updateAnalysis } = useGameFlowActions()
  const currentAnalysis = useCurrentAnalysis()
  const showTutorial = useShowTutorial()
  const { } = useSettingsActions()
  
  // Modal states
  const [showWinModal, setShowWinModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // Toast system
  const toast = useToast()

  // Initialize theme on app start
  useEffect(() => {
    initializeTheme()
  }, [])

  // Load sample level and start game flow on app start
  useEffect(() => {
    loadLevel(sampleLevel)
    startGame(sampleLevel)
  }, [loadLevel, startGame])

  // Show tutorial for first-time users
  useEffect(() => {
    if (showTutorial) {
      setShowTutorialModal(true)
    }
  }, [showTutorial])

  // Update analysis when game state changes
  useEffect(() => {
    const gameState = { 
      level: sampleLevel, 
      board: [], 
      placedPieces: [], 
      trayPieces: [], 
      currentSum: 0, 
      coveredCells: 0, 
      monominoCount: 0, 
      isWon 
    }
    updateAnalysis(gameState)
  }, [isWon, updateAnalysis])

  // Show win modal when puzzle is solved
  useEffect(() => {
    if (isWon && !showWinModal) {
      setShowWinModal(true)
      toast.success('Puzzle Solved!', 'Congratulations on completing the puzzle!')
    }
  }, [isWon, showWinModal, toast])

  // Global keyboard handler
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'escape':
        // Cancel picked up piece first, then close modals
        if (pickedUpPiece) {
          cancelPickup()
          e.preventDefault()
        } else {
          // Close any open modals
          setShowWinModal(false)
          setShowSettingsModal(false)
        }
        break
      case 'r':
        // Rotate picked up piece
        if (pickedUpPiece) {
          e.preventDefault()
          transformPiece(pickedUpPiece.id, true, false)
        }
        break
      case 'f':
        // Flip picked up piece
        if (pickedUpPiece) {
          e.preventDefault()
          transformPiece(pickedUpPiece.id, false, true)
        }
        break
      case '?':
      case 'h':
        setShowSettingsModal(true)
        break
      case 't':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setShowTutorialModal(true)
        }
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pickedUpPiece, transformPiece, cancelPickup, returnPickedUpPieceToTray])

  const handlePlayAgain = () => {
    setShowWinModal(false)
    loadLevel(sampleLevel)
    startGame(sampleLevel)
    toast.info('New Game', 'Starting a fresh puzzle!')
  }

  const handleShowTutorial = () => {
    setShowTutorialModal(true)
  }

  const handleTutorialComplete = () => {
    setShowTutorialModal(false)
    toast.success('Tutorial Complete', 'You\'re ready to play!')
  }

  // Handle clicking in the tray area to put pieces back
  const handleTrayAreaClick = (e: React.MouseEvent) => {
    // Only handle if there's a picked up piece
    if (!pickedUpPiece) return
    
    // Check if click is on a piece in tray or on the board - if so, don't handle here
    const target = e.target as HTMLElement
    
    // Don't handle if clicking on a piece or the board
    if (target.closest('[data-board="true"]') || 
        target.closest('[role="button"]') ||
        target.closest('.game-piece')) {
      return
    }
    
    // Put the piece back to tray (handles both tray and board pieces)
    returnPickedUpPieceToTray()
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="min-h-screen flex flex-col items-center p-5 relative overflow-x-hidden"
        style={{
          background: 'linear-gradient(135deg, #fce7f3 0%, #e9d5ff 50%, #dbeafe 100%)',
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* Game Header */}
        <div className="game-header text-center mb-8 z-10 relative">
          <div className="flex justify-between items-start w-full max-w-4xl">
            <div></div> {/* Spacer */}
            
            <div>
              <h1 
                className="text-5xl font-extrabold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 10px rgba(192, 132, 252, 0.2)'
                }}
              >
                Cozy PolySum
              </h1>
              <p className="text-xl text-purple-700 opacity-80 mb-5">Daily Puzzle #42</p>
              
              {/* Inline Score Display */}
              <GameHUD />
            </div>
            
            {/* Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-md hover:shadow-lg"
              aria-label="Settings"
            >
              <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Game Container */}
        <div 
          className="game-container relative w-full max-w-7xl h-[600px] flex justify-center items-center"
          onClick={handleTrayAreaClick}
        >
          {/* Centered Game Board */}
          <GameBoard />
          
          {/* Scattered Pieces */}
          <PieceTray />
        </div>

        {/* Instructions */}
        <div className="instructions mt-8 text-center text-purple-700 opacity-70 text-base">
          <p>Click pieces to pick up • Click board to place • Click tray area to put back • Press R to rotate • Press F to flip • ESC to cancel • Click placed pieces to reposition</p>
        </div>

        {/* Modals */}
        <WinModal
          isOpen={showWinModal}
          onClose={() => setShowWinModal(false)}
          analysis={currentAnalysis || { 
            winState: { isWon: false, hasFullCoverage: false, hasCorrectSum: false, completionPercentage: 0, progressScore: 0 },
            hints: [],
            nextSteps: [],
            achievements: []
          }}
          stats={{
            moves: moveCount,
            timeElapsed: 0,
            hintsUsed: 0,
            undosUsed: 0
          }}
          onPlayAgain={handlePlayAgain}
        />

        <Tutorial
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          onComplete={handleTutorialComplete}
        />

        <SettingsPanel
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onShowTutorial={handleShowTutorial}
        />

        {/* Custom drag layer for smooth drag preview */}
        <CustomDragLayer />
        
        {/* Floating piece for click-to-pickup */}
        <FloatingPiece />

        {/* Toast notifications */}
        <ToastContainer
          messages={toast.messages}
          onDismiss={toast.dismissToast}
        />
      </div>
    </DndProvider>
  )
}

export default App