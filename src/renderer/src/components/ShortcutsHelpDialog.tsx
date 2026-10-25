import type { ReactNode } from 'react'

export interface ShortcutsHelpDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Page Navigation',
    items: [
      { keys: ['Ctrl', 'PageDown'], description: 'Go to next page' },
      { keys: ['Ctrl', 'PageUp'], description: 'Go to previous page' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Create new page' },
      { keys: ['F2'], description: 'Rename active page' },
      { keys: ['Ctrl', '0'], description: 'Fit page to window' }
    ]
  },
  {
    title: 'Notebook & Files',
    items: [
      { keys: ['Ctrl', 'N'], description: 'New notebook' },
      { keys: ['Ctrl', 'O'], description: 'Open notebook' },
      { keys: ['Ctrl', 'S'], description: 'Save notebook' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Save notebook as' },
      { keys: ['Ctrl', 'W'], description: 'Close notebook' }
    ]
  },
  {
    title: 'Command & Quick Actions',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', 'F'], description: 'Search pages and text' },
      { keys: ['F1'], description: 'Open keyboard shortcuts help' },
      { keys: ['Escape'], description: 'Close modal / dismiss selection' }
    ]
  },
  {
    title: 'Canvas & Drawing',
    items: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'C'], description: 'Copy element(s)' },
      { keys: ['Ctrl', 'V'], description: 'Paste element(s)' },
      { keys: ['Delete'], description: 'Delete selected element(s)' },
      { keys: ['Space', 'Drag'], description: 'Pan canvas freely' },
      { keys: ['Ctrl', 'Wheel'], description: 'Zoom in / out' }
    ]
  }
]

export function ShortcutsHelpDialog({
  isOpen,
  onClose
}: ShortcutsHelpDialogProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      className="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      onClick={onClose}
    >
      <div className="welcome-card shortcuts-card" onClick={(e): void => e.stopPropagation()}>
        <header className="welcome-header">
          <div className="welcome-badge">Help</div>
          <h2 className="welcome-title">Keyboard Shortcuts</h2>
          <p className="welcome-subtitle">Speed up your workflow with hotkeys</p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close shortcuts dialog"
          >
            ✕
          </button>
        </header>

        <div className="welcome-body shortcuts-body">
          <div className="shortcuts-grid">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="shortcuts-group">
                <h3 className="shortcuts-group-title">{group.title}</h3>
                <div className="shortcuts-list">
                  {group.items.map((item, idx) => (
                    <div key={idx} className="shortcut-row">
                      <span className="shortcut-desc">{item.description}</span>
                      <div className="shortcut-keys">
                        {item.keys.map((k, kIdx): ReactNode => (
                          <span key={kIdx} className="key-wrapper">
                            {kIdx > 0 && <span className="key-separator">+</span>}
                            <kbd className="shortcut-key">{k}</kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="welcome-footer">
          <button className="welcome-continue-btn primary-btn" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
