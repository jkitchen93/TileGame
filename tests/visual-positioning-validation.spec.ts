import { test, expect, Page } from '@playwright/test';

/**
 * PLAYWRIGHT VISUAL POSITIONING VALIDATION SCRIPT
 * 
 * This script automatically detects and reports game pieces that are visually 
 * positioned below the main game grid through programmatic coordinate comparison.
 * 
 * COORDINATE COMPARISON LOGIC:
 * 1. Get the bottom Y-coordinate of the game grid container
 * 2. Get the top Y-coordinate of each active game piece
 * 3. If piece.top > grid.bottom, the piece is below the grid (VIOLATION)
 * 4. Log detailed coordinates, capture screenshot evidence, and fail the test
 */

interface GamePieceCoordinates {
  pieceId: string;
  selector: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  topY: number;
}

interface GameGridBoundary {
  selector: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  bottomY: number;
}

/**
 * Get the bottom Y-coordinate of the main game grid
 * The game grid is identified by the [data-board="true"] selector
 */
async function getGameGridBoundary(page: Page): Promise<GameGridBoundary> {
  const gridSelector = '[data-board="true"]';
  const gridElement = page.locator(gridSelector);
  
  // Verify the grid element exists
  await expect(gridElement).toBeVisible();
  
  const boundingBox = await gridElement.boundingBox();
  if (!boundingBox) {
    throw new Error('Failed to get bounding box for game grid');
  }
  
  // Calculate the bottom Y-coordinate of the grid
  // This includes the grid height plus any padding/margins
  const bottomY = boundingBox.y + boundingBox.height;
  
  console.log(`[GRID DETECTION] Game grid found:`);
  console.log(`  Selector: ${gridSelector}`);
  console.log(`  Position: x=${boundingBox.x}, y=${boundingBox.y}`);
  console.log(`  Dimensions: ${boundingBox.width}×${boundingBox.height}px`);
  console.log(`  Bottom Y-coordinate: ${bottomY}px`);
  
  return {
    selector: gridSelector,
    boundingBox,
    bottomY
  };
}

/**
 * Find all active game piece elements and get their coordinates
 * Game pieces are identified by the [data-piece-id] attribute
 */
async function findAllGamePieces(page: Page): Promise<GamePieceCoordinates[]> {
  // Only check placed pieces on the board, not tray pieces
  const pieceSelector = '[data-piece-id][data-piece-state="placed"]';
  const pieceElements = page.locator(pieceSelector);
  
  const pieceCount = await pieceElements.count();
  console.log(`[PIECE DETECTION] Found ${pieceCount} placed game pieces on board`);
  
  const pieces: GamePieceCoordinates[] = [];
  
  for (let i = 0; i < pieceCount; i++) {
    const piece = pieceElements.nth(i);
    const pieceId = await piece.getAttribute('data-piece-id');
    
    if (!pieceId) {
      console.warn(`[PIECE DETECTION] Piece ${i} missing data-piece-id attribute`);
      continue;
    }
    
    // Get the piece's bounding box
    const boundingBox = await piece.boundingBox();
    if (!boundingBox) {
      console.warn(`[PIECE DETECTION] Failed to get bounding box for piece ${pieceId}`);
      continue;
    }
    
    // Calculate the top Y-coordinate of the piece
    const topY = boundingBox.y;
    
    const pieceData: GamePieceCoordinates = {
      pieceId,
      selector: `[data-piece-id="${pieceId}"][data-piece-state="placed"]`,
      boundingBox,
      topY
    };
    
    pieces.push(pieceData);
    
    console.log(`[PIECE DETECTION] Board Piece ${pieceId}:`);
    console.log(`  Position: x=${boundingBox.x}, y=${boundingBox.y}`);
    console.log(`  Dimensions: ${boundingBox.width}×${boundingBox.height}px`);
    console.log(`  Top Y-coordinate: ${topY}px`);
  }
  
  console.log(`[PIECE DETECTION] Note: Tray pieces are excluded from validation`);
  console.log(`[PIECE DETECTION] Tray pieces use U-shaped layout and are allowed below the grid`);
  
  return pieces;
}

/**
 * Compare piece coordinates against grid boundary to detect violations
 * A violation occurs when a piece's top edge is below the grid's bottom edge
 */
function detectPositioningViolations(
  gridBoundary: GameGridBoundary,
  pieces: GamePieceCoordinates[]
): GamePieceCoordinates[] {
  console.log(`\n[COORDINATE COMPARISON] Starting violation detection:`);
  console.log(`  Grid bottom Y-coordinate: ${gridBoundary.bottomY}px`);
  console.log(`  Checking ${pieces.length} pieces for violations...`);
  
  const violations: GamePieceCoordinates[] = [];
  
  for (const piece of pieces) {
    // CORE COORDINATE COMPARISON LOGIC:
    // If piece.topY > grid.bottomY, then piece is positioned below the grid
    const isViolation = piece.topY > gridBoundary.bottomY;
    
    console.log(`[COORDINATE COMPARISON] Piece ${piece.pieceId}:`);
    console.log(`  Piece top Y: ${piece.topY}px`);
    console.log(`  Grid bottom Y: ${gridBoundary.bottomY}px`);
    console.log(`  Difference: ${piece.topY - gridBoundary.bottomY}px`);
    console.log(`  Is below grid: ${isViolation ? '❌ YES (VIOLATION)' : '✅ NO (OK)'}`);
    
    if (isViolation) {
      violations.push(piece);
    }
  }
  
  console.log(`\n[COORDINATE COMPARISON] Detection complete:`);
  console.log(`  Total pieces checked: ${pieces.length}`);
  console.log(`  Violations found: ${violations.length}`);
  
  return violations;
}

/**
 * Log detailed violation information and capture screenshot evidence
 */
async function reportViolations(
  page: Page,
  gridBoundary: GameGridBoundary,
  violations: GamePieceCoordinates[]
): Promise<void> {
  if (violations.length === 0) {
    console.log('\n[VIOLATION REPORT] ✅ No positioning violations detected');
    return;
  }
  
  console.log(`\n[VIOLATION REPORT] ❌ ${violations.length} positioning violation(s) detected:`);
  
  // Log detailed information for each violation
  violations.forEach((piece, index) => {
    const distanceBelowGrid = piece.topY - gridBoundary.bottomY;
    
    console.log(`\n  Violation ${index + 1}:`);
    console.log(`    Piece ID: ${piece.pieceId}`);
    console.log(`    Selector: ${piece.selector}`);
    console.log(`    Piece top Y-coordinate: ${piece.topY}px`);
    console.log(`    Grid bottom Y-coordinate: ${gridBoundary.bottomY}px`);
    console.log(`    Distance below grid: ${distanceBelowGrid}px`);
    console.log(`    Piece position: x=${piece.boundingBox.x}, y=${piece.boundingBox.y}`);
    console.log(`    Piece dimensions: ${piece.boundingBox.width}×${piece.boundingBox.height}px`);
  });
  
  // Capture full-page screenshot for visual evidence
  console.log('\n[SCREENSHOT CAPTURE] Taking full-page screenshot for visual evidence...');
  await page.screenshot({
    path: `test-results/positioning-violations-${Date.now()}.png`,
    fullPage: true
  });
  console.log('[SCREENSHOT CAPTURE] Screenshot saved successfully');
  
  // Create a summary of violations for test failure message
  const violationSummary = violations.map(piece => 
    `${piece.pieceId} (${piece.topY}px below grid at ${gridBoundary.bottomY}px)`
  ).join(', ');
  
  throw new Error(
    `POSITIONING VIOLATIONS DETECTED: ${violations.length} piece(s) found below the game grid. ` +
    `Violations: ${violationSummary}. Check screenshot for visual evidence.`
  );
}

/**
 * Main test: Detect game pieces positioned below the main game grid
 */
test('should detect and report game pieces positioned below the main game grid', async ({ page }) => {
  console.log('\n=== VISUAL POSITIONING VALIDATION TEST STARTED ===');
  console.log(`Target URL: ${page.url() || 'http://localhost:5173'}`);
  
  // Navigate to the game application
  console.log('\n[NAVIGATION] Navigating to game application...');
  await page.goto('/');
  
  // Wait for the game to fully load
  console.log('[NAVIGATION] Waiting for game to load...');
  await page.waitForSelector('[data-board="true"]', { state: 'visible' });
  await page.waitForTimeout(2000); // Allow for piece positioning to stabilize
  
  console.log('[NAVIGATION] Game loaded successfully');
  
  // Step 1: Get the game grid boundary (bottom Y-coordinate)
  console.log('\n=== STEP 1: GAME GRID BOUNDARY DETECTION ===');
  const gridBoundary = await getGameGridBoundary(page);
  
  // Step 2: Find all active game piece elements
  console.log('\n=== STEP 2: GAME PIECE DETECTION ===');
  const pieces = await findAllGamePieces(page);
  
  // Note: It's normal to have 0 placed pieces at game start (all pieces in tray)
  console.log(`[VALIDATION] Found ${pieces.length} placed pieces to validate`);
  
  if (pieces.length === 0) {
    console.log('[VALIDATION] ✅ No pieces placed on board - this is expected at game start');
    console.log('[VALIDATION] ✅ All pieces are in tray using U-shaped layout (below grid is allowed)');
    console.log('\n=== VISUAL POSITIONING VALIDATION TEST COMPLETED ===');
    console.log('✅ Test passed: No board pieces found below grid (as expected)');
    return; // Test passes - no board pieces to violate grid boundaries
  }
  
  // Step 3: Compare coordinates to detect violations
  console.log('\n=== STEP 3: COORDINATE COMPARISON ===');
  const violations = detectPositioningViolations(gridBoundary, pieces);
  
  // Step 4: Report violations and fail test if any found
  console.log('\n=== STEP 4: VIOLATION REPORTING ===');
  await reportViolations(page, gridBoundary, violations);
  
  console.log('\n=== VISUAL POSITIONING VALIDATION TEST COMPLETED ===');
  console.log('✅ All game pieces are correctly positioned relative to the grid');
});

/**
 * Additional test: Validate positioning after user interactions
 * This test simulates user interactions that might cause positioning issues
 */
test('should maintain correct positioning after piece interactions', async ({ page }) => {
  console.log('\n=== INTERACTION-BASED POSITIONING TEST STARTED ===');
  
  await page.goto('/');
  await page.waitForSelector('[data-board="true"]', { state: 'visible' });
  await page.waitForTimeout(2000);
  
  // Get initial state
  const gridBoundary = await getGameGridBoundary(page);
  const initialPieces = await findAllGamePieces(page);
  
  // Simulate some user interactions that might cause positioning issues
  console.log('\n[INTERACTION TEST] Simulating piece interactions...');
  
  // Click on a few pieces to pick them up and put them back
  const firstPiece = page.locator('[data-piece-id]').first();
  if (await firstPiece.isVisible()) {
    await firstPiece.click();
    await page.waitForTimeout(500);
    
    // Click elsewhere to put the piece back
    await page.click('body');
    await page.waitForTimeout(500);
  }
  
  // Check positioning after interactions
  console.log('\n[INTERACTION TEST] Checking positioning after interactions...');
  const finalPieces = await findAllGamePieces(page);
  const violations = detectPositioningViolations(gridBoundary, finalPieces);
  
  await reportViolations(page, gridBoundary, violations);
  
  console.log('\n=== INTERACTION-BASED POSITIONING TEST COMPLETED ===');
});