import { describe, it, expect, beforeEach } from 'vitest'
import { useNotebookStore } from '../src/renderer/src/store/notebookStore'

describe('Page Footer & Navigation Logic', () => {
  beforeEach(() => {
    useNotebookStore.getState().newNotebook()
  })

  it('tracks current page and total pages correctly', () => {
    const state = useNotebookStore.getState()
    expect(state.currentNotebook.pages).toHaveLength(1)
    const firstPageId = state.currentNotebook.pages[0]!.id
    expect(state.currentPageId).toBe(firstPageId)

    // Add 2 more pages
    state.addPage()
    state.addPage()
    const updated = useNotebookStore.getState()
    expect(updated.currentNotebook.pages).toHaveLength(3)

    const currentIndex = updated.currentNotebook.pages.findIndex(
      (p) => p.id === updated.currentPageId
    )
    expect(currentIndex).toBe(2) // newly added page becomes current
  })

  it('switches between pages via previous and next', () => {
    const store = useNotebookStore.getState()
    store.addPage()
    store.addPage()
    const pages = useNotebookStore.getState().currentNotebook.pages
    expect(pages).toHaveLength(3)

    // Set to middle page
    useNotebookStore.getState().setCurrentPage(pages[1]!.id)
    expect(useNotebookStore.getState().currentPageId).toBe(pages[1]!.id)

    // Next page
    useNotebookStore.getState().setCurrentPage(pages[2]!.id)
    expect(useNotebookStore.getState().currentPageId).toBe(pages[2]!.id)

    // Previous page
    useNotebookStore.getState().setCurrentPage(pages[0]!.id)
    expect(useNotebookStore.getState().currentPageId).toBe(pages[0]!.id)
  })
})
