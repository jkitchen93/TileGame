import { test, expect } from '@playwright/test'

test.describe('Center-Screen Positioning Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // Wait for game to load
    await page.waitForSelector('[data-board="true"]', { timeout: 10000 })
  })

  test('should prevent pieces from appearing in center-screen during interactions', async ({ page }) => {
    // Get viewport dimensions
    const viewport = page.viewportSize()
    const centerX = viewport!.width / 2
    const centerY = viewport!.height / 2
    const centerTolerance = 50 // 50px tolerance around exact center

    // Function to check if any pieces are in center-screen area
    const checkForCenterScreenPieces = async () => {
      const pieces = await page.locator('[data-piece-id]').all()
      const centerScreenPieces = []

      for (const piece of pieces) {
        const box = await piece.boundingBox()
        if (box) {
          const pieceId = await piece.getAttribute('data-piece-id')
          const pieceState = await piece.getAttribute('data-piece-state')
          
          // Check if piece center is in center-screen area
          const pieceCenterX = box.x + box.width / 2
          const pieceCenterY = box.y + box.height / 2
          
          const isInCenterX = Math.abs(pieceCenterX - centerX) < centerTolerance
          const isInCenterY = Math.abs(pieceCenterY - centerY) < centerTolerance
          
          if (isInCenterX && isInCenterY && pieceState === 'tray') {
            centerScreenPieces.push({
              id: pieceId,
              state: pieceState,
              position: { x: pieceCenterX, y: pieceCenterY },
              boundingBox: box
            })
          }
        }
      }
      
      return centerScreenPieces
    }

    // Initial check - should be no center-screen pieces
    let centerPieces = await checkForCenterScreenPieces()
    console.log('Initial center-screen pieces:', centerPieces)
    expect(centerPieces.length).toBe(0)

    // Test 1: Click a tray piece to pick it up, then put it back
    const firstPiece = page.locator('[data-piece-state="tray"]').first()
    await firstPiece.click()
    
    // Wait a moment for state changes
    await page.waitForTimeout(500)
    
    // Click somewhere in tray area to return piece
    await page.click('body', { position: { x: 100, y: 600 } })
    
    // Wait for position to settle
    await page.waitForTimeout(1000)
    
    // Check no pieces in center-screen
    centerPieces = await checkForCenterScreenPieces()
    console.log('After pickup/return - center-screen pieces:', centerPieces)
    expect(centerPieces.length).toBe(0)

    // Test 2: Try to place a piece on board, then return it
    await firstPiece.click()
    
    // Try to place on board (may succeed or fail)
    const board = page.locator('[data-board="true"]')
    await board.click({ position: { x: 100, y: 100 } })
    
    // Wait for placement attempt
    await page.waitForTimeout(500)
    
    // If piece is still picked up, return to tray
    const pickedUpPiece = page.locator('[data-piece-state="tray"]').filter({ hasText: /.*/ }).first()
    if (await pickedUpPiece.count() === 0) {
      // Piece was placed, pick it up again
      await board.click({ position: { x: 100, y: 100 } })
      await page.waitForTimeout(300)
    }
    
    // Return to tray
    await page.click('body', { position: { x: 100, y: 600 } })
    await page.waitForTimeout(1000)
    
    // Final check - no center-screen pieces
    centerPieces = await checkForCenterScreenPieces()
    console.log('After board interaction - center-screen pieces:', centerPieces)
    expect(centerPieces.length).toBe(0)
  })

  test('should handle excess pieces without center-screen fallback', async ({ page }) => {
    // This test checks if the system handles more than 10 pieces properly
    
    // Count current pieces in tray
    const trayPieces = await page.locator('[data-piece-state="tray"]').count()
    console.log(`Found ${trayPieces} pieces in tray`)
    
    // Check that all pieces are positioned in the U-shaped area (not center)
    const pieces = await page.locator('[data-piece-state="tray"]').all()
    const viewport = page.viewportSize()
    const centerX = viewport!.width / 2
    const centerY = viewport!.height / 2
    
    for (const piece of pieces) {
      const box = await piece.boundingBox()
      if (box) {
        const pieceId = await piece.getAttribute('data-piece-id')
        const pieceCenterX = box.x + box.width / 2
        const pieceCenterY = box.y + box.height / 2
        
        // Pieces should not be in exact center-screen area
        const distanceFromCenter = Math.sqrt(
          Math.pow(pieceCenterX - centerX, 2) + Math.pow(pieceCenterY - centerY, 2)
        )
        
        console.log(`Piece ${pieceId} distance from center: ${distanceFromCenter}px`)
        expect(distanceFromCenter).toBeGreaterThan(100) // At least 100px from center
      }
    }
  })

  test('should log positioning warnings when fallbacks are used', async ({ page }) => {
    // Listen for console warnings about positioning
    const warnings: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('TRAY_POSITIONING') || text.includes('PIECE_TRAY') || text.includes('GAME_STORE')) {
          warnings.push(text)
          console.log('Positioning warning/error:', text)
        }
      }
    })

    // Perform interactions that might trigger positioning issues
    const pieces = await page.locator('[data-piece-state="tray"]').all()
    
    for (let i = 0; i < Math.min(3, pieces.length); i++) {
      // Pick up and return each piece
      await pieces[i].click()
      await page.waitForTimeout(200)
      await page.click('body', { position: { x: 50 + i * 50, y: 600 } })
      await page.waitForTimeout(300)
    }

    // If there were positioning issues, we should see warnings but no center-screen pieces
    if (warnings.length > 0) {
      console.log(`Detected ${warnings.length} positioning warnings - this indicates the fallback system is working`)
      
      // Even with warnings, ensure no pieces are in center-screen
      const centerPieces = await page.evaluate(() => {
        const pieces = document.querySelectorAll('[data-piece-state="tray"]')
        const viewport = { width: window.innerWidth, height: window.innerHeight }
        const centerX = viewport.width / 2
        const centerY = viewport.height / 2
        
        const centerScreenPieces = []
        pieces.forEach((piece) => {
          const box = piece.getBoundingClientRect()
          const pieceCenterX = box.x + box.width / 2
          const pieceCenterY = box.y + box.height / 2
          
          if (Math.abs(pieceCenterX - centerX) < 50 && Math.abs(pieceCenterY - centerY) < 50) {
            centerScreenPieces.push({
              id: piece.getAttribute('data-piece-id'),
              position: { x: pieceCenterX, y: pieceCenterY }
            })
          }
        })
        
        return centerScreenPieces
      })
      
      expect(centerPieces.length).toBe(0)
    }
  })
})