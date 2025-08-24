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
      case 'perfect': return 'text-green-600'
      case 'target': return 'text-blue-600'
      case 'over': return 'text-rose-500'
      default: return 'text-purple-600'
    }
  }

  const getSumStatusBg = () => {
    switch (sumStatus) {
      case 'perfect': return 'bg-green-200'
      case 'target': return 'bg-blue-200'
      case 'over': return 'bg-rose-200'
      default: return 'bg-purple-200'
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
    <div 
      className="inline-flex gap-8 px-8 py-4 bg-white rounded-[20px] shadow-lg"
      style={{
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-sm text-purple-700 opacity-70 mb-1">Target</span>
        <span className="text-3xl font-bold text-purple-700">{targetSum}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm text-purple-700 opacity-70 mb-1">Current</span>
        <span 
          className={`text-3xl font-bold ${getSumStatusColor()}`}
          style={{
            color: sumStatus === 'perfect' || sumStatus === 'target' ? '#4ade80' : 
                   sumStatus === 'over' ? '#ef4444' : '#f472b6'
          }}
        >
          {currentSum}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm text-purple-700 opacity-70 mb-1">Coverage</span>
        <span 
          className="text-3xl font-bold"
          style={{ color: '#4ade80' }}
        >
          {coveredCells}/25
        </span>
      </div>
    </div>
  )
}

export default GameHUD