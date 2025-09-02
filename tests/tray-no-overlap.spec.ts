import { test, expect, Page } from '@playwright/test'

async function getTrayPieceBoxes(page: Page) {
  const loc = page.locator('[data-piece-id][data-piece-state="tray"]')
  const count = await loc.count()
  const boxes: Array<{ id: string, box: Required<NonNullable<Awaited<ReturnType<typeof loc.boundingBox>>>> } > = []

  for (let i = 0; i < count; i++) {
    const el = loc.nth(i)
    const id = (await el.getAttribute('data-piece-id')) || `idx-${i}`
    const box = await el.boundingBox()
    if (box && box.width > 0 && box.height > 0) {
      boxes.push({ id, box: box as any })
    }
  }
  return boxes
}

function boxesOverlap(a: { x: number, y: number, width: number, height: number }, b: { x: number, y: number, width: number, height: number }) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  )
}

test('tray pieces are laid out without visual overlap', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('[data-board="true"]', { state: 'visible' })
  // Wait briefly to ensure tray positions are applied
  await page.waitForTimeout(1000)

  const boxes = await getTrayPieceBoxes(page)
  console.log(`Found ${boxes.length} tray pieces`)

  const overlaps: Array<{ a: string, b: string }> = []
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i].box, boxes[j].box)) {
        overlaps.push({ a: boxes[i].id, b: boxes[j].id })
      }
    }
  }

  if (overlaps.length > 0) {
    console.log('Overlaps detected:', overlaps)
    await page.screenshot({ path: `test-results/tray-overlap-${Date.now()}.png`, fullPage: true })
  }

  expect(overlaps, 'No tray pieces should visually overlap').toHaveLength(0)
})

