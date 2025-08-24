import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'hint'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  message: ToastMessage
  onDismiss: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Auto-dismiss after duration
    const duration = message.duration || 5000
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [message.duration])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onDismiss(message.id)
    }, 300) // Match animation duration
  }

  const getTypeStyles = () => {
    switch (message.type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: '✅',
          accent: 'border-l-green-500'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: '❌',
          accent: 'border-l-red-500'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚠️',
          accent: 'border-l-yellow-500'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
          accent: 'border-l-blue-500'
        }
      case 'hint':
        return {
          bg: 'bg-purple-50 border-purple-200',
          text: 'text-purple-800',
          icon: '💡',
          accent: 'border-l-purple-500'
        }
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'ℹ️',
          accent: 'border-l-gray-500'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className={`
        max-w-sm w-full ${styles.bg} border ${styles.accent} border-l-4 rounded-cozy-lg shadow-cozy-lg p-4 mb-3
        transition-all duration-300 ease-in-out transform
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl">{styles.icon}</span>
        </div>
        
        <div className="ml-3 flex-1">
          <h4 className={`text-sm font-medium ${styles.text}`}>
            {message.title}
          </h4>
          <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
            {message.message}
          </p>
          
          {message.action && (
            <button
              onClick={message.action.onClick}
              className={`mt-2 text-xs font-medium ${styles.text} underline hover:no-underline focus:outline-none`}
            >
              {message.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`ml-3 flex-shrink-0 ${styles.text} opacity-60 hover:opacity-100 transition-opacity focus:outline-none`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ messages, onDismiss }) => {
  const containerContent = (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {messages.map(message => (
          <Toast key={message.id} message={message} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )

  return createPortal(containerContent, document.body)
}

// Toast store hook
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastMessage = { ...toast, id }
    
    setMessages(prev => [...prev, newToast])
    return id
  }

  const dismissToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearAllToasts = () => {
    setMessages([])
  }

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<ToastMessage>) =>
    addToast({ type: 'success', title, message, ...options })

  const error = (title: string, message: string, options?: Partial<ToastMessage>) =>
    addToast({ type: 'error', title, message, ...options })

  const warning = (title: string, message: string, options?: Partial<ToastMessage>) =>
    addToast({ type: 'warning', title, message, ...options })

  const info = (title: string, message: string, options?: Partial<ToastMessage>) =>
    addToast({ type: 'info', title, message, ...options })

  const hint = (title: string, message: string, options?: Partial<ToastMessage>) =>
    addToast({ type: 'hint', title, message, duration: 8000, ...options })

  return {
    messages,
    addToast,
    dismissToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    hint
  }
}

export default Toast