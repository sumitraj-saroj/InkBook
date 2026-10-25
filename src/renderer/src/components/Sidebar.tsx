import { useNotebookStore } from '../store/notebookStore'

export function Sidebar(): React.JSX.Element {
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setCurrentPage = useNotebookStore((s) => s.setCurrentPage)
  const addPage = useNotebookStore((s) => s.addPage)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Pages</span>
      </div>

      <div className="page-list" role="list">
        {pages.map((page, index) => {
          const isActive = page.id === currentPageId
          return (
            <div
              key={page.id}
              role="listitem"
              className={`page-item ${isActive ? 'active' : ''}`}
              onClick={(): void => setCurrentPage(page.id)}
            >
              <div className="page-label">
                <span className="page-number">{index + 1}.</span>
                <span className="page-title-text">{page.title}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sidebar-actions">
        <button
          className="btn-add-page-action"
          onClick={(): void => {
            addPage()
          }}
          title="Add a new page"
        >
          <span className="btn-add-icon">+</span>
          <span>Add page</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <span>{pages.length} Pages</span>
        <span>A4 Portrait</span>
      </div>
    </aside>
  )
}
