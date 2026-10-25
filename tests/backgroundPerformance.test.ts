import { describe, it, expect } from 'vitest'
import { useNotebookStore } from '../src/renderer/src/store/notebookStore'
import { clampElementsToPage, BoundedElement } from '../src/shared'

describe('background and performance', () => {
  it('preserves per-page backgrounds on page switch and does not pollute scene elements', () => {
    const store = useNotebookStore.getState()
    store.newNotebook('Test Notebook')

    // Page 1: set to 'ruled'
    const page1Id = useNotebookStore.getState().currentPageId
    store.setPageBackground(page1Id, 'ruled')

    // Page 2: add and set to 'grid'
    const p2Page = store.addPage('A4', 'portrait', 'grid')
    const page2Id = p2Page.id

    // Page 3: add and set to 'dots'
    const p3Page = store.addPage('A4', 'portrait', 'dots')
    const page3Id = p3Page.id

    const notebook = useNotebookStore.getState().currentNotebook
    const p1 = notebook.pages.find((p) => p.id === page1Id)!
    const p2 = notebook.pages.find((p) => p.id === page2Id)!
    const p3 = notebook.pages.find((p) => p.id === page3Id)!

    expect(p1.background).toBe('ruled')
    expect(p2.background).toBe('grid')
    expect(p3.background).toBe('dots')

    // Ensure elements array is clean and does not contain any background objects
    expect(p1.scene.elements).toEqual([])
    expect(p2.scene.elements).toEqual([])
    expect(p3.scene.elements).toEqual([])
  })

  it('maintains high performance with 500+ elements (< 16ms per clamp evaluation for 60fps)', () => {
    const a4Page = { width: 794, height: 1123 }
    const elements: BoundedElement[] = []

    for (let i = 0; i < 500; i++) {
      elements.push({
        id: `el-${i}`,
        type: i % 2 === 0 ? 'rectangle' : 'ellipse',
        x: (i * 13) % 700,
        y: (i * 17) % 1000,
        width: 30,
        height: 30,
        angle: 0
      })
    }

    const start = performance.now()
    const clamped = clampElementsToPage(elements, a4Page)
    const elapsed = performance.now() - start

    expect(clamped).toBe(elements) // Identity reference if all are inside
    // Must process 500 elements in well under 16ms (one 60fps frame budget)
    expect(elapsed).toBeLessThan(16)
  })
})
