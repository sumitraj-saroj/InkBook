import { useEffect, useCallback, useState } from 'react'
import { serializeAsJSON, restore, CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { AppState } from '@excalidraw/excalidraw/types'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'
import { NotebookTitle } from './components/NotebookTitle'
import { Sidebar } from './components/Sidebar'
import { BackgroundPicker } from './components/BackgroundPicker'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ExportDialog } from './components/ExportDialog'
import { useTheme } from './context/ThemeContext'
import { ThemeProvider } from './context/ThemeProvider'
import { useEditor } from './context/EditorContext'
import { EditorProvider } from './context/EditorProvider'
import { useNotebookStore } from './store/notebookStore'
import { calculatePageFit, getPageDimensions } from '@shared/index'
import { useAutosave } from './hooks/useAutosave'
import { useRecovery } from './hooks/useRecovery'

function Workspace(): React.JSX.Element {
  useAutosave()
  useRecovery()
  const { theme, toggleTheme } = useTheme()
  const { excalidrawAPI } = useEditor()
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const filePath = useNotebookStore((s) => s.filePath)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const newNotebook = useNotebookStore((s) => s.newNotebook)
  const setCurrentNotebook = useNotebookStore((s) => s.setCurrentNotebook)
  const setFilePath = useNotebookStore((s) => s.setFilePath)
  const markClean = useNotebookStore((s) => s.markClean)

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  const handleFitToWindow = useCallback((): void => {
    if (!excalidrawAPI) return
    const page = currentNotebook.pages.find((p) => p.id === currentPageId)
    if (!page) return
    const dims = getPageDimensions(page)

    const editorEl = document.querySelector('.editor-container')
    const vpW = editorEl?.clientWidth || window.innerWidth - 240
    const vpH = editorEl?.clientHeight || window.innerHeight - 48

    const fit = calculatePageFit({
      pageWidth: dims.width,
      pageHeight: dims.height,
      viewportWidth: vpW,
      viewportHeight: vpH,
      padding: 48
    })

    excalidrawAPI.updateScene({
      appState: {
        scrollX: fit.scrollX,
        scrollY: fit.scrollY,
        zoom: {
          value: fit.zoom as unknown as NonNullable<AppState['zoom']>['value']
        }
      } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
      captureUpdate: CaptureUpdateAction.NEVER
    })
  }, [excalidrawAPI, currentNotebook.pages, currentPageId])

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

  // Global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault()
        handleFitToWindow()
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
        handleNewNotebook()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleFitToWindow,
    handleSaveNotebook,
    handleSaveAsNotebook,
    handleOpenNotebook,
    handleNewNotebook
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
        case 'export-png':
          setIsExportOpen(true)
          break
        case 'export-svg':
          setIsExportOpen(true)
          break
        case 'export-excalidraw':
          setIsExportOpen(true)
          break
        case 'save-notebook':
          handleSaveNotebook()
          break
        case 'save-as-notebook':
          handleSaveAsNotebook()
          break
        case 'close-notebook':
          handleNewNotebook()
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
    handleSaveAsNotebook
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

  const handleOpen = async (): Promise<void> => {
    if (!excalidrawAPI) return
    const result = await window.api.openExcalidrawFile()
    if (result.canceled || !result.content) return

    try {
      const data = JSON.parse(result.content) as Parameters<typeof restore>[0]
      const restored = restore(data, null, null)
      if (restored.files) {
        excalidrawAPI.addFiles(Object.values(restored.files))
      }
      excalidrawAPI.updateScene({
        elements: restored.elements,
        appState: restored.appState
      })
      excalidrawAPI.scrollToContent(restored.elements, { fitToViewport: true })
    } catch (err) {
      console.error('Failed to parse or restore .excalidraw file:', err)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!excalidrawAPI) return
    const elements = excalidrawAPI.getSceneElements()
    const appState = excalidrawAPI.getAppState()
    const files = excalidrawAPI.getFiles()

    const json = serializeAsJSON(elements, appState, files, 'local')
    await window.api.saveExcalidrawFile(json)
  }

  return (
    <div className="app-container" data-theme={theme}>
      {/* Top Bar: Notebook title at top-left and actions */}
      <header className="topbar">
        <div className="notebook-meta">
          <span className="notebook-badge">InkBook</span>
          <NotebookTitle />
        </div>
        <div className="app-actions">
          <button
            className="action-btn"
            onClick={(): void => setIsWelcomeOpen(true)}
            title="Open Welcome screen"
          >
            Welcome
          </button>
          <button className="action-btn" onClick={handleNewNotebook} title="New notebook (Ctrl+N)">
            New
          </button>
          <button
            className="action-btn"
            onClick={handleOpenNotebook}
            title="Open notebook (Ctrl+O)"
          >
            Open
          </button>
          <button
            className="action-btn"
            onClick={handleSaveNotebook}
            title={`Save notebook (Ctrl+S)${isDirty ? ' •' : ''}`}
          >
            Save{isDirty ? ' •' : ''}
          </button>
          <BackgroundPicker />
          <button
            className="action-btn"
            onClick={handleFitToWindow}
            title="Fit page to window (Ctrl+0)"
          >
            Fit page
          </button>
          <button
            className="action-btn"
            onClick={handleOpen}
            title="Open an Excalidraw drawing file"
          >
            Open .excalidraw
          </button>
          <button className="action-btn" onClick={handleSave} title="Save drawing as .excalidraw">
            Save .excalidraw
          </button>
          <button
            className="action-btn"
            onClick={(): void => setIsExportOpen(true)}
            title="Export page or notebook"
          >
            Export
          </button>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      {/* Main workspace with 2-panel layout */}
      <div className="workspace-body">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="canvas-area">
          <div className="editor-wrapper">
            <ExcalidrawEditor />
          </div>
        </main>
      </div>

      <WelcomeScreen
        isOpen={isWelcomeOpen}
        onClose={(): void => setIsWelcomeOpen(false)}
        onNewNotebook={handleNewNotebook}
        onOpenNotebook={handleOpenNotebook}
        onOpenRecentPath={handleOpenRecentPath}
      />

      <ExportDialog isOpen={isExportOpen} onClose={(): void => setIsExportOpen(false)} />
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
