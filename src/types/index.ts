export type PolyominoShape = 'I4' | 'O4' | 'T4' | 'L4' | 'S4' | 'I3' | 'L3' | 'I2' | 'I1'

export interface Coordinates {
  x: number
  y: number
}

export interface GamePiece {
  id: string
  shape: PolyominoShape
  value: number
  rotation: number
  flipped: boolean
}

export interface PlacedPiece extends GamePiece {
  position: Coordinates
  occupiedCells: Coordinates[]
}

export interface BoardCell {
  row: number
  col: number
  pieceId?: string
  pieceValue?: number
  pieceShape?: PolyominoShape
}

export interface GameLevel {
  id: string
  board: { rows: number; cols: number }
  target: number
  constraints: { monomino_cap: number; max_leftovers: number }
  bag: GamePiece[]
  solution?: {
    pieceIds: string[]
    placements: Array<{
      pieceId: string
      row: number
      col: number
      rotation: number
      flipped: boolean
    }>
    finalSum: number
    cellsCovered: number
  }
}

export interface PlacementResult {
  valid: boolean
  reason?: string
  occupiedCells?: Coordinates[]
}

export interface GameState {
  level: GameLevel | null
  board: BoardCell[][]
  placedPieces: PlacedPiece[]
  trayPieces: GamePiece[]
  currentSum: number
  coveredCells: number
  monominoCount: number
  isWon: boolean
}