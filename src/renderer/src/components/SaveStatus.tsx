export interface SaveStatusProps {
  isSaving: boolean
  isDirty: boolean
}

export function SaveStatus({ isSaving, isDirty }: SaveStatusProps): React.JSX.Element {
  let statusText = 'Saved'
  let statusClass = 'save-status--saved'

  if (isSaving) {
    statusText = 'Saving…'
    statusClass = 'save-status--saving'
  } else if (isDirty) {
    statusText = 'Unsaved changes'
    statusClass = 'save-status--unsaved'
  }

  return (
    <div className={`save-status ${statusClass}`} aria-live="polite">
      <span className="save-status-dot" aria-hidden="true" />
      <span className="save-status-text">{statusText}</span>
    </div>
  )
}
