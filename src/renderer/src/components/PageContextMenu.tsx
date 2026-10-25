import { useEffect, useRef } from 'react'

export interface ContextMenuPosition {
  x: number
  y: number
  pageId: string
  pageIndex: number
}

interface PageContextMenuProps {
  position: ContextMenuPosition
  totalPages: number
  onClose: () => void
  onRename: (pageId: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onMoveUp: (pageIndex: number) => void
  onMoveDown: (pageIndex: number) => void
  onOpenPageSettings?: (pageId: string) => void
}

export function PageContextMenu({
  position,
  totalPages,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenPageSettings
}: PageContextMenuProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const isFirst = position.pageIndex === 0
  const isLast = position.pageIndex === totalPages - 1
  const canDelete = totalPages > 1

  return (
    <div
      ref={menuRef}
      className="page-context-menu"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`
      }}
    >
      <button
        className="context-menu-item"
        onClick={(): void => {
          onRename(position.pageId)
          onClose()
        }}
      >
        Rename
      </button>

      <button
        className="context-menu-item"
        onClick={(): void => {
          onDuplicate(position.pageId)
          onClose()
        }}
      >
        Duplicate
      </button>

      <button
        className="context-menu-item"
        onClick={(): void => {
          onOpenPageSettings?.(position.pageId)
          onClose()
        }}
      >
        Page Settings...
      </button>

      <div className="context-menu-separator" />

      <button
        className="context-menu-item"
        disabled={isFirst}
        onClick={(): void => {
          if (!isFirst) {
            onMoveUp(position.pageIndex)
            onClose()
          }
        }}
      >
        Move up
      </button>

      <button
        className="context-menu-item"
        disabled={isLast}
        onClick={(): void => {
          if (!isLast) {
            onMoveDown(position.pageIndex)
            onClose()
          }
        }}
      >
        Move down
      </button>

      <div className="context-menu-separator" />

      <button
        className="context-menu-item danger"
        disabled={!canDelete}
        title={!canDelete ? 'Cannot delete the only page' : undefined}
        onClick={(): void => {
          if (canDelete) {
            onDelete(position.pageId)
            onClose()
          }
        }}
      >
        Delete
      </button>
    </div>
  )
}
