import React from 'react'
import { useGameStore } from '../stores/gameStore'

export const GameHUD: React.FC = () => {
  const { level, currentSum, coveredCells, monominoCount, isWon, resetGame } = useGameStore()

  if (!level) {
    return (
      <div className="bg-white rounded-cozy-lg shadow-cozy p-6 border-2 border-purple-200">
        <div className="text-center text-purple-600">
          <p>Load a level to start playing</p>
        </div>
      </div>
    )
  }

  const targetSum = level.target
  const maxMonominoes = level.constraints.monomino_cap
  const maxCells = 25

  // Calculate progress percentages
  const sumProgress = Math.min((currentSum / targetSum) * 100, 100)
  const coverageProgress = (coveredCells / maxCells) * 100
  
  // Determine sum status
  const getSumStatus = () => {
    if (currentSum === targetSum && coveredCells === maxCells) return 'perfect'
    if (currentSum === targetSum) return 'target'
    if (currentSum > targetSum) return 'over'
    return 'under'
  }

  const sumStatus = getSumStatus()

  const getSumStatusColor = () => {
    switch (sumStatus) {
      case 'perfect': return 'text-pastel-green-400'
      case 'target': return 'text-pastel-blue-400'
      case 'over': return 'text-rose-500'
      default: return 'text-purple-600'
    }
  }

  const getSumStatusBg = () => {
    switch (sumStatus) {
      case 'perfect': return 'bg-pastel-green-200'
      case 'target': return 'bg-pastel-blue-200'
      case 'over': return 'bg-rose-200'
      default: return 'bg-pastel-purple-200'
    }
  }

  // Get monomino status
  const getMonominoStatus = () => {
    if (monominoCount > maxMonominoes) return 'over'
    if (monominoCount === maxMonominoes) return 'limit'
    return 'under'
  }

  const monominoStatus = getMonominoStatus()

  return (
    <div className="bg-white rounded-cozy-lg shadow-cozy-lg p-6 border-2 border-purple-200 space-y-6">
      {/* Header with level info */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-purple-800">Game Status</h2>
        <div className="text-sm text-purple-600">Level: {level.id}</div>
      </div>

      {/* Win/Lose status */}
      {isWon && (
        <div className="bg-pastel-green-100 border-2 border-pastel-green-300 rounded-cozy p-4 text-center">
          <div className="text-lg font-bold text-green-800">🎉 Puzzle Solved! 🎉</div>
          <div className="text-sm text-green-700 mt-1">Perfect placement and sum!</div>
        </div>
      )}

      {/* Sum Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-700">Sum Progress</span>
          <span className={`text-lg font-bold ${getSumStatusColor()}`}>
            {currentSum} / {targetSum}
          </span>
        </div>
        
        <div className="w-full bg-purple-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getSumStatusBg()}`}
            style={{ width: `${Math.min(sumProgress, 100)}%` }}
          />
        </div>
        
        <div className="text-xs text-purple-600 text-center">
          {sumStatus === 'perfect' && '✓ Perfect sum and coverage!'}
          {sumStatus === 'target' && '✓ Target sum reached - fill the board!'}
          {sumStatus === 'over' && '⚠ Sum too high - remove some pieces'}
          {sumStatus === 'under' && `Need ${targetSum - currentSum} more`}
        </div>
      </div>

      {/* Coverage Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-700">Board Coverage</span>
          <span className="text-lg font-bold text-purple-800">
            {coveredCells} / {maxCells}
          </span>
        </div>
        
        <div className="w-full bg-purple-100 rounded-full h-3">
          <div
            className="bg-pastel-purple-300 h-3 rounded-full transition-all duration-300"
            style={{ width: `${coverageProgress}%` }}
          />
        </div>
        
        <div className="text-xs text-purple-600 text-center">
          {coveredCells === maxCells ? '✓ Board completely filled!' : `${maxCells - coveredCells} cells empty`}
        </div>
      </div>

      {/* Monomino Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-700">Monominoes Used</span>
          <span className={`text-lg font-bold ${
            monominoStatus === 'over' ? 'text-rose-500' : 
            monominoStatus === 'limit' ? 'text-yellow-600' : 
            'text-purple-800'
          }`}>
            {monominoCount} / {maxMonominoes}
          </span>
        </div>
        
        <div className="w-full bg-purple-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              monominoStatus === 'over' ? 'bg-rose-300' :
              monominoStatus === 'limit' ? 'bg-yellow-300' :
              'bg-pastel-blue-300'
            }`}
            style={{ width: `${Math.min((monominoCount / maxMonominoes) * 100, 100)}%` }}
          />
        </div>
        
        <div className="text-xs text-purple-600 text-center">
          {monominoStatus === 'over' && '⚠ Too many monominoes placed!'}
          {monominoStatus === 'limit' && '⚠ At monomino limit'}
          {monominoStatus === 'under' && `${maxMonominoes - monominoCount} monomino${maxMonominoes - monominoCount !== 1 ? 's' : ''} allowed`}
        </div>
      </div>

      {/* Game Stats Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
        <div className="text-center p-3 bg-pastel-purple-50 rounded-cozy">
          <div className="text-lg font-bold text-purple-800">{level.bag.length}</div>
          <div className="text-xs text-purple-600">Total Pieces</div>
        </div>
        <div className="text-center p-3 bg-pastel-purple-50 rounded-cozy">
          <div className="text-lg font-bold text-purple-800">{level.constraints.max_leftovers}</div>
          <div className="text-xs text-purple-600">Max Unused</div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetGame}
        className="w-full bg-pastel-purple-200 hover:bg-pastel-purple-300 text-purple-800 font-medium py-3 px-4 rounded-cozy transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
      >
        Reset Game
      </button>
    </div>
  )
}

export default GameHUD