import { type JSX } from 'react'
import { useNotebookStore } from '../store/notebookStore'

export interface PageFooterProps {
  onPrevPage: () => void
  onNextPage: () => void
  onAddPage: () => void
  onFitPage: () => void
  onOpenSettings?: () => void
}

export function PageFooter({
  onPrevPage,
  onNextPage,
  onAddPage,
  onFitPage,
  onOpenSettings
}: PageFooterProps): JSX.Element {
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)

  const currentIndex = pages.findIndex((p) => p.id === currentPageId)
  const totalPages = Math.max(1, pages.length)
  const activePage = currentIndex !== -1 ? pages[currentIndex] : pages[0]

  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= pages.length - 1

  const sizeLabel = activePage
    ? activePage.size.preset === 'custom'
      ? `${activePage.size.width}×${activePage.size.height}`
      : `${activePage.size.preset} ${activePage.orientation === 'landscape' ? 'Land.' : 'Port.'}`
    : 'A4'

  return (
    <footer className="page-footer" role="region" aria-label="Page navigation">
      <div className="page-footer-nav">
        <button
          className="footer-btn"
          onClick={onPrevPage}
          disabled={isFirst}
          title="Previous page (Ctrl+PageUp)"
          aria-label="Previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="footer-page-indicator" title="Current page number and total pages">
          Page <strong>{currentIndex + 1}</strong> / {totalPages}
        </span>

        <button
          className="footer-btn"
          onClick={onNextPage}
          disabled={isLast}
          title="Next page (Ctrl+PageDown)"
          aria-label="Next page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="footer-separator" />

      <button
        className="footer-btn"
        onClick={onAddPage}
        title="Add new page (Ctrl+Shift+N)"
        aria-label="Add new page"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="footer-separator" />

      {onOpenSettings && (
        <button
          className="footer-badge-btn"
          onClick={onOpenSettings}
          title="Page size & background settings"
          aria-label="Page settings"
        >
          <span>{sizeLabel}</span>
        </button>
      )}

      <button
        className="footer-fit-btn"
        onClick={onFitPage}
        title="Fit page to window (Ctrl+0)"
        aria-label="Fit page"
      >
        Fit
      </button>
    </footer>
  )
}
