import React, { useState, useEffect } from 'react'
import { GameModal } from './GameModal'
import { useSettingsActions } from '../stores/settingsStore'

interface TutorialStep {
  id: string
  title: string
  content: React.ReactNode
  image?: string
  highlight?: string // CSS selector to highlight
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface TutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Cozy PolySum!',
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🧩</div>
        <p className="text-lg text-purple-700">
          A relaxing daily puzzle game that combines polyomino tiling with number targets.
        </p>
        <p className="text-purple-600">
          Let's learn how to play in just a few simple steps!
        </p>
      </div>
    ),
    position: 'center'
  },
  {
    id: 'objective',
    title: 'Your Goal',
    content: (
      <div className="space-y-4">
        <div className="bg-pastel-blue-50 p-4 rounded-cozy-lg border border-blue-200">
          <h4 className="font-bold text-blue-800 mb-2">Two objectives to achieve:</h4>
          <div className="space-y-2 text-blue-700">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <span>Fill the entire 5×5 board (25 cells)</span>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔢</span>
              <span>Make your pieces add up to the exact target sum</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-purple-600">
          You must achieve BOTH conditions to solve the puzzle!
        </p>
      </div>
    ),
    position: 'center'
  },
  {
    id: 'pieces',
    title: 'Polyomino Pieces',
    content: (
      <div className="space-y-4">
        <p className="text-purple-700">
          You'll work with different shaped pieces, each with a point value:
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800 mb-1">Tetrominoes (4 cells)</div>
            <div className="text-purple-600">I, O, T, L, S shapes</div>
          </div>
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800 mb-1">Triominoes (3 cells)</div>
            <div className="text-purple-600">I, L shapes</div>
          </div>
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800 mb-1">Domino (2 cells)</div>
            <div className="text-purple-600">Straight line</div>
          </div>
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800 mb-1">Monomino (1 cell)</div>
            <div className="text-purple-600">Single square</div>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-cozy border border-yellow-200">
          <div className="font-bold text-yellow-800 mb-1">⚠️ Monomino Limit</div>
          <div className="text-yellow-700 text-sm">
            You can only place 1 monomino per puzzle!
          </div>
        </div>
      </div>
    ),
    position: 'center'
  },
  {
    id: 'controls',
    title: 'How to Play',
    content: (
      <div className="space-y-4">
        <div className="bg-pastel-green-50 p-4 rounded-cozy-lg border border-green-200">
          <h4 className="font-bold text-green-800 mb-3">Game Controls:</h4>
          <div className="space-y-2 text-green-700">
            <div className="flex justify-between">
              <span className="font-medium">Place piece:</span>
              <span className="bg-white px-2 py-1 rounded text-xs">Click & Drag</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Rotate piece:</span>
              <span className="bg-white px-2 py-1 rounded text-xs">Press R</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Flip piece:</span>
              <span className="bg-white px-2 py-1 rounded text-xs">Press F</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Remove piece:</span>
              <span className="bg-white px-2 py-1 rounded text-xs">Click placed piece</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-purple-600">
          Green preview = valid placement, Red preview = invalid placement
        </p>
      </div>
    ),
    position: 'center'
  },
  {
    id: 'hud',
    title: 'Game Status',
    content: (
      <div className="space-y-4">
        <p className="text-purple-700">
          Keep track of your progress with the game status panel:
        </p>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800">Sum Progress</div>
            <div className="text-sm text-purple-600">Shows current points vs target</div>
          </div>
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800">Board Coverage</div>
            <div className="text-sm text-purple-600">Cells filled out of 25 total</div>
          </div>
          <div className="bg-white p-3 rounded-cozy border border-purple-200">
            <div className="font-bold text-purple-800">Monominoes Used</div>
            <div className="text-sm text-purple-600">Track your single-cell pieces</div>
          </div>
        </div>
      </div>
    ),
    highlight: '.game-hud', // Would need to add this class to GameHUD
    position: 'center'
  },
  {
    id: 'tips',
    title: 'Pro Tips',
    content: (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-cozy-lg border border-purple-200">
          <h4 className="font-bold text-purple-800 mb-3">Strategy Tips:</h4>
          <div className="space-y-2 text-sm text-purple-700">
            <div className="flex items-start">
              <span className="text-lg mr-2">💡</span>
              <span>Start with larger pieces (tetrominoes) first</span>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">🎯</span>
              <span>Keep an eye on both the sum and coverage progress</span>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">🔄</span>
              <span>Rotate and flip pieces to find the perfect fit</span>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">⭐</span>
              <span>Save monominoes for filling final small gaps</span>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-2">🎲</span>
              <span>You can leave up to 5 pieces unused</span>
            </div>
          </div>
        </div>
      </div>
    ),
    position: 'center'
  },
  {
    id: 'ready',
    title: 'Ready to Play!',
    content: (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-lg text-purple-700">
          You're all set to enjoy Cozy PolySum!
        </p>
        <p className="text-purple-600">
          Take your time, relax, and have fun solving the daily puzzle.
        </p>
        <div className="bg-pastel-pink-50 p-4 rounded-cozy-lg border border-pink-200">
          <p className="text-sm text-pink-700">
            💡 You can always access hints and help from the settings menu
          </p>
        </div>
      </div>
    ),
    position: 'center'
  }
]

export const Tutorial: React.FC<TutorialProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeTutorial } = useSettingsActions()

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    completeTutorial()
    onComplete()
    onClose()
  }

  const handleSkip = () => {
    completeTutorial()
    onClose()
  }

  const step = tutorialSteps[currentStep]

  if (!isOpen) return null

  return (
    <GameModal
      isOpen={isOpen}
      onClose={handleSkip}
      title={`${step.title} (${currentStep + 1}/${tutorialSteps.length})`}
      size="large"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-purple-100 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="min-h-[300px] flex items-center">
          <div className="w-full">
            {step.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-purple-200">
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 font-medium focus:outline-none focus:underline"
            >
              Skip Tutorial
            </button>
          </div>

          <div className="text-sm text-purple-600">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-cozy transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </GameModal>
  )
}

export default Tutorial