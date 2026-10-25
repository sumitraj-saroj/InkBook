import { useState, useRef, useEffect, type MouseEvent, type KeyboardEvent } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { PageContextMenu, type ContextMenuPosition } from './PageContextMenu'

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
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingPageId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingPageId])

  const handleStartRename = (pageId: string): void => {
    const page = pages.find((p) => p.id === pageId)
    if (!page) return
    setRenameValue(page.title)
    setRenamingPageId(pageId)
  }

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
      </div>

      <div className="page-list" role="list">
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
              className={`page-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
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
