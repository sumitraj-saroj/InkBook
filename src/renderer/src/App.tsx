import { serializeAsJSON, restore } from '@excalidraw/excalidraw'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'
import { NotebookTitle } from './components/NotebookTitle'
import { Sidebar } from './components/Sidebar'
import { useTheme } from './context/ThemeContext'
import { ThemeProvider } from './context/ThemeProvider'
import { useEditor } from './context/EditorContext'
import { EditorProvider } from './context/EditorProvider'

function Workspace(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const { excalidrawAPI } = useEditor()

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
