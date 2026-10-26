import { describe, it, expect, beforeEach } from 'vitest'
import { useNotebookStore } from '../src/renderer/src/store/notebookStore'

describe('Notebook Zustand Store', () => {
  beforeEach(() => {
    // Reset store with a fresh default notebook
    useNotebookStore.getState().newNotebook('Test Notebook')
  })

  it('initializes with a default notebook and 1 page', () => {
    const state = useNotebookStore.getState()
    expect(state.currentNotebook.name).toBe('Test Notebook')
    expect(state.currentNotebook.pages).toHaveLength(1)
    expect(state.currentPageId).toBe(state.currentNotebook.pages[0]?.id)
    expect(state.isDirty).toBe(false)
  })

  it('adds a new page and switches active page', () => {
    const store = useNotebookStore.getState()
    const page2 = store.addPage('A4', 'portrait', 'grid')

    const state = useNotebookStore.getState()
    expect(state.currentNotebook.pages).toHaveLength(2)
    expect(state.currentPageId).toBe(page2.id)
    expect(page2.title).toBe('Page 2')
    expect(page2.background).toBe('grid')
    expect(state.isDirty).toBe(true)
  })

  it('renames a page cleanly', () => {
    const store = useNotebookStore.getState()
    const page1Id = store.currentNotebook.pages[0]!.id

    store.renamePage(page1Id, '  Introduction  ')
    expect(useNotebookStore.getState().currentNotebook.pages[0]?.title).toBe('Introduction')
    expect(useNotebookStore.getState().isDirty).toBe(true)

    // Should ignore empty rename
    store.renamePage(page1Id, '   ')
    expect(useNotebookStore.getState().currentNotebook.pages[0]?.title).toBe('Introduction')
  })

  it('reorders pages correctly within bounds', () => {
    const store = useNotebookStore.getState()
    const page2 = store.addPage('A4', 'portrait', 'ruled')
    const page3 = store.addPage('A4', 'portrait', 'blank')

    const page1Id = store.currentNotebook.pages[0]!.id
    const page2Id = page2.id
    const page3Id = page3.id

    // Initial order: [page1, page2, page3]
    store.reorderPages(0, 2)
    // New order: [page2, page3, page1]
    const pages = useNotebookStore.getState().currentNotebook.pages
    expect(pages[0]?.id).toBe(page2Id)
    expect(pages[1]?.id).toBe(page3Id)
    expect(pages[2]?.id).toBe(page1Id)

    // Invalid index reorder should no-op
    store.reorderPages(-1, 5)
    expect(useNotebookStore.getState().currentNotebook.pages[0]?.id).toBe(page2Id)
  })

  it('deletes a page and updates active page ID to adjacent page', () => {
    const store = useNotebookStore.getState()
    const page2 = store.addPage('A4', 'portrait', 'ruled')
    const page3 = store.addPage('A4', 'portrait', 'dots')

    // Current page is page3. Switch to page2 and delete it.
    store.setCurrentPage(page2.id)
    const deleted = store.deletePage(page2.id)

    expect(deleted).toBe(true)
    const state = useNotebookStore.getState()
    expect(state.currentNotebook.pages).toHaveLength(2)
    expect(state.currentNotebook.pages.some((p) => p.id === page2.id)).toBe(false)
    // Current page should have switched to page3 (adjacent index) or page1
    expect(state.currentPageId).toBe(page3.id)
  })

  it('prevents deleting the last remaining page', () => {
    const store = useNotebookStore.getState()
    expect(store.currentNotebook.pages).toHaveLength(1)
    const onlyPageId = store.currentNotebook.pages[0]!.id

    const deleted = store.deletePage(onlyPageId)
    expect(deleted).toBe(false)
    expect(useNotebookStore.getState().currentNotebook.pages).toHaveLength(1)
  })

  it('duplicates a page preserving elements and scene data', () => {
    const store = useNotebookStore.getState()
    const page1Id = store.currentNotebook.pages[0]!.id

    // Put some elements in page 1
    store.updatePageScene(page1Id, {
      elements: [{ id: 'el-1', type: 'rectangle' }],
      appState: { viewBackgroundColor: '#ff0000', openMenu: 'transient' }
    })

    const duplicate = store.duplicatePage(page1Id)
    expect(duplicate).not.toBeNull()
    expect(duplicate?.id).not.toBe(page1Id)
    expect(duplicate?.title).toBe('Page 1 (Copy)')
    expect(duplicate?.scene.elements).toHaveLength(1)
    // Transient appState was sanitized on updatePageScene
    const rawState = duplicate?.scene.appState as Record<string, unknown>
    expect(rawState?.['openMenu']).toBeUndefined()

    const state = useNotebookStore.getState()
    expect(state.currentNotebook.pages).toHaveLength(2)
    expect(state.currentPageId).toBe(duplicate?.id)
  })

  it('renames notebook and marks dirty', () => {
    const store = useNotebookStore.getState()
    store.renameNotebook('  My New InkBook  ')

    const state = useNotebookStore.getState()
    expect(state.currentNotebook.name).toBe('My New InkBook')
    expect(state.isDirty).toBe(true)
  })

  it('handles filePath and markClean correctly', () => {
    const store = useNotebookStore.getState()
    expect(store.filePath).toBeNull()

    store.setFilePath('/path/to/notes.inkbook')
    expect(useNotebookStore.getState().filePath).toBe('/path/to/notes.inkbook')

    store.renameNotebook('Dirty Notebook')
    expect(useNotebookStore.getState().isDirty).toBe(true)

    store.markClean()
    expect(useNotebookStore.getState().isDirty).toBe(false)
  })

  it('updates notebook and filePath via setCurrentNotebook', () => {
    const store = useNotebookStore.getState()
    const customNotebook = {
      ...store.currentNotebook,
      id: 'custom-nb-1',
      name: 'Custom Loaded Notebook'
    }

    store.setCurrentNotebook(customNotebook, '/custom/path/book.inkbook')
    const state = useNotebookStore.getState()
    expect(state.currentNotebook.id).toBe('custom-nb-1')
    expect(state.currentNotebook.name).toBe('Custom Loaded Notebook')
    expect(state.filePath).toBe('/custom/path/book.inkbook')
    expect(state.isDirty).toBe(false)
  })

  it('allocates the next free page number and normalizes lone leftover default page titles', () => {
    const store = useNotebookStore.getState()
    // Initial page must be Page 1
    expect(store.currentNotebook.pages[0]?.title).toBe('Page 1')

    // Add Page 2 and Page 3
    const p2 = store.addPage()
    const p3 = store.addPage()
    expect(p2.title).toBe('Page 2')
    expect(p3.title).toBe('Page 3')

    // Delete Page 2 -> remaining: Page 1, Page 3. Next free number should be 2.
    store.deletePage(p2.id)
    const newP2 = store.addPage()
    expect(newP2.title).toBe('Page 2')

    // Now delete Page 1 and newP2 -> only Page 3 remains.
    // Lone default page should be normalized to Page 1 so there is never a leftover "Page 3" on a 1-page notebook.
    const p1Id = store.currentNotebook.pages[0]!.id
    store.deletePage(p1Id)
    store.deletePage(newP2.id)

    const remainingPages = useNotebookStore.getState().currentNotebook.pages
    expect(remainingPages).toHaveLength(1)
    expect(remainingPages[0]?.title).toBe('Page 1')

    // Adding next page gives Page 2
    const nextP = store.addPage()
    expect(nextP.title).toBe('Page 2')
  })
})
