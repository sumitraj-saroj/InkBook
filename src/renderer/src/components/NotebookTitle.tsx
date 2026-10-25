import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useNotebookStore } from '../store/notebookStore'

export function NotebookTitle(): React.JSX.Element {
  const notebookName = useNotebookStore((s) => s.currentNotebook.name)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const renameNotebook = useNotebookStore((s) => s.renameNotebook)

  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(notebookName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const startEditing = (): void => {
    setTempName(notebookName)
    setIsEditing(true)
  }

  const commitRename = (): void => {
    if (tempName.trim()) {
      renameNotebook(tempName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className="notebook-title-wrapper">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="notebook-title-input"
          value={tempName}
          onChange={(e): void => setTempName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          maxLength={60}
          aria-label="Notebook name"
        />
      ) : (
        <button
          className="notebook-title-btn"
          onClick={startEditing}
          title="Click to rename notebook"
        >
          <span className="notebook-title-text">{notebookName}</span>
          {isDirty && (
            <span className="dirty-indicator" title="Unsaved changes">
              *
            </span>
          )}
        </button>
      )}
    </div>
  )
}
