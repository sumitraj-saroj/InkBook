import { describe, it, expect, beforeEach } from 'vitest'
import { useNotebookStore } from '../src/renderer/src/store/notebookStore'
import {
  clampElementsToPage,
  calculatePageFit,
  getPageDimensions,
  type BoundedElement
} from '../src/shared/index'

function generateSceneElements(count: number): BoundedElement[] {
  const elements: BoundedElement[] = []
  for (let i = 0; i < count; i++) {
    const x = 50 + (i % 20) * 30
    const y = 50 + Math.floor(i / 20) * 35
    elements.push({
      id: `elem-${i}`,
      type: i % 3 === 0 ? 'rectangle' : i % 3 === 1 ? 'ellipse' : 'text',
      x,
      y,
      width: 25,
      height: 25,
      angle: 0,
      isDeleted: false,
      version: 1,
      ...(i % 3 === 2 ? { text: `Note ${i}` } : {})
    })
  }
  return elements
}

describe('Page Switching Performance (500+ elements)', () => {
  beforeEach(() => {
    useNotebookStore.getState().newNotebook()
  })

  it('switches between pages with 500+ elements within 50ms', () => {
    const elements500A = generateSceneElements(500)
    const elements500B = generateSceneElements(500)

    const store = useNotebookStore.getState()
    const page1 = store.currentNotebook.pages[0]!
    const page2 = store.addPage('A4', 'portrait', 'ruled')

    // Populate both pages with 500 elements
    store.updatePageScene(page1.id, {
      elements: elements500A,
      appState: { scrollX: 0, scrollY: 0 },
      files: {}
    })
    store.updatePageScene(page2.id, {
      elements: elements500B,
      appState: { scrollX: 0, scrollY: 0 },
      files: {}
    })

    const dims1 = getPageDimensions(page1)
    const dims2 = getPageDimensions(page2)

    // Warm-up
    clampElementsToPage(elements500A, dims1)
    clampElementsToPage(elements500B, dims2)

    // Benchmark 10 consecutive switches
    const times: number[] = []

    for (let round = 0; round < 10; round++) {
      const fromPage = round % 2 === 0 ? page1 : page2
      const toPage = round % 2 === 0 ? page2 : page1
      const fromElements = round % 2 === 0 ? elements500A : elements500B
      const toElements = round % 2 === 0 ? elements500B : elements500A
      const toDims = round % 2 === 0 ? dims2 : dims1

      const start = performance.now()

      // 1. Save outgoing page scene
      store.updatePageScene(fromPage.id, {
        elements: fromElements,
        appState: { scrollX: 10, scrollY: 20 },
        files: {}
      })

      // 2. Switch current page in store
      store.setCurrentPage(toPage.id)

      // 3. Page bounds verification and viewport calculation for incoming page
      const clamped = clampElementsToPage(toElements, toDims)
      const fit = calculatePageFit({
        pageWidth: toDims.width,
        pageHeight: toDims.height,
        viewportWidth: 1200,
        viewportHeight: 900,
        padding: 48
      })

      const elapsed = performance.now() - start
      times.push(elapsed)

      expect(clamped).toBe(toElements) // No violation, fast path preserves reference
      expect(fit.zoom).toBeGreaterThan(0)
    }

    const averageMs = times.reduce((a, b) => a + b, 0) / times.length
    const maxMs = Math.max(...times)

    // Both average and max switch times must be well under 50ms
    expect(averageMs).toBeLessThan(50)
    expect(maxMs).toBeLessThan(50)
  })
})
