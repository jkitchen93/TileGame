import { Coordinates } from './polyominoes'

export type { Coordinates }

export function rotatePiece90(coords: Coordinates[]): Coordinates[] {
  return coords.map(({ x, y }) => ({
    x: -y === 0 ? 0 : -y,
    y: x === 0 ? 0 : x
  }))
}

export function flipHorizontal(coords: Coordinates[]): Coordinates[] {
  return coords.map(({ x, y }) => ({
    x: -x === 0 ? 0 : -x,
    y
  }))
}

export function flipVertical(coords: Coordinates[]): Coordinates[] {
  return coords.map(({ x, y }) => ({
    x,
    y: -y === 0 ? 0 : -y
  }))
}

export function normalizeCoordinates(coords: Coordinates[]): Coordinates[] {
  if (coords.length === 0) return coords
  
  const minX = Math.min(...coords.map(c => c.x))
  const minY = Math.min(...coords.map(c => c.y))
  
  return coords.map(({ x, y }) => ({
    x: x - minX,
    y: y - minY
  }))
}

export function getTransformedShape(
  coords: Coordinates[],
  rotation: number = 0,
  flipped: boolean = false
): Coordinates[] {
  let transformed = [...coords]
  
  if (flipped) {
    transformed = flipHorizontal(transformed)
  }
  
  const rotations = Math.floor(((rotation % 360) + 360) % 360 / 90)
  for (let i = 0; i < rotations; i++) {
    transformed = rotatePiece90(transformed)
  }
  
  return normalizeCoordinates(transformed)
}

export function applyTransform(
  coords: Coordinates[],
  offsetX: number,
  offsetY: number
): Coordinates[] {
  return coords.map(({ x, y }) => ({
    x: x + offsetX,
    y: y + offsetY
  }))
}

export function getAllTransformations(coords: Coordinates[]): {
  rotation: number
  flipped: boolean
  coords: Coordinates[]
}[] {
  const transformations: {
    rotation: number
    flipped: boolean
    coords: Coordinates[]
  }[] = []
  
  for (const flipped of [false, true]) {
    for (const rotation of [0, 90, 180, 270]) {
      const transformed = getTransformedShape(coords, rotation, flipped)
      
      const exists = transformations.some(t => 
        coordsEqual(t.coords, transformed)
      )
      
      if (!exists) {
        transformations.push({
          rotation,
          flipped,
          coords: transformed
        })
      }
    }
  }
  
  return transformations
}

function coordsEqual(coords1: Coordinates[], coords2: Coordinates[]): boolean {
  if (coords1.length !== coords2.length) return false
  
  const sorted1 = coords1.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  const sorted2 = coords2.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  
  return sorted1.every((coord, i) => 
    coord.x === sorted2[i].x && coord.y === sorted2[i].y
  )
}