import React from 'react'
import { useNotebookStore } from '../store/notebookStore'
import type { PageBackground } from '@shared/index'

export function BackgroundPicker(): React.JSX.Element | null {
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setPageBackground = useNotebookStore((s) => s.setPageBackground)

  const activePage = currentNotebook.pages.find((p) => p.id === currentPageId)
  if (!activePage) return null

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPageBackground(currentPageId, e.target.value as PageBackground)
  }

  return (
    <div className="background-picker" title="Page background pattern">
      <label htmlFor="page-background-select" className="background-picker-label">
        Background:
      </label>
      <select
        id="page-background-select"
        className="background-select"
        value={activePage.background}
        onChange={handleBackgroundChange}
      >
        <option value="blank">Blank</option>
        <option value="ruled">Ruled</option>
        <option value="grid">Grid</option>
        <option value="dots">Dots</option>
      </select>
    </div>
  )
}
