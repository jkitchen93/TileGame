import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the game title', () => {
    render(<App />)
    expect(screen.getByText('Cozy PolySum')).toBeDefined()
  })

  it('shows setup in progress message', () => {
    render(<App />)
    expect(screen.getByText(/Setup in Progress/)).toBeDefined()
  })
})