# Cozy PolySum - Project Context for Claude

## Project Overview
Building a local browser-based daily puzzle game that blends polyomino tiling with exact-number targeting. Players fill a 5×5 board using polyomino pieces to achieve full coverage and hit an exact sum target.

## Key Requirements
- **Board**: Fixed 5×5 grid (25 cells)
- **Pieces**: Tetrominoes (I, O, T, L, S) + Triominoes (I3, L3) + Domino (I2) + Monomino (I1)
- **Transforms**: Rotate + Flip allowed on all pieces
- **Bag**: 10-12 pieces per level, duplicates allowed, max 5 can remain unused
- **Values**: Each piece has value 1-9 (skewed low, more 1-4 values)
- **Win Condition**: Full board coverage (25/25) AND exact sum match to target
- **Constraint**: Maximum 1 monomino can be placed per level
- **Aesthetic**: Soft pastel colors, cozy feel, rounded corners, gentle shadows

## Tech Stack (Decided)
- **Build Tool**: Vite
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (pastel theme)
- **State Management**: Zustand
- **Drag & Drop**: React DnD
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Implementation Phases

### Phase 1: Project Setup & Core Systems
- Initialize Vite React TypeScript project
- Set up Tailwind with pastel color palette
- Configure ESLint, Prettier, and testing

### Phase 2: Data Models & Game Logic
- Define polyomino shapes (Tetromino, Triomino, etc.)
- Implement piece transform system (rotate/flip)
- Create board state management
- Build placement validation logic

### Phase 3: UI Components
- Create 5×5 game board component
- Build piece tray with draggable pieces
- Implement drag & drop with snap-to-grid
- Add game HUD (score, target, coverage)

### Phase 4: Game Rules & Win Conditions
- Implement sum calculation system
- Add monomino cap constraint
- Create win condition checker
- Add visual feedback (valid/invalid placement)

### Phase 5: Level Generation
- Build level generator with constraints
- Implement solver/validator
- Add daily seed system
- Create level JSON structure

### Phase 6: Polish & UX
- Apply pastel theme and animations
- Add keyboard controls (R/F for transforms)
- Implement undo/return to tray
- Add first-run tutorial
- Optimize performance

### Phase 7: Testing & Refinement
- Unit test game logic
- Integration test placement system
- Property test level generator
- Manual playtesting & balancing

## Data Model Example
```json
{
  "id": "2025-08-23",
  "board": { "rows": 5, "cols": 5 },
  "target": 31,
  "constraints": { "monomino_cap": 1, "max_leftovers": 5 },
  "bag": [
    { "id": "p1", "shape": "T4", "value": 3 },
    { "id": "p2", "shape": "L4", "value": 2 },
    { "id": "p3", "shape": "I2", "value": 1 },
    { "id": "p4", "shape": "I1", "value": 2 },
    { "id": "p5", "shape": "L3", "value": 4 }
  ]
}
```

## Polyomino Shapes Reference
- **Tetrominoes (4 cells)**:
  - I4: ████ (straight line)
  - O4: ██ (2×2 square)
       ██
  - T4: ███ (T-shape)
        █
  - L4: ███ (L-shape)
        █
  - S4: ██ (S-shape)
         ██
- **Triominoes (3 cells)**:
  - I3: ███ (straight line)
  - L3: ██ (L-shape)
        █
- **Domino (2 cells)**:
  - I2: ██
- **Monomino (1 cell)**:
  - I1: █

## UI/UX Requirements
- Soft pastel colors with rounded corners (12-16px radius)
- Drag pieces from tray to board with visual feedback
- Green ghost cells for valid placement, rose for invalid
- Persistent HUD showing: Target, Current Sum, Covered/25, Singles Used
- R to rotate, F to flip, click to return piece to tray
- Subtle animations, respect "reduced motion" preference

## Visual Design Reference
**Layout**: Clean centered vertical layout with board at top, piece tray below
**Grid Alignment**: Pieces must fit exactly onto grid cells with perfect proportions - no distortion or stretching
**Board**: 5×5 grid with consistent cell sizing, soft purple borders, white background with rounded container
**Pieces**: Colored blocks that snap cleanly to grid cells, each showing numeric value overlay
**Color Palette**: Blue (value 1-2), green (value 2-3), soft pastels throughout with purple accents
**Spacing**: Consistent gaps between grid cells and piece blocks for clean visual hierarchy
**Interaction**: Drag from tray with hover preview showing exact grid placement in green/red

## Performance Targets
- 60fps interactions on desktop
- Initial load <2s on broadband
- Level generation <1s on mid-range laptop
- Works on modern Chrome/Firefox/Safari
- Responsive down to 1024px width

## Testing Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests
npm run lint     # Run linter
npm run typecheck # Run TypeScript type checking
```

## Current Phase: Phase 1 - Project Setup & Core Systems