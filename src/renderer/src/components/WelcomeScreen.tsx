import { useEffect, useState, type JSX } from 'react'
import { FilePlus, FolderOpen, BookOpen, Clock, X, Trash2 } from 'lucide-react'

export interface WelcomeScreenProps {
  isOpen: boolean
  onClose: () => void
  onNewNotebook: () => void
  onOpenNotebook: () => void
  onOpenRecentPath: (filePath: string) => void
}

interface RecentItemData {
  path: string
  mtimeMs?: number
}

function formatRelativeTime(mtimeMs?: number): string {
  if (!mtimeMs) return ''
  const diff = Math.max(0, Date.now() - mtimeMs)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(mtimeMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

export function WelcomeScreen({
  isOpen,
  onClose,
  onNewNotebook,
  onOpenNotebook,
  onOpenRecentPath
}: WelcomeScreenProps): JSX.Element | null {
  const [recents, setRecents] = useState<RecentItemData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let isCurrent = true

    window.api
      .getRecentFiles()
      .then(async (list) => {
        if (!isCurrent) return
        const withStats: RecentItemData[] = await Promise.all(
          list.map(async (path) => {
            try {
              const stat = await window.api?.getFileStat?.(path)
              return { path, mtimeMs: stat?.mtimeMs }
            } catch {
              return { path }
            }
          })
        )
        if (isCurrent) {
          setRecents(withStats)
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
    const parts = filePath.split(/[/\\]/)
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
          <div className="welcome-brand">
            <span className="welcome-logo">InkBook</span>
            <span className="welcome-badge">Local Notebook</span>
          </div>
          <p className="welcome-subtitle">Calm, modern handwritten note-taking with Excalidraw.</p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close welcome screen (Esc)"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <div className="welcome-body">
          {/* Action cards */}
          <div className="welcome-actions">
            <button
              className="welcome-action-card"
              onClick={(): void => {
                onClose()
                onNewNotebook()
              }}
            >
              <div className="welcome-action-icon-wrapper">
                <FilePlus size={22} strokeWidth={1.75} aria-hidden="true" />
              </div>
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
              <div className="welcome-action-icon-wrapper">
                <FolderOpen size={22} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="card-text">
                <span className="card-heading">Open Notebook</span>
                <span className="card-subheading">Open existing .inkbook file (Ctrl+O)</span>
              </div>
            </button>
          </div>

          {/* Recent Notebooks Section */}
          <div className="welcome-recents">
            <div className="recents-header">
              <h3>Recent Notebooks</h3>
              {recents.length > 0 && (
                <button
                  className="clear-recents-btn"
                  onClick={handleClearRecents}
                  title="Clear recent notebooks"
                >
                  <Trash2 size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span>Clear recents</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="recents-loading">Loading recent notebooks...</div>
            ) : recents.length === 0 ? (
              <div className="recents-empty">
                <BookOpen size={28} strokeWidth={1.5} className="recents-empty-icon" />
                <p className="recents-empty-title">No recent notebooks yet</p>
                <p className="recents-empty-desc">
                  Create a new notebook or open an existing file to get started.
                </p>
              </div>
            ) : (
              <ul className="recents-list">
                {recents.map(({ path, mtimeMs }) => (
                  <li key={path} className="recent-item">
                    <button
                      className="recent-item-btn"
                      onClick={(): void => {
                        onClose()
                        onOpenRecentPath(path)
                      }}
                      title={path}
                    >
                      <div className="recent-file-icon-box">
                        <BookOpen size={16} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div className="recent-file-info">
                        <span className="recent-file-name">{getBaseName(path)}</span>
                        <span className="recent-file-path">{path}</span>
                      </div>
                      {mtimeMs && (
                        <div
                          className="recent-file-time"
                          title={`Last modified: ${new Date(mtimeMs).toLocaleString()}`}
                        >
                          <Clock size={12} strokeWidth={1.75} aria-hidden="true" />
                          <span>{formatRelativeTime(mtimeMs)}</span>
                        </div>
                      )}
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
