import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { useTheme } from '../context/ThemeContext'
import type { PageBackground } from '@shared/types'

export interface CommandAction {
  id: string
  title: string
  category: 'Navigation' | 'Pages' | 'Background' | 'Export' | 'Import' | 'Theme' | 'Help'
  shortcut?: string
  keywords?: string[]
  run: () => void
}

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onFitPage: () => void
  onSaveNotebook: () => void
  onSaveAsNotebook: () => void
  onOpenNotebook: () => void
  onNewNotebook: () => void
  onOpenExport: (format?: 'png' | 'svg' | 'excalidraw' | 'pdf') => void
  onOpenPageSettings: () => void
  onOpenShortcutsHelp: () => void
  onOpenSearch: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  onFitPage,
  onSaveNotebook,
  onSaveAsNotebook,
  onOpenNotebook,
  onNewNotebook,
  onOpenExport,
  onOpenPageSettings,
  onOpenShortcutsHelp,
  onOpenSearch
}: CommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { toggleTheme, setThemePreference } = useTheme()
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setCurrentPage = useNotebookStore((s) => s.setCurrentPage)
  const addPage = useNotebookStore((s) => s.addPage)
  const setPageBackground = useNotebookStore((s) => s.setPageBackground)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Build list of all available commands and page navigation targets
  const allActions = useMemo<CommandAction[]>(() => {
    const list: CommandAction[] = [
      {
        id: 'search-notebook',
        title: 'Search Notebook (Titles & Text)...',
        category: 'Navigation',
        shortcut: 'Ctrl+F',
        keywords: ['find', 'search', 'text', 'lookup', 'query'],
        run: onOpenSearch
      },
      {
        id: 'new-page',
        title: 'New Page',
        category: 'Pages',
        shortcut: 'Ctrl+Shift+N',
        keywords: ['add', 'create', 'insert'],
        run: () => {
          addPage()
        }
      },
      {
        id: 'fit-page',
        title: 'Fit Page to Window',
        category: 'Navigation',
        shortcut: 'Ctrl+0',
        keywords: ['zoom', 'fit', 'view', 'center'],
        run: onFitPage
      },
      {
        id: 'page-settings',
        title: 'Page Settings (Size, Orientation, Background)...',
        category: 'Pages',
        keywords: ['dimensions', 'a4', 'a5', 'preset', 'custom', 'margin'],
        run: onOpenPageSettings
      },
      {
        id: 'save-notebook',
        title: 'Save Notebook',
        category: 'Navigation',
        shortcut: 'Ctrl+S',
        keywords: ['write', 'disk'],
        run: onSaveNotebook
      },
      {
        id: 'save-as-notebook',
        title: 'Save Notebook As...',
        category: 'Navigation',
        shortcut: 'Ctrl+Shift+S',
        keywords: ['duplicate', 'copy'],
        run: onSaveAsNotebook
      },
      {
        id: 'open-notebook',
        title: 'Open Notebook...',
        category: 'Navigation',
        shortcut: 'Ctrl+O',
        keywords: ['load', 'file'],
        run: onOpenNotebook
      },
      {
        id: 'new-notebook',
        title: 'New Notebook',
        category: 'Navigation',
        shortcut: 'Ctrl+N',
        keywords: ['create', 'blank'],
        run: onNewNotebook
      },
      {
        id: 'toggle-theme',
        title: 'Toggle Theme (Cycle System / Light / Dark)',
        category: 'Theme',
        keywords: ['dark', 'light', 'mode', 'color', 'system'],
        run: toggleTheme
      },
      {
        id: 'theme-system',
        title: 'Set Theme: System Default',
        category: 'Theme',
        keywords: ['os', 'auto', 'default'],
        run: () => setThemePreference('system')
      },
      {
        id: 'theme-dark',
        title: 'Set Theme: Dark',
        category: 'Theme',
        keywords: ['black', 'night'],
        run: () => setThemePreference('dark')
      },
      {
        id: 'theme-light',
        title: 'Set Theme: Light',
        category: 'Theme',
        keywords: ['white', 'day'],
        run: () => setThemePreference('light')
      },
      {
        id: 'shortcuts-help',
        title: 'Keyboard Shortcuts Help',
        category: 'Help',
        shortcut: 'F1',
        keywords: ['keys', 'hotkeys', 'cheatsheet'],
        run: onOpenShortcutsHelp
      },
      {
        id: 'export-png',
        title: 'Export Page as PNG Image...',
        category: 'Export',
        keywords: ['picture', 'image', 'photo', 'raster'],
        run: () => onOpenExport('png')
      },
      {
        id: 'export-svg',
        title: 'Export Page as SVG Vector...',
        category: 'Export',
        keywords: ['vector', 'graphics'],
        run: () => onOpenExport('svg')
      },
      {
        id: 'export-excalidraw',
        title: 'Export Page as .excalidraw...',
        category: 'Export',
        keywords: ['scene', 'raw'],
        run: () => onOpenExport('excalidraw')
      },
      {
        id: 'export-pdf',
        title: 'Export Notebook as Multi-Page PDF...',
        category: 'Export',
        keywords: ['document', 'print', 'all pages'],
        run: () => onOpenExport('pdf')
      }
    ]

    // Background style quick switchers for current page
    const backgrounds: Array<{ type: PageBackground; label: string }> = [
      { type: 'ruled', label: 'Set Page Background: Ruled' },
      { type: 'grid', label: 'Set Page Background: Grid' },
      { type: 'dots', label: 'Set Page Background: Dots' },
      { type: 'blank', label: 'Set Page Background: Blank' }
    ]

    for (const bg of backgrounds) {
      list.push({
        id: `bg-${bg.type}`,
        title: bg.label,
        category: 'Background',
        keywords: ['paper', 'lines', 'ruling', 'pattern', bg.type],
        run: () => setPageBackground(currentPageId, bg.type)
      })
    }

    // Dynamic actions to jump to any page in the notebook
    pages.forEach((page, index) => {
      list.push({
        id: `goto-page-${page.id}`,
        title: `Go to Page ${index + 1}: ${page.title}`,
        category: 'Pages',
        keywords: ['switch', 'jump', 'navigate', page.title, String(index + 1)],
        run: () => {
          setCurrentPage(page.id)
          onFitPage()
        }
      })
    })

    return list
  }, [
    pages,
    currentPageId,
    addPage,
    setCurrentPage,
    setPageBackground,
    toggleTheme,
    setThemePreference,
    onFitPage,
    onSaveNotebook,
    onSaveAsNotebook,
    onOpenNotebook,
    onNewNotebook,
    onOpenExport,
    onOpenPageSettings,
    onOpenShortcutsHelp,
    onOpenSearch
  ])

  // Filter actions based on search query
  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allActions

    return allActions.filter((action) => {
      if (action.title.toLowerCase().includes(q)) return true
      if (action.category.toLowerCase().includes(q)) return true
      if (action.shortcut && action.shortcut.toLowerCase().includes(q)) return true
      if (action.keywords && action.keywords.some((k) => k.toLowerCase().includes(q))) return true
      return false
    })
  }, [allActions, query])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.palette-item.active') as HTMLElement | null
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  const handleSelect = (action: CommandAction): void => {
    onClose()
    action.run()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(
        (prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length)
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredActions[selectedIndex]
      if (selected) {
        handleSelect(selected)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="palette-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-wrapper">
          <svg
            className="palette-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command or page title... (Ctrl+K)"
            value={query}
            onChange={(e): void => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="palette-shortcut-badge">ESC to close</kbd>
        </div>

        <div className="palette-results" ref={listRef} role="listbox">
          {filteredActions.length === 0 ? (
            <div className="palette-empty-state">No matching commands or pages found</div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={action.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`palette-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="palette-item-left">
                    <span className="palette-item-category">{action.category}</span>
                    <span className="palette-item-title">{action.title}</span>
                  </div>
                  {action.shortcut && (
                    <kbd className="palette-item-shortcut">{action.shortcut}</kbd>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
