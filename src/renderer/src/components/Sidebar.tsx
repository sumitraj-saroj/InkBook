import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent,
  type KeyboardEvent
} from 'react'
import { List, LayoutGrid, Plus, MoreHorizontal } from 'lucide-react'
import { useNotebookStore } from '../store/notebookStore'
import { PageContextMenu, type ContextMenuPosition } from './PageContextMenu'
import { PageThumbnail } from './PageThumbnail'
import { SegmentedControl } from './ui'

export interface SidebarProps {
  onOpenPageSettings?: () => void
  width?: number
  isCollapsed?: boolean
  onWidthChange?: (width: number) => void
  onToggleCollapse?: () => void
}

export function Sidebar({
  onOpenPageSettings,
  width,
  isCollapsed,
  onWidthChange
}: SidebarProps): React.JSX.Element {
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setCurrentPage = useNotebookStore((s) => s.setCurrentPage)
  const addPage = useNotebookStore((s) => s.addPage)
  const deletePage = useNotebookStore((s) => s.deletePage)
  const renamePage = useNotebookStore((s) => s.renamePage)
  const duplicatePage = useNotebookStore((s) => s.duplicatePage)
  const reorderPages = useNotebookStore((s) => s.reorderPages)

  const [localWidth, setLocalWidth] = useState<number>(() => {
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

  const activeWidth = width ?? localWidth
  const activeCollapsed = Boolean(isCollapsed)

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const pageListRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'thumbnail'>(() => {
    try {
      const saved = localStorage.getItem('inkbook-sidebar-view-mode')
      if (saved === 'thumbnail' || saved === 'list') return saved
    } catch {
      // ignore
    }
    return 'list'
  })
  const [isResizing, setIsResizing] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const handleStartResize = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = activeWidth

    const handleMouseMove = (moveEvent: globalThis.MouseEvent): void => {
      const delta = moveEvent.clientX - startX
      const nextWidth = Math.max(200, Math.min(360, startWidth + delta))
      if (onWidthChange) {
        onWidthChange(nextWidth)
      } else {
        setLocalWidth(nextWidth)
      }
    }

    const handleMouseUp = (): void => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    window.api
      ?.getSettings?.()
      .then((settings) => {
        if (settings?.sidebarViewMode) {
          setViewMode(settings.sidebarViewMode)
        }
      })
      .catch(() => {})
  }, [])

  const handleSetViewMode = useCallback((mode: 'list' | 'thumbnail'): void => {
    setViewMode(mode)
    try {
      localStorage.setItem('inkbook-sidebar-view-mode', mode)
    } catch {
      // ignore
    }
    window.api?.saveSettings?.({ sidebarViewMode: mode }).catch(() => {})
  }, [])

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

  const handlePageItemKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    pageId: string,
    index: number
  ): void => {
    if (renamingPageId === pageId) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setCurrentPage(pageId)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = Math.min(pages.length - 1, index + 1)
      const nextEl = pageListRef.current?.querySelectorAll<HTMLElement>('.page-item')[nextIndex]
      nextEl?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = Math.max(0, index - 1)
      const prevEl = pageListRef.current?.querySelectorAll<HTMLElement>('.page-item')[prevIndex]
      prevEl?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      const firstEl = pageListRef.current?.querySelectorAll<HTMLElement>('.page-item')[0]
      firstEl?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      const items = pageListRef.current?.querySelectorAll<HTMLElement>('.page-item')
      if (items && items.length > 0) {
        items[items.length - 1]?.focus()
      }
    } else if (e.key === 'F2') {
      e.preventDefault()
      handleStartRename(pageId)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      handleDeletePage(pageId)
    }
  }

  return (
    <aside
      className={`sidebar ${activeCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={{
        width: activeCollapsed ? 0 : activeWidth,
        minWidth: activeCollapsed ? 0 : activeWidth,
        maxWidth: activeCollapsed ? 0 : activeWidth
      }}
      aria-hidden={activeCollapsed}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">PAGES</span>
        <SegmentedControl
          value={viewMode}
          onChange={handleSetViewMode}
          options={[
            { value: 'list', icon: List, title: 'List view', ariaLabel: 'List view' },
            {
              value: 'thumbnail',
              icon: LayoutGrid,
              title: 'Thumbnail view',
              ariaLabel: 'Thumbnail view'
            }
          ]}
        />
      </div>

      <div
        ref={pageListRef}
        className={`page-list ${viewMode === 'thumbnail' ? 'page-grid-view' : 'page-list-view'}`}
        role="list"
        aria-label="Pages list"
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
              tabIndex={isRenaming ? -1 : 0}
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Page ${index + 1}: ${page.title}`}
              draggable={!isRenaming}
              className={`page-item ${viewMode === 'thumbnail' ? 'page-card-item' : ''} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onClick={(): void => {
                if (!isRenaming) {
                  setCurrentPage(page.id)
                }
              }}
              onKeyDown={(e): void => handlePageItemKeyDown(e, page.id, index)}
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
                        <MoreHorizontal size={15} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="page-item-main">
                    <span className="page-number">{index + 1}</span>
                    <PageThumbnail page={page} className="sidebar-list-thumb" />
                    <div className="page-label">
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
                      <MoreHorizontal size={15} strokeWidth={1.75} aria-hidden="true" />
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
          title="Add page (Ctrl+Shift+N)"
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Add page</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-page-count">
          {pages.length} {pages.length === 1 ? 'page' : 'pages'}
        </span>
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
          onOpenPageSettings={(): void => onOpenPageSettings?.()}
        />
      )}

      {!activeCollapsed && (
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleStartResize}
          title="Drag to resize sidebar (200px - 360px)"
          aria-label="Resize sidebar"
        />
      )}
    </aside>
  )
}
