import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import App from './App'

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
)

describe('App', () => {
  it('renders the game title', () => {
    render(<App />, { wrapper: TestWrapper })
    expect(screen.getByText('Cozy PolySum')).toBeDefined()
  })

  it('shows game status and level info', () => {
    render(<App />, { wrapper: TestWrapper })
    expect(screen.getByText('Game Status')).toBeDefined()
    expect(screen.getByText(/Level:/)).toBeDefined()
  })
})