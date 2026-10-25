import { useState } from 'react'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'

interface MockPage {
  id: string
  title: string
  background: 'blank' | 'ruled' | 'grid' | 'dotted'
}

function App(): React.JSX.Element {
  const [pages] = useState<MockPage[]>([
    { id: 'page-1', title: 'Page 1', background: 'ruled' },
    { id: 'page-2', title: 'Page 2', background: 'grid' }
  ])
  const [activePageId, setActivePageId] = useState<string>('page-1')
  const notebookName = 'Untitled Notebook'

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0]

  return (
    <div className="app-container">
      {/* Top Bar: Notebook title at top-left */}
      <header className="topbar">
        <div className="notebook-meta">
          <span className="notebook-badge">InkBook</span>
          <span className="notebook-title">{notebookName}</span>
          <span className="page-indicator">• {activePage?.title ?? 'Page 1'}</span>
        </div>
        <div className="app-actions">
          <span>Dark Theme</span>
        </div>
      </header>

      {/* Main workspace with 2-panel layout */}
      <div className="workspace-body">
        {/* Left Sidebar: 240px */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Pages</span>
            <button
              className="btn-add-page"
              title="Add Page (placeholder)"
              aria-label="Add Page"
              onClick={(): void => {
                // Placeholder for adding page
              }}
            >
              +
            </button>
          </div>

          <div className="page-list">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className={`page-item ${page.id === activePageId ? 'active' : ''}`}
                onClick={(): void => setActivePageId(page.id)}
              >
                <div className="page-label">
                  <span className="page-index">#{index + 1}</span>
                  <span>{page.title}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <span>{pages.length} Pages</span>
            <span>A4 Portrait</span>
          </div>
        </aside>

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

export default App
