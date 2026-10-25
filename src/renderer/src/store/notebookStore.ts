import { create } from 'zustand'
import {
  CURRENT_NOTEBOOK_VERSION,
  getPresetDimensions,
  sanitizeAppState,
  type Notebook,
  type Page,
  type PageBackground,
  type PageOrientation,
  type PagePreset
} from '@shared/index'

export function createDefaultPage(
  pageNumber: number,
  preset: PagePreset = 'A4',
  orientation: PageOrientation = 'portrait',
  background: PageBackground = 'ruled'
): Page {
  const dimensions =
    preset === 'custom' ? { width: 794, height: 1123 } : getPresetDimensions(preset, orientation)

  return {
    id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: `Page ${pageNumber}`,
    size: {
      preset,
      width: dimensions.width,
      height: dimensions.height
    },
    orientation,
    background,
    scene: {
      elements: [],
      appState: { viewBackgroundColor: 'transparent' },
      files: {}
    }
  }
}

export function createDefaultNotebook(name: string = 'Untitled Notebook'): Notebook {
  const now = new Date().toISOString()
  const initialPage = createDefaultPage(1)

  return {
    format: 'inkbook',
    version: CURRENT_NOTEBOOK_VERSION,
    id: `nb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    createdAt: now,
    updatedAt: now,
    pages: [initialPage]
  }
}

export interface NotebookState {
  currentNotebook: Notebook
  currentPageId: string
  isDirty: boolean

  // Actions
  newNotebook: (name?: string) => void
  setCurrentNotebook: (notebook: Notebook) => void
  renameNotebook: (name: string) => void
  addPage: (preset?: PagePreset, orientation?: PageOrientation, background?: PageBackground) => Page
  duplicatePage: (pageId: string) => Page | null
  deletePage: (pageId: string) => boolean
  renamePage: (pageId: string, title: string) => void
  reorderPages: (startIndex: number, endIndex: number) => void
  setCurrentPage: (pageId: string) => void
  updatePageScene: (
    pageId: string,
    scene: {
      elements?: readonly unknown[]
      appState?: Record<string, unknown>
      files?: Record<string, unknown>
    }
  ) => void
  setPageBackground: (pageId: string, background: PageBackground) => void
  markClean: () => void
}

const initialNotebook = createDefaultNotebook()

export const useNotebookStore = create<NotebookState>((set, get) => ({
  currentNotebook: initialNotebook,
  currentPageId: initialNotebook.pages[0]?.id ?? '',
  isDirty: false,

  newNotebook: (name?: string): void => {
    const notebook = createDefaultNotebook(name)
    set({
      currentNotebook: notebook,
      currentPageId: notebook.pages[0]?.id ?? '',
      isDirty: false
    })
  },

  setCurrentNotebook: (notebook: Notebook): void => {
    set({
      currentNotebook: notebook,
      currentPageId: notebook.pages[0]?.id ?? '',
      isDirty: false
    })
  },

  renameNotebook: (name: string): void => {
    const trimmed = name.trim()
    if (!trimmed) return

    set((state) => ({
      currentNotebook: {
        ...state.currentNotebook,
        name: trimmed,
        updatedAt: new Date().toISOString()
      },
      isDirty: true
    }))
  },

  addPage: (
    preset: PagePreset = 'A4',
    orientation: PageOrientation = 'portrait',
    background: PageBackground = 'ruled'
  ): Page => {
    const state = get()
    const nextNumber = state.currentNotebook.pages.length + 1
    const newPage = createDefaultPage(nextNumber, preset, orientation, background)

    set((s) => ({
      currentNotebook: {
        ...s.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: [...s.currentNotebook.pages, newPage]
      },
      currentPageId: newPage.id,
      isDirty: true
    }))

    return newPage
  },

  duplicatePage: (pageId: string): Page | null => {
    const state = get()
    const pageIndex = state.currentNotebook.pages.findIndex((p) => p.id === pageId)
    if (pageIndex === -1) return null

    const sourcePage = state.currentNotebook.pages[pageIndex]
    if (!sourcePage) return null

    const duplicate: Page = {
      ...sourcePage,
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: `${sourcePage.title} (Copy)`,
      scene: {
        elements: [...sourcePage.scene.elements],
        appState: { ...sourcePage.scene.appState },
        files: { ...sourcePage.scene.files }
      }
    }

    const updatedPages = [...state.currentNotebook.pages]
    updatedPages.splice(pageIndex + 1, 0, duplicate)

    set({
      currentNotebook: {
        ...state.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: updatedPages
      },
      currentPageId: duplicate.id,
      isDirty: true
    })

    return duplicate
  },

  deletePage: (pageId: string): boolean => {
    const state = get()
    // Never allow deleting the last remaining page
    if (state.currentNotebook.pages.length <= 1) {
      return false
    }

    const pageIndex = state.currentNotebook.pages.findIndex((p) => p.id === pageId)
    if (pageIndex === -1) return false

    const updatedPages = state.currentNotebook.pages.filter((p) => p.id !== pageId)
    let newCurrentPageId = state.currentPageId

    if (state.currentPageId === pageId) {
      // Pick adjacent page (previous if available, else new page at same index)
      const nextIndex = Math.min(pageIndex, updatedPages.length - 1)
      const nextSelected = updatedPages[nextIndex]
      if (nextSelected) {
        newCurrentPageId = nextSelected.id
      }
    }

    set({
      currentNotebook: {
        ...state.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: updatedPages
      },
      currentPageId: newCurrentPageId,
      isDirty: true
    })

    return true
  },

  renamePage: (pageId: string, title: string): void => {
    const trimmed = title.trim()
    if (!trimmed) return

    set((state) => ({
      currentNotebook: {
        ...state.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: state.currentNotebook.pages.map((p) =>
          p.id === pageId ? { ...p, title: trimmed } : p
        )
      },
      isDirty: true
    }))
  },

  reorderPages: (startIndex: number, endIndex: number): void => {
    const state = get()
    if (
      startIndex < 0 ||
      startIndex >= state.currentNotebook.pages.length ||
      endIndex < 0 ||
      endIndex >= state.currentNotebook.pages.length ||
      startIndex === endIndex
    ) {
      return
    }

    const updatedPages = [...state.currentNotebook.pages]
    const [moved] = updatedPages.splice(startIndex, 1)
    if (!moved) return

    updatedPages.splice(endIndex, 0, moved)

    set({
      currentNotebook: {
        ...state.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: updatedPages
      },
      isDirty: true
    })
  },

  setCurrentPage: (pageId: string): void => {
    const state = get()
    if (state.currentPageId === pageId) return
    const exists = state.currentNotebook.pages.some((p) => p.id === pageId)
    if (exists) {
      set({ currentPageId: pageId })
    }
  },

  updatePageScene: (
    pageId: string,
    scene: {
      elements?: readonly unknown[]
      appState?: Record<string, unknown>
      files?: Record<string, unknown>
    }
  ): void => {
    set((state) => {
      const page = state.currentNotebook.pages.find((p) => p.id === pageId)
      if (!page) return state

      const updatedElements = scene.elements ?? page.scene.elements
      const updatedFiles = scene.files ?? page.scene.files
      const updatedAppState = scene.appState
        ? sanitizeAppState(scene.appState)
        : page.scene.appState

      return {
        currentNotebook: {
          ...state.currentNotebook,
          updatedAt: new Date().toISOString(),
          pages: state.currentNotebook.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  scene: {
                    elements: updatedElements,
                    appState: updatedAppState,
                    files: updatedFiles
                  }
                }
              : p
          )
        },
        isDirty: true
      }
    })
  },

  setPageBackground: (pageId: string, background: PageBackground): void => {
    set((state) => ({
      currentNotebook: {
        ...state.currentNotebook,
        updatedAt: new Date().toISOString(),
        pages: state.currentNotebook.pages.map((p) => (p.id === pageId ? { ...p, background } : p))
      },
      isDirty: true
    }))
  },

  markClean: (): void => {
    set({ isDirty: false })
  }
}))
