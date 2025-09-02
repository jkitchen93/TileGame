import { generateLevel } from './levelGenerator'

// Generate and display a test level
export function testLevelGeneration() {
  console.log('Generating a solvable puzzle with target sum 28...\n')
  
  const level = generateLevel(28, 3)
  
  if (!level) {
    console.error('Failed to generate level!')
    return
  }
  
  console.log('✅ Successfully generated level!')
  console.log(`📋 Level ID: ${level.id}`)
  console.log(`🎯 Target Sum: ${level.target}`)
  console.log(`📦 Total Pieces: ${level.bag.length}`)
  console.log(`🚫 Max Leftovers: ${level.constraints.max_leftovers}`)
  console.log('\n📦 Piece Bag:')
  console.log('─────────────')
  
  // Group pieces by whether they're part of solution or decoys
  const solutionPieces = level.bag.filter(p => !p.id.startsWith('decoy'))
  const decoyPieces = level.bag.filter(p => p.id.startsWith('decoy'))
  
  console.log('\n✅ Solution Pieces (these fill the board exactly):')
  let solutionSum = 0
  let solutionCells = 0
  solutionPieces.forEach(piece => {
    const cells = piece.shape === 'I1' ? 1 :
                  piece.shape === 'I2' ? 2 :
                  piece.shape === 'I3' || piece.shape === 'L3' ? 3 : 4
    solutionSum += piece.value
    solutionCells += cells
    console.log(`  ${piece.id}: ${piece.shape} (${cells} cells) = value ${piece.value}`)
  })
  
  console.log(`\n  Total: ${solutionCells} cells, sum = ${solutionSum}`)
  
  if (decoyPieces.length > 0) {
    console.log('\n❌ Decoy Pieces (extra pieces for difficulty):')
    decoyPieces.forEach(piece => {
      const cells = piece.shape === 'I1' ? 1 :
                    piece.shape === 'I2' ? 2 :
                    piece.shape === 'I3' || piece.shape === 'L3' ? 3 : 4
      console.log(`  ${piece.id}: ${piece.shape} (${cells} cells) = value ${piece.value}`)
    })
  }
  
  // Verify solvability
  console.log('\n🔍 Verification:')
  console.log(`  ✅ Board coverage: ${solutionCells === 25 ? 'VALID' : 'INVALID'} (${solutionCells}/25 cells)`)
  console.log(`  ✅ Target sum: ${solutionSum === level.target ? 'VALID' : 'INVALID'} (${solutionSum}/${level.target})`)
  
  const monominoCount = solutionPieces.filter(p => p.shape === 'I1').length
  console.log(`  ✅ Monomino constraint: ${monominoCount <= 1 ? 'VALID' : 'INVALID'} (${monominoCount}/1 max)`)
  
  return level
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testLevelGeneration()
}