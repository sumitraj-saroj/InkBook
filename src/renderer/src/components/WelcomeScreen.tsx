import { useEffect, useState } from 'react'

export interface WelcomeScreenProps {
  isOpen: boolean
  onClose: () => void
  onNewNotebook: () => void
  onOpenNotebook: () => void
  onOpenRecentPath: (filePath: string) => void
}

export function WelcomeScreen({
  isOpen,
  onClose,
  onNewNotebook,
  onOpenNotebook,
  onOpenRecentPath
}: WelcomeScreenProps): React.JSX.Element | null {
  const [recents, setRecents] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let isCurrent = true

    window.api
      .getRecentFiles()
      .then((list) => {
        if (isCurrent) {
          setRecents(list)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load recent files:', err)
        if (isCurrent) {
          setLoading(false)
        }
      })

    return (): void => {
      isCurrent = false
    }
  }, [isOpen])

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

  const handleClearRecents = async (): Promise<void> => {
    await window.api.clearRecentFiles()
    setRecents([])
  }

  const getBaseName = (filePath: string): string => {
    const parts = filePath.split('/')
    return parts[parts.length - 1] ?? filePath
  }

  return (
    <div
      className="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to InkBook"
    >
      <div className="welcome-card">
        <header className="welcome-header">
          <div className="welcome-badge">InkBook</div>
          <h1 className="welcome-title">Welcome to InkBook</h1>
          <p className="welcome-subtitle">
            Fast, local, distraction-free handwritten note-taking with Excalidraw.
          </p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close welcome screen"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="welcome-body">
          <div className="welcome-actions">
            <button
              className="welcome-action-card"
              onClick={(): void => {
                onClose()
                onNewNotebook()
              }}
            >
              <span className="card-icon">➕</span>
              <div className="card-text">
                <span className="card-heading">New Notebook</span>
                <span className="card-subheading">Create a blank notebook (Ctrl+N)</span>
              </div>
            </button>

            <button
              className="welcome-action-card"
              onClick={(): void => {
                onClose()
                onOpenNotebook()
              }}
            >
              <span className="card-icon">📂</span>
              <div className="card-text">
                <span className="card-heading">Open Notebook...</span>
                <span className="card-subheading">Open an existing .inkbook file (Ctrl+O)</span>
              </div>
            </button>
          </div>

          <div className="welcome-recents">
            <div className="recents-header">
              <h3>Recent Notebooks</h3>
              {recents.length > 0 && (
                <button className="clear-recents-btn" onClick={handleClearRecents}>
                  Clear Recents
                </button>
              )}
            </div>

            {loading ? (
              <div className="recents-loading">Loading recent files...</div>
            ) : recents.length === 0 ? (
              <div className="recents-empty">
                No recent notebooks yet. Create a new one or open a file to get started.
              </div>
            ) : (
              <ul className="recents-list">
                {recents.map((path) => (
                  <li key={path} className="recent-item">
                    <button
                      className="recent-item-btn"
                      onClick={(): void => {
                        onClose()
                        onOpenRecentPath(path)
                      }}
                      title={path}
                    >
                      <span className="recent-file-icon">📓</span>
                      <div className="recent-file-info">
                        <span className="recent-file-name">{getBaseName(path)}</span>
                        <span className="recent-file-path">{path}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="welcome-footer">
          <button className="welcome-continue-btn" onClick={onClose}>
            Continue to Editor
          </button>
        </footer>
      </div>
    </div>
  )
}
