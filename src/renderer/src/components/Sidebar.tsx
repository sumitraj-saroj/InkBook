import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent,
  type KeyboardEvent
} from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { PageContextMenu, type ContextMenuPosition } from './PageContextMenu'
import { PageThumbnail } from './PageThumbnail'

export function Sidebar(): React.JSX.Element {
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setCurrentPage = useNotebookStore((s) => s.setCurrentPage)
  const addPage = useNotebookStore((s) => s.addPage)
  const deletePage = useNotebookStore((s) => s.deletePage)
  const renamePage = useNotebookStore((s) => s.renamePage)
  const duplicatePage = useNotebookStore((s) => s.duplicatePage)
  const reorderPages = useNotebookStore((s) => s.reorderPages)

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'thumbnail'>('list')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const handleStartRename = useCallback(
    (pageId: string): void => {
      const page = pages.find((p) => p.id === pageId)
      if (!page) return
      setRenameValue(page.title)
      setRenamingPageId(pageId)
    },
    [pages]
  )

  useEffect(() => {
    if (renamingPageId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingPageId])

  useEffect(() => {
    const handleRenameCurrent = (): void => {
      if (currentPageId) {
        handleStartRename(currentPageId)
      }
    }
    window.addEventListener('inkbook:rename-current-page', handleRenameCurrent)
    return (): void => {
      window.removeEventListener('inkbook:rename-current-page', handleRenameCurrent)
    }
  }, [currentPageId, handleStartRename])

  const handleCommitRename = (pageId: string): void => {
    if (renameValue.trim()) {
      renamePage(pageId, renameValue.trim())
    }
    setRenamingPageId(null)
  }

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, pageId: string): void => {
    if (e.key === 'Enter') {
      handleCommitRename(pageId)
    } else if (e.key === 'Escape') {
      setRenamingPageId(null)
    }
  }

  const handleOpenContextMenu = (e: MouseEvent, pageId: string, pageIndex: number): void => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      pageId,
      pageIndex
    })
  }

  const handleDeletePage = (pageId: string): void => {
    if (pages.length <= 1) return
    const targetPage = pages.find((p) => p.id === pageId)
    const confirmed = window.confirm(
      `Are you sure you want to delete "${targetPage?.title ?? 'this page'}"?`
    )
    if (confirmed) {
      deletePage(pageId)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Pages</span>
        <div className="sidebar-view-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={(): void => setViewMode('list')}
            title="List view"
            aria-label="List view"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'thumbnail' ? 'active' : ''}`}
            onClick={(): void => setViewMode('thumbnail')}
            title="Thumbnail view"
            aria-label="Thumbnail view"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`page-list ${viewMode === 'thumbnail' ? 'page-grid-view' : 'page-list-view'}`}
        role="list"
      >
        {pages.map((page, index) => {
          const isActive = page.id === currentPageId
          const isRenaming = page.id === renamingPageId
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index && draggedIndex !== index

          return (
            <div
              key={page.id}
              role="listitem"
              draggable={!isRenaming}
              className={`page-item ${viewMode === 'thumbnail' ? 'page-card-item' : ''} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onClick={(): void => {
                if (!isRenaming) {
                  setCurrentPage(page.id)
                }
              }}
              onContextMenu={(e): void => handleOpenContextMenu(e, page.id, index)}
              onDragStart={(e): void => {
                e.dataTransfer.setData('text/plain', String(index))
                e.dataTransfer.effectAllowed = 'move'
                setDraggedIndex(index)
              }}
              onDragOver={(e): void => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (dragOverIndex !== index) {
                  setDragOverIndex(index)
                }
              }}
              onDragLeave={(): void => {
                if (dragOverIndex === index) {
                  setDragOverIndex(null)
                }
              }}
              onDrop={(e): void => {
                e.preventDefault()
                const sourceIndexStr = e.dataTransfer.getData('text/plain')
                const sourceIndex = parseInt(sourceIndexStr, 10)
                if (!isNaN(sourceIndex) && sourceIndex !== index) {
                  reorderPages(sourceIndex, index)
                }
                setDraggedIndex(null)
                setDragOverIndex(null)
              }}
              onDragEnd={(): void => {
                setDraggedIndex(null)
                setDragOverIndex(null)
              }}
            >
              {viewMode === 'thumbnail' ? (
                <>
                  <PageThumbnail page={page} className="sidebar-card-thumb" />
                  <div className="page-card-footer">
                    <div className="page-label">
                      <span className="page-number">{index + 1}.</span>
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          className="page-rename-input"
                          value={renameValue}
                          onChange={(e): void => setRenameValue(e.target.value)}
                          onBlur={(): void => handleCommitRename(page.id)}
                          onKeyDown={(e): void => handleRenameKeyDown(e, page.id)}
                          onClick={(e): void => e.stopPropagation()}
                          maxLength={50}
                        />
                      ) : (
                        <span
                          className="page-title-text"
                          onDoubleClick={(): void => handleStartRename(page.id)}
                        >
                          {page.title}
                        </span>
                      )}
                    </div>

                    {!isRenaming && (
                      <button
                        className="page-menu-trigger"
                        title="Page options"
                        aria-label="Page options"
                        onClick={(e): void => handleOpenContextMenu(e, page.id, index)}
                      >
                        •••
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="page-item-main">
                    <PageThumbnail page={page} className="sidebar-list-thumb" />
                    <div className="page-label">
                      <span className="page-number">{index + 1}.</span>
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          className="page-rename-input"
                          value={renameValue}
                          onChange={(e): void => setRenameValue(e.target.value)}
                          onBlur={(): void => handleCommitRename(page.id)}
                          onKeyDown={(e): void => handleRenameKeyDown(e, page.id)}
                          onClick={(e): void => e.stopPropagation()}
                          maxLength={50}
                        />
                      ) : (
                        <span
                          className="page-title-text"
                          onDoubleClick={(): void => handleStartRename(page.id)}
                        >
                          {page.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isRenaming && (
                    <button
                      className="page-menu-trigger"
                      title="Page options"
                      aria-label="Page options"
                      onClick={(e): void => handleOpenContextMenu(e, page.id, index)}
                    >
                      •••
                    </button>
                  )}
                </>
              )}
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
        <span>
          {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
        </span>
        <span>{viewMode === 'list' ? 'List' : 'Thumbnails'}</span>
      </div>

      {contextMenu && (
        <PageContextMenu
          position={contextMenu}
          totalPages={pages.length}
          onClose={(): void => setContextMenu(null)}
          onRename={handleStartRename}
          onDuplicate={(id): void => {
            duplicatePage(id)
          }}
          onDelete={handleDeletePage}
          onMoveUp={(idx): void => reorderPages(idx, idx - 1)}
          onMoveDown={(idx): void => reorderPages(idx, idx + 1)}
        />
      )}
    </aside>
  )
}
