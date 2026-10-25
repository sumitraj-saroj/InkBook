import { useEffect, useCallback } from 'react'
import { serializeAsJSON, restore, CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { AppState } from '@excalidraw/excalidraw/types'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'
import { NotebookTitle } from './components/NotebookTitle'
import { Sidebar } from './components/Sidebar'
import { useTheme } from './context/ThemeContext'
import { ThemeProvider } from './context/ThemeProvider'
import { useEditor } from './context/EditorContext'
import { EditorProvider } from './context/EditorProvider'
import { useNotebookStore } from './store/notebookStore'
import { calculatePageFit, getPageDimensions } from '@shared/index'

function Workspace(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const { excalidrawAPI } = useEditor()
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)

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

  // Global Ctrl+0 shortcut to fit page to window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault()
        handleFitToWindow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFitToWindow])

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
            onClick={handleFitToWindow}
            title="Fit page to window (Ctrl+0)"
          >
            Fit page
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
