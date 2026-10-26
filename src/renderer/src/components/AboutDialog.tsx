import { useEffect } from 'react'

export interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About InkBook"
    >
      <div className="about-dialog-card" onClick={(e): void => e.stopPropagation()}>
        <div className="about-header">
          <div className="about-logo">
            <span className="about-logo-text">InkBook</span>
          </div>
          <span className="about-version">v1.0.0</span>
        </div>
        <p className="about-description">
          A calm, modern, minimal notebook app designed for focused thinking and sketching, powered
          by Excalidraw.
        </p>
        <div className="about-details">
          <div className="about-detail-row">
            <span className="about-detail-label">Format:</span>
            <span className="about-detail-value">.inkbook (compatible with Excalidraw)</span>
          </div>
          <div className="about-detail-row">
            <span className="about-detail-label">License:</span>
            <span className="about-detail-value">MIT License</span>
          </div>
        </div>
        <div className="about-actions">
          <button
            className="ui-icon-btn ui-icon-btn--secondary about-close-btn"
            onClick={onClose}
            autoFocus
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
