import { useEffect, useCallback, useState } from 'react'
import { CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { AppState } from '@excalidraw/excalidraw/types'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'
import { TopBar } from './components/TopBar'
import { AboutDialog } from './components/AboutDialog'
import { Sidebar } from './components/Sidebar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ExportDialog } from './components/ExportDialog'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsHelpDialog } from './components/ShortcutsHelpDialog'
import { PageSettingsDialog } from './components/PageSettingsDialog'
import { SearchDialog } from './components/SearchDialog'
import { PageFooter } from './components/PageFooter'
import { useTheme } from './context/ThemeContext'
import { ThemeProvider } from './context/ThemeProvider'
import { useEditor } from './context/EditorContext'
import { EditorProvider } from './context/EditorProvider'
import { useNotebookStore } from './store/notebookStore'
import type { SearchResult } from '@shared/index'
import { useAutosave } from './hooks/useAutosave'
import { useRecovery } from './hooks/useRecovery'
import {
  importExcalidrawAsNewPage,
  importExcalidrawIntoCurrentPage,
  importExcalidrawLibrary
} from './utils/importUtils'
import type { BoundedElement } from '@shared/pageBounds'
import type { BinaryFiles } from '@excalidraw/excalidraw/types'

function Workspace(): React.JSX.Element {
  useAutosave()
  useRecovery()
  const { theme } = useTheme()
  const { excalidrawAPI, fitPage } = useEditor()
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const filePath = useNotebookStore((s) => s.filePath)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const newNotebook = useNotebookStore((s) => s.newNotebook)
  const setCurrentNotebook = useNotebookStore((s) => s.setCurrentNotebook)
  const setCurrentPage = useNotebookStore((s) => s.setCurrentPage)
  const addPage = useNotebookStore((s) => s.addPage)
  const setFilePath = useNotebookStore((s) => s.setFilePath)
  const markClean = useNotebookStore((s) => s.markClean)

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'excalidraw' | 'pdf'>('png')
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('inkbook-sidebar-width')
      if (saved) {
        const p = parseInt(saved, 10)
        if (p >= 200 && p <= 360) return p
      }
    } catch {
      // ignore
    }
    return 240
  })

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('inkbook-sidebar-collapsed')
      if (saved) return saved === 'true'
    } catch {
      // ignore
    }
    return false
  })

  useEffect(() => {
    window.api
      ?.getSettings?.()
      .then((settings) => {
        if (
          typeof settings?.sidebarWidth === 'number' &&
          settings.sidebarWidth >= 200 &&
          settings.sidebarWidth <= 360
        ) {
          setSidebarWidth(settings.sidebarWidth)
        }
        if (typeof settings?.sidebarCollapsed === 'boolean') {
          setIsSidebarCollapsed(settings.sidebarCollapsed)
        }
      })
      .catch(() => {})
  }, [])

  const handleToggleSidebar = useCallback((): void => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('inkbook-sidebar-collapsed', String(next))
      } catch {
        // ignore
      }
      window.api?.saveSettings?.({ sidebarCollapsed: next }).catch(() => {})
      return next
    })
  }, [])

  const handleSidebarWidthChange = useCallback((newWidth: number): void => {
    setSidebarWidth(newWidth)
    try {
      localStorage.setItem('inkbook-sidebar-width', String(newWidth))
    } catch {
      // ignore
    }
    window.api?.saveSettings?.({ sidebarWidth: newWidth }).catch(() => {})
  }, [])

  const handleOpenExport = useCallback((format: 'png' | 'svg' | 'pdf' | 'excalidraw'): void => {
    setExportFormat(format)
    setIsExportOpen(true)
  }, [])

  const handleSelectSearchResult = useCallback(
    (result: SearchResult): void => {
      setCurrentPage(result.pageId)
      if (result.type === 'page') {
        setTimeout(() => {
          fitPage()
        }, 30)
      } else if (result.type === 'text' && result.elementId) {
        setTimeout(() => {
          if (excalidrawAPI) {
            excalidrawAPI.updateScene({
              appState: {
                selectedElementIds: { [result.elementId!]: true }
              } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
              captureUpdate: CaptureUpdateAction.NEVER
            })
            const elements = excalidrawAPI.getSceneElements()
            const targetEl = elements.find((el) => el.id === result.elementId)
            if (targetEl) {
              excalidrawAPI.scrollToContent([targetEl], {
                fitToViewport: false,
                animate: true
              })
            }
          }
        }, 50)
      }
    },
    [setCurrentPage, fitPage, excalidrawAPI]
  )

  const handleNextPage = useCallback((): void => {
    const currentIndex = currentNotebook.pages.findIndex((p) => p.id === currentPageId)
    if (currentIndex !== -1 && currentIndex < currentNotebook.pages.length - 1) {
      const nextId = currentNotebook.pages[currentIndex + 1]!.id
      setCurrentPage(nextId)
    }
  }, [currentNotebook.pages, currentPageId, setCurrentPage])

  const handlePrevPage = useCallback((): void => {
    const currentIndex = currentNotebook.pages.findIndex((p) => p.id === currentPageId)
    if (currentIndex > 0) {
      const prevId = currentNotebook.pages[currentIndex - 1]!.id
      setCurrentPage(prevId)
    }
  }, [currentNotebook.pages, currentPageId, setCurrentPage])

  const handleNewNotebook = useCallback((): void => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Create a new notebook anyway?'
      )
      if (!confirmDiscard) return
    }
    newNotebook()
  }, [isDirty, newNotebook])

  const handleOpenNotebook = useCallback(async (): Promise<void> => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Open another notebook anyway?'
      )
      if (!confirmDiscard) return
    }
    const result = await window.api.openNotebook()
    if (result.canceled || !result.success || !result.notebook) {
      if (result.error) {
        alert(`Failed to open notebook: ${result.error}`)
      }
      return
    }
    setCurrentNotebook(result.notebook, result.filePath ?? null)
  }, [isDirty, setCurrentNotebook])

  const handleOpenRecentPath = useCallback(
    async (path: string): Promise<void> => {
      if (isDirty) {
        const confirmDiscard = window.confirm(
          'You have unsaved changes. Open another notebook anyway?'
        )
        if (!confirmDiscard) return
      }
      const result = await window.api.openNotebook(path)
      if (result.canceled || !result.success || !result.notebook) {
        if (result.error) {
          alert(`Failed to open notebook: ${result.error}`)
        }
        return
      }
      setCurrentNotebook(result.notebook, result.filePath ?? null)
    },
    [isDirty, setCurrentNotebook]
  )

  // Check for command line file argument on startup
  useEffect(() => {
    window.api
      .getInitialFile()
      .then((path) => {
        if (path) {
          handleOpenRecentPath(path).catch(console.error)
        }
      })
      .catch(console.error)
  }, [handleOpenRecentPath])

  const handleSaveNotebook = useCallback(async (): Promise<void> => {
    const result = await window.api.saveNotebook(currentNotebook, filePath ?? undefined)
    if (result.canceled) return
    if (!result.success) {
      alert(`Failed to save notebook: ${result.error}`)
      return
    }
    if (result.filePath) {
      setFilePath(result.filePath)
    }
    markClean()
  }, [currentNotebook, filePath, setFilePath, markClean])

  const handleSaveAsNotebook = useCallback(async (): Promise<void> => {
    const result = await window.api.saveNotebookAs(currentNotebook)
    if (result.canceled) return
    if (!result.success) {
      alert(`Failed to save notebook: ${result.error}`)
      return
    }
    if (result.filePath) {
      setFilePath(result.filePath)
    }
    markClean()
  }, [currentNotebook, setFilePath, markClean])

  const handleImportAsNewPage = useCallback(async (): Promise<void> => {
    const res = await window.api.openExcalidrawFile()
    if (res.canceled || !res.content) return

    try {
      const result = importExcalidrawAsNewPage(res.content, res.filePath)
      if (excalidrawAPI) {
        if (result.files && Object.keys(result.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(result.files))
        }
        excalidrawAPI.updateScene({
          elements: result.elements as unknown as Parameters<
            typeof excalidrawAPI.updateScene
          >[0]['elements'],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY
        })
        fitPage()
      }
    } catch (err) {
      console.error('Failed to import .excalidraw:', err)
      alert(`Failed to import file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [excalidrawAPI, fitPage])

  const handleImportIntoCurrentPage = useCallback(async (): Promise<void> => {
    const page = currentNotebook.pages.find((p) => p.id === currentPageId)
    if (!page) return

    const res = await window.api.openExcalidrawFile()
    if (res.canceled || !res.content) return

    try {
      const liveElements = excalidrawAPI
        ? (excalidrawAPI.getSceneElements() as unknown as readonly BoundedElement[])
        : undefined
      const liveFiles = excalidrawAPI ? (excalidrawAPI.getFiles() as BinaryFiles) : undefined

      const result = importExcalidrawIntoCurrentPage(res.content, page, liveElements, liveFiles)

      if (excalidrawAPI) {
        if (result.newFiles && Object.keys(result.newFiles).length > 0) {
          excalidrawAPI.addFiles(Object.values(result.newFiles))
        }
        excalidrawAPI.updateScene({
          elements: result.mergedElements as unknown as Parameters<
            typeof excalidrawAPI.updateScene
          >[0]['elements'],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY
        })
        fitPage()
      }
    } catch (err) {
      console.error('Failed to import into current page:', err)
      alert(
        `Failed to import into current page: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }, [currentNotebook.pages, currentPageId, excalidrawAPI, fitPage])

  const handleImportLibrary = useCallback(async (): Promise<void> => {
    if (!excalidrawAPI) return

    const res = await window.api.openExcalidrawLibraryFile()
    if (res.canceled || !res.content) return

    try {
      const count = await importExcalidrawLibrary(res.content, excalidrawAPI)
      console.log(`Imported ${count} items into Excalidraw library.`)
    } catch (err) {
      console.error('Failed to import library:', err)
      alert(`Failed to import library: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [excalidrawAPI])

  // Global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault()
        fitPage()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        if (e.shiftKey) {
          handleSaveAsNotebook()
        } else {
          handleSaveNotebook()
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.code === 'KeyO')) {
        e.preventDefault()
        handleOpenNotebook()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.code === 'KeyN')) {
        e.preventDefault()
        if (e.shiftKey) {
          addPage()
        } else {
          handleNewNotebook()
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'PageDown' || e.code === 'PageDown')) {
        e.preventDefault()
        handleNextPage()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'PageUp' || e.code === 'PageUp')) {
        e.preventDefault()
        handlePrevPage()
      } else if (e.key === 'F2') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('inkbook:rename-current-page'))
      } else if (e.key === 'F1') {
        e.preventDefault()
        setIsShortcutsHelpOpen(true)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        handleToggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [
    fitPage,
    handleSaveNotebook,
    handleSaveAsNotebook,
    handleOpenNotebook,
    handleNewNotebook,
    handleNextPage,
    handlePrevPage,
    handleToggleSidebar,
    addPage
  ])

  // Native Menu action listener
  useEffect(() => {
    const unsubscribe = window.api.onMenuAction((action, payload) => {
      switch (action) {
        case 'new-notebook':
          handleNewNotebook()
          break
        case 'open-notebook':
          handleOpenNotebook()
          break
        case 'open-recent':
          if (typeof payload === 'string') {
            handleOpenRecentPath(payload).catch(console.error)
          }
          break
        case 'show-welcome':
          setIsWelcomeOpen(true)
          break
        case 'clear-recent':
          window.api.clearRecentFiles().catch(console.error)
          break
        case 'import-new-page':
          handleImportAsNewPage().catch(console.error)
          break
        case 'import-current-page':
          handleImportIntoCurrentPage().catch(console.error)
          break
        case 'import-library':
          handleImportLibrary().catch(console.error)
          break
        case 'export-png':
          setExportFormat('png')
          setIsExportOpen(true)
          break
        case 'export-svg':
          setExportFormat('svg')
          setIsExportOpen(true)
          break
        case 'export-excalidraw':
          setExportFormat('excalidraw')
          setIsExportOpen(true)
          break
        case 'export-pdf':
          setExportFormat('pdf')
          setIsExportOpen(true)
          break
        case 'save-notebook':
          handleSaveNotebook()
          break
        case 'save-as-notebook':
          handleSaveAsNotebook()
          break
        case 'close-notebook':
          if (isDirty) {
            const confirmDiscard = window.confirm(
              'You have unsaved changes. Close this notebook anyway?'
            )
            if (!confirmDiscard) break
          }
          newNotebook()
          setIsWelcomeOpen(true)
          break
        case 'fit-page':
          fitPage()
          break
        case 'zoom-in': {
          if (excalidrawAPI) {
            const appState = excalidrawAPI.getAppState()
            const currentZoom = appState.zoom?.value ?? 1
            const nextZoom = Math.min(5.0, currentZoom * 1.2)
            excalidrawAPI.updateScene({
              appState: {
                zoom: { value: nextZoom as unknown as NonNullable<AppState['zoom']>['value'] }
              } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
              captureUpdate: CaptureUpdateAction.NEVER
            })
          }
          break
        }
        case 'zoom-out': {
          if (excalidrawAPI) {
            const appState = excalidrawAPI.getAppState()
            const currentZoom = appState.zoom?.value ?? 1
            const nextZoom = Math.max(0.1, currentZoom / 1.2)
            excalidrawAPI.updateScene({
              appState: {
                zoom: { value: nextZoom as unknown as NonNullable<AppState['zoom']>['value'] }
              } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
              captureUpdate: CaptureUpdateAction.NEVER
            })
          }
          break
        }
        case 'reset-zoom': {
          if (excalidrawAPI) {
            excalidrawAPI.updateScene({
              appState: {
                zoom: { value: 1 as unknown as NonNullable<AppState['zoom']>['value'] }
              } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
              captureUpdate: CaptureUpdateAction.NEVER
            })
          }
          break
        }
        case 'command-palette':
          setIsCommandPaletteOpen(true)
          break
        case 'shortcuts-help':
          setIsShortcutsHelpOpen(true)
          break
        case 'search-notebook':
          setIsSearchOpen(true)
          break
      }
    })
    return (): void => {
      unsubscribe()
    }
  }, [
    handleNewNotebook,
    handleOpenNotebook,
    handleOpenRecentPath,
    handleSaveNotebook,
    handleSaveAsNotebook,
    handleImportAsNewPage,
    handleImportIntoCurrentPage,
    handleImportLibrary,
    fitPage,
    isDirty,
    newNotebook,
    excalidrawAPI
  ])

  // Window title and dirty state synchronization
  useEffect(() => {
    const title = `${isDirty ? '• ' : ''}${currentNotebook.name} - InkBook`
    document.title = title
    window.api.setDirtyState(isDirty, currentNotebook.name)
  }, [isDirty, currentNotebook.name])

  // Handle save and close request from native window close event
  useEffect(() => {
    const unsubscribe = window.api.onSaveAndCloseRequest(async () => {
      await handleSaveNotebook()
      window.api.notifySaveAndCloseCompleted()
    })
    return (): void => {
      unsubscribe()
    }
  }, [handleSaveNotebook])

  return (
    <div className="app-container" data-theme={theme}>
      {/* Top Bar: Notebook title at top-left and actions */}
      <TopBar
        onSearch={(): void => setIsCommandPaletteOpen(true)}
        onExport={handleOpenExport}
        onNewNotebook={handleNewNotebook}
        onOpenNotebook={handleOpenNotebook}
        onSaveAsNotebook={handleSaveAsNotebook}
        onImportAsNewPage={handleImportAsNewPage}
        onImportIntoCurrentPage={handleImportIntoCurrentPage}
        onImportLibrary={handleImportLibrary}
        onOpenWelcome={(): void => setIsWelcomeOpen(true)}
        onOpenShortcuts={(): void => setIsShortcutsHelpOpen(true)}
        onOpenAbout={(): void => setIsAboutOpen(true)}
      />

      {/* Main workspace with 2-panel layout */}
      <div className="workspace-body">
        {/* Left Sidebar */}
        <Sidebar
          onOpenPageSettings={(): void => setIsPageSettingsOpen(true)}
          width={sidebarWidth}
          isCollapsed={isSidebarCollapsed}
          onWidthChange={handleSidebarWidthChange}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content Area */}
        <main className="canvas-area">
          <div className="editor-wrapper">
            <ExcalidrawEditor />
          </div>
          <PageFooter
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onAddPage={addPage}
            onFitPage={fitPage}
            onOpenSettings={(): void => setIsPageSettingsOpen(true)}
          />
        </main>
      </div>

      <WelcomeScreen
        isOpen={isWelcomeOpen}
        onClose={(): void => setIsWelcomeOpen(false)}
        onNewNotebook={handleNewNotebook}
        onOpenNotebook={handleOpenNotebook}
        onOpenRecentPath={handleOpenRecentPath}
      />

      <ExportDialog
        key={`${isExportOpen}-${exportFormat}`}
        isOpen={isExportOpen}
        initialFormat={exportFormat}
        onClose={(): void => setIsExportOpen(false)}
      />

      <CommandPalette
        key={String(isCommandPaletteOpen)}
        isOpen={isCommandPaletteOpen}
        onClose={(): void => setIsCommandPaletteOpen(false)}
        onFitPage={fitPage}
        onSaveNotebook={handleSaveNotebook}
        onSaveAsNotebook={handleSaveAsNotebook}
        onOpenNotebook={handleOpenNotebook}
        onNewNotebook={handleNewNotebook}
        onOpenExport={(format?: 'png' | 'svg' | 'excalidraw' | 'pdf'): void => {
          if (format) setExportFormat(format)
          setIsExportOpen(true)
        }}
        onOpenPageSettings={(): void => {
          setIsPageSettingsOpen(true)
        }}
        onOpenShortcutsHelp={(): void => {
          setIsShortcutsHelpOpen(true)
        }}
        onOpenSearch={(): void => {
          setIsSearchOpen(true)
        }}
      />

      <SearchDialog
        key={String(isSearchOpen)}
        isOpen={isSearchOpen}
        onClose={(): void => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      <PageSettingsDialog
        key={String(isPageSettingsOpen)}
        isOpen={isPageSettingsOpen}
        onClose={(): void => setIsPageSettingsOpen(false)}
        onFitPage={fitPage}
      />

      <ShortcutsHelpDialog
        isOpen={isShortcutsHelpOpen}
        onClose={(): void => setIsShortcutsHelpOpen(false)}
      />

      <AboutDialog isOpen={isAboutOpen} onClose={(): void => setIsAboutOpen(false)} />
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <EditorProvider>
        <Workspace />
      </EditorProvider>
    </ThemeProvider>
  )
}

export default App
