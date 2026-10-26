import { useState, useEffect, useRef, useMemo, type KeyboardEvent, type JSX } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { searchNotebook, type SearchResult } from '@shared/index'

export interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectResult: (result: SearchResult) => void
}

/**
 * Renders text with the search term highlighted using <mark>
 */
function HighlightedSnippet({ text, query }: { text: string; query: string }): JSX.Element {
  if (!query.trim()) {
    return <span>{text}</span>
  }
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const parts: JSX.Element[] = []
  let cursor = 0

  while (cursor < text.length) {
    const idx = lower.indexOf(q, cursor)
    if (idx === -1) {
      parts.push(<span key={cursor}>{text.slice(cursor)}</span>)
      break
    }
    if (idx > cursor) {
      parts.push(<span key={cursor}>{text.slice(cursor, idx)}</span>)
    }
    parts.push(
      <mark key={idx} className="search-highlight">
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    cursor = idx + q.length
  }

  return <>{parts}</>
}

export function SearchDialog({
  isOpen,
  onClose,
  onSelectResult
}: SearchDialogProps): JSX.Element | null {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const currentNotebook = useNotebookStore((s) => s.currentNotebook)

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Compute search matches across the entire notebook
  const results = useMemo(() => {
    return searchNotebook(currentNotebook, query)
  }, [currentNotebook, query])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        '.search-result-item.active'
      ) as HTMLElement | null
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Window-level escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleWindowKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleWindowKeyDown)
    return (): void => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (result: SearchResult): void => {
    onClose()
    onSelectResult(result)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected) {
        handleSelect(selected)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="search-dialog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-header">
          <span className="palette-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Search notebook page titles and text notes... (Ctrl+F)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            className="close-btn"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <div className="palette-results" ref={listRef}>
          {query.trim() === '' ? (
            <div className="palette-empty">
              Type to search page titles and text elements across all pages
            </div>
          ) : results.length === 0 ? (
            <div className="palette-empty">No results found for &ldquo;{query}&rdquo;</div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.id}
                className={`search-result-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={(): void => handleSelect(item)}
                onMouseEnter={(): void => setSelectedIndex(idx)}
              >
                <div className="search-item-header">
                  <span className="search-badge">Page {item.pageIndex + 1}</span>
                  <span className="search-type-tag">
                    {item.type === 'page' ? 'Page Title' : 'Text Note'}
                  </span>
                  <span className="search-page-name">{item.pageTitle}</span>
                </div>
                <div className="search-item-snippet">
                  <HighlightedSnippet text={item.snippet} query={query} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>
            {results.length > 0 && query.trim() !== ''
              ? `${results.length} result${results.length === 1 ? '' : 's'} found`
              : 'Tip: Use Ctrl+F to open search anytime'}
          </span>
          <span className="palette-footer-shortcuts">
            <kbd>↑</kbd> <kbd>↓</kbd> navigate &bull; <kbd>Enter</kbd> jump &bull; <kbd>Esc</kbd>{' '}
            close
          </span>
        </div>
      </div>
    </div>
  )
}
