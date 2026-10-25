import { useState } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import {
  exportPageToPngDataUrl,
  exportPageToSvgString,
  type PngExportOptions,
  type SvgExportOptions
} from '../utils/exportUtils'

export interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  initialFormat?: 'png' | 'svg' | 'excalidraw' | 'pdf'
}

export function ExportDialog({
  isOpen,
  onClose,
  initialFormat = 'png'
}: ExportDialogProps): React.JSX.Element | null {
  const { theme } = useTheme()
  const { excalidrawAPI } = useEditor()
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const activePage = currentNotebook.pages.find((p) => p.id === currentPageId)

  const [format, setFormat] = useState<'png' | 'svg' | 'excalidraw' | 'pdf'>(initialFormat)
  const [includeBackground, setIncludeBackground] = useState(true)
  const [transparent, setTransparent] = useState(false)
  const [scale, setScale] = useState<1 | 2 | 3>(2)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !activePage) return null

  const handleExport = async (): Promise<void> => {
    setIsExporting(true)
    setError(null)

    try {
      if (format === 'png') {
        const liveScene = excalidrawAPI
          ? {
              elements: excalidrawAPI.getSceneElements(),
              files: excalidrawAPI.getFiles() as Record<string, unknown>,
              appState: excalidrawAPI.getAppState() as Record<string, unknown>
            }
          : undefined

        const options: PngExportOptions = {
          includeBackground,
          transparent,
          scale,
          theme
        }

        const dataUrl = await exportPageToPngDataUrl(activePage, options, liveScene)
        const sanitizedTitle = activePage.title.replace(/[^a-zA-Z0-9_-]/g, '_')
        const result = await window.api.exportFile({
          defaultName: `${sanitizedTitle}.png`,
          filters: [
            { name: 'PNG Images', extensions: ['png'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          data: dataUrl,
          isBase64: true
        })

        if (result.canceled) {
          setIsExporting(false)
          return
        }

        if (!result.success) {
          setError(result.error ?? 'Export failed')
          setIsExporting(false)
          return
        }

        onClose()
      } else if (format === 'svg') {
        const liveScene = excalidrawAPI
          ? {
              elements: excalidrawAPI.getSceneElements(),
              files: excalidrawAPI.getFiles() as Record<string, unknown>,
              appState: excalidrawAPI.getAppState() as Record<string, unknown>
            }
          : undefined

        const options: SvgExportOptions = {
          includeBackground,
          transparent,
          theme
        }

        const svgString = await exportPageToSvgString(activePage, options, liveScene)
        const sanitizedTitle = activePage.title.replace(/[^a-zA-Z0-9_-]/g, '_')
        const result = await window.api.exportFile({
          defaultName: `${sanitizedTitle}.svg`,
          filters: [
            { name: 'SVG Images', extensions: ['svg'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          data: svgString,
          isBase64: false
        })

        if (result.canceled) {
          setIsExporting(false)
          return
        }

        if (!result.success) {
          setError(result.error ?? 'Export failed')
          setIsExporting(false)
          return
        }

        onClose()
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Export Page">
      <div className="welcome-card export-dialog-card">
        <header className="welcome-header">
          <div className="welcome-badge">Export</div>
          <h2 className="welcome-title">Export Current Page</h2>
          <p className="welcome-subtitle">
            Export &ldquo;{activePage.title}&rdquo; ({activePage.size.width} ×{' '}
            {activePage.size.height})
          </p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close export dialog"
          >
            ✕
          </button>
        </header>

        <div className="welcome-body export-dialog-body">
          {error && <div className="export-error-banner">{error}</div>}

          <div className="export-field-group">
            <label className="export-label">Export Format</label>
            <div className="export-format-selector">
              <button
                type="button"
                className={`export-format-btn ${format === 'png' ? 'active' : ''}`}
                onClick={(): void => setFormat('png')}
              >
                PNG Image
              </button>
              <button
                type="button"
                className={`export-format-btn ${format === 'svg' ? 'active' : ''}`}
                onClick={(): void => setFormat('svg')}
              >
                SVG Vector
              </button>
              <button
                type="button"
                className={`export-format-btn ${format === 'excalidraw' ? 'active' : ''}`}
                onClick={(): void => setFormat('excalidraw')}
              >
                .excalidraw
              </button>
              <button
                type="button"
                className={`export-format-btn ${format === 'pdf' ? 'active' : ''}`}
                onClick={(): void => setFormat('pdf')}
              >
                Notebook PDF
              </button>
            </div>
          </div>

          {(format === 'png' || format === 'svg') && (
            <div className="export-options-box">
              <div className="export-option-row">
                <label className="export-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeBackground}
                    onChange={(e): void => setIncludeBackground(e.target.checked)}
                  />
                  <span>Include page background ({activePage.background})</span>
                </label>
              </div>

              <div className="export-option-row">
                <label className="export-checkbox-label">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e): void => setTransparent(e.target.checked)}
                  />
                  <span>Transparent paper (no solid white/dark fill)</span>
                </label>
              </div>

              {format === 'png' && (
                <div className="export-option-row">
                  <label className="export-sublabel">Resolution Scale</label>
                  <div className="export-scale-selector">
                    {([1, 2, 3] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`scale-btn ${scale === s ? 'active' : ''}`}
                        onClick={(): void => setScale(s)}
                      >
                        {s}x ({activePage.size.width * s} × {activePage.size.height * s}px)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="welcome-footer export-footer">
          <button
            className="welcome-continue-btn cancel-btn"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            className="welcome-continue-btn primary-btn"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export File'}
          </button>
        </footer>
      </div>
    </div>
  )
}
