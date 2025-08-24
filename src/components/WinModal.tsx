import React, { useEffect, useState } from 'react'
import { GameModal } from './GameModal'
import { WinAnalysis, Achievement } from '../utils/winConditions'
import { formatTimeDisplay } from '../utils/winConditions'

interface WinModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: WinAnalysis
  stats: {
    moves: number
    timeElapsed: number
    hintsUsed: number
    undosUsed: number
  }
  onPlayAgain: () => void
  onNextLevel?: () => void
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  onClose,
  analysis,
  stats,
  onPlayAgain,
  onNextLevel
}) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [visibleAchievements, setVisibleAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    if (isOpen && analysis.winState.isWon) {
      setShowConfetti(true)
      
      // Stagger achievement animations
      analysis.achievements.forEach((achievement, index) => {
        setTimeout(() => {
          setVisibleAchievements(prev => [...prev, achievement])
        }, index * 500)
      })

      // Auto-hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      setVisibleAchievements([])
    }
  }, [isOpen, analysis.winState.isWon, analysis.achievements])

  const getPerformanceRating = (moves: number, timeElapsed: number): string => {
    if (moves <= 15 && timeElapsed <= 120) return 'Perfect!'
    if (moves <= 25 && timeElapsed <= 300) return 'Excellent!'
    if (moves <= 35 && timeElapsed <= 600) return 'Good!'
    return 'Completed!'
  }

  const getPerformanceColor = (rating: string): string => {
    switch (rating) {
      case 'Perfect!': return 'text-green-600'
      case 'Excellent!': return 'text-blue-600'
      case 'Good!': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <GameModal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Puzzle Complete!"
      size="large"
      closeOnOverlayClick={false}
      className="animate-bounce-in"
    >
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: [
                    '#a78bfa', '#ec4899', '#f472b6',
                    '#fb7185', '#fbbf24', '#34d399'
                  ][Math.floor(Math.random() * 6)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Win celebration */}
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-cozy-lg border-2 border-green-200">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-3xl font-bold text-green-800 mb-2">
            Congratulations!
          </h3>
          <p className="text-lg text-green-700">
            You solved the puzzle with perfect coverage and sum!
          </p>
        </div>

        {/* Performance stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-pastel-purple-50 rounded-cozy-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-800">{stats.moves}</div>
            <div className="text-sm text-purple-600">Moves</div>
          </div>
          
          <div className="text-center p-4 bg-pastel-blue-50 rounded-cozy-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">
              {formatTimeDisplay(stats.timeElapsed)}
            </div>
            <div className="text-sm text-blue-600">Time</div>
          </div>
          
          <div className="text-center p-4 bg-pastel-pink-50 rounded-cozy-lg border border-pink-200">
            <div className="text-2xl font-bold text-pink-800">{stats.hintsUsed}</div>
            <div className="text-sm text-pink-600">Hints Used</div>
          </div>
          
          <div className="text-center p-4 bg-pastel-yellow-50 rounded-cozy-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{stats.undosUsed}</div>
            <div className="text-sm text-yellow-600">Undos</div>
          </div>
        </div>

        {/* Performance rating */}
        <div className="text-center p-4 bg-white rounded-cozy-lg border-2 border-purple-200">
          <div className={`text-3xl font-bold ${getPerformanceColor(getPerformanceRating(stats.moves, stats.timeElapsed))}`}>
            {getPerformanceRating(stats.moves, stats.timeElapsed)}
          </div>
          <div className="text-purple-600 mt-2">
            Performance Rating
          </div>
        </div>

        {/* Achievements */}
        {visibleAchievements.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xl font-bold text-purple-800 text-center">
              Achievements Unlocked
            </h4>
            <div className="grid gap-3">
              {visibleAchievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-cozy-lg border-2 border-yellow-200 animate-slide-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="text-3xl mr-4">{achievement.icon}</div>
                  <div>
                    <h5 className="font-bold text-orange-800">{achievement.title}</h5>
                    <p className="text-sm text-orange-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress stats */}
        <div className="p-4 bg-pastel-purple-50 rounded-cozy-lg border border-purple-200">
          <h4 className="font-bold text-purple-800 mb-3">Puzzle Progress</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-purple-600">Completion:</span>
              <span className="font-bold text-purple-800 ml-2">
                {analysis.winState.completionPercentage.toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-purple-600">Progress Score:</span>
              <span className="font-bold text-purple-800 ml-2">
                {analysis.winState.progressScore}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={onPlayAgain}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-cozy-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            Play Again
          </button>
          
          {onNextLevel && (
            <button
              onClick={onNextLevel}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-cozy-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Next Level
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-cozy-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes slide-in {
          0% {
            transform: translateX(-20px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes modal-enter {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }
      `}</style>
    </GameModal>
  )
}

export default WinModal