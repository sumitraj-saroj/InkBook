import { useState, useEffect } from 'react'
import { useNotebookStore } from '../store/notebookStore'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import {
  exportPageToPngDataUrl,
  exportPageToSvgString,
  exportPageToExcalidrawJson,
  exportNotebookToPdf,
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
  const [pdfTheme, setPdfTheme] = useState<'light' | 'dark'>(theme)
  const [pdfProgress, setPdfProgress] = useState<{
    current: number
    total: number
    status: string
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      } else if (format === 'excalidraw') {
        const liveScene = excalidrawAPI
          ? {
              elements: excalidrawAPI.getSceneElements(),
              files: excalidrawAPI.getFiles() as Record<string, unknown>,
              appState: excalidrawAPI.getAppState() as Record<string, unknown>
            }
          : undefined

        const jsonString = exportPageToExcalidrawJson(activePage, liveScene)
        const sanitizedTitle = activePage.title.replace(/[^a-zA-Z0-9_-]/g, '_')
        const result = await window.api.exportFile({
          defaultName: `${sanitizedTitle}.excalidraw`,
          filters: [
            { name: 'Excalidraw Files', extensions: ['excalidraw'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          data: jsonString,
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
      } else if (format === 'pdf') {
        const liveScene = excalidrawAPI
          ? {
              elements: excalidrawAPI.getSceneElements(),
              files: excalidrawAPI.getFiles() as Record<string, unknown>,
              appState: excalidrawAPI.getAppState() as Record<string, unknown>
            }
          : undefined

        const pdfBytes = await exportNotebookToPdf(
          currentNotebook,
          {
            theme: pdfTheme,
            onProgress: (progress): void => {
              setPdfProgress(progress)
            }
          },
          currentPageId,
          liveScene
        )

        // Convert Uint8Array to base64
        let binary = ''
        const len = pdfBytes.byteLength
        const chunkSize = 8192
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = pdfBytes.subarray(i, i + chunkSize)
          binary += String.fromCharCode.apply(null, chunk as unknown as number[])
        }
        const base64Data = window.btoa(binary)

        const sanitizedName = currentNotebook.name.replace(/[^a-zA-Z0-9_-]/g, '_')
        const result = await window.api.exportFile({
          defaultName: `${sanitizedName}.pdf`,
          filters: [
            { name: 'PDF Documents', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          data: base64Data,
          isBase64: true
        })

        if (result.canceled) {
          setIsExporting(false)
          setPdfProgress(null)
          return
        }

        if (!result.success) {
          setError(result.error ?? 'Export failed')
          setIsExporting(false)
          setPdfProgress(null)
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
          <h2 className="welcome-title">
            {format === 'pdf' ? 'Export Notebook as PDF' : 'Export Current Page'}
          </h2>
          <p className="welcome-subtitle">
            {format === 'pdf'
              ? `Export "${currentNotebook.name}" (${currentNotebook.pages.length} ${
                  currentNotebook.pages.length === 1 ? 'page' : 'pages'
                })`
              : `Export "${activePage.title}" (${activePage.size.width} × ${activePage.size.height})`}
          </p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close export dialog"
            disabled={isExporting}
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

          {format === 'excalidraw' && (
            <div className="export-options-box">
              <p
                className="export-info-text"
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)'
                }}
              >
                Exports a standard <code>.excalidraw</code> scene file containing only drawing
                elements and images. Page background patterns are excluded so the file is 100%
                compatible with <strong>excalidraw.com</strong>.
              </p>
            </div>
          )}

          {format === 'pdf' && (
            <div className="export-options-box">
              <p
                className="export-info-text"
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)'
                }}
              >
                Exports the entire notebook (
                <strong>
                  {currentNotebook.pages.length}{' '}
                  {currentNotebook.pages.length === 1 ? 'page' : 'pages'}
                </strong>
                ) into a multi-page PDF document. Each page retains its preset size (A4/A5),
                background rulings/grids, and drawings.
              </p>

              <div className="export-option-row" style={{ marginTop: '4px' }}>
                <label className="export-sublabel">Paper Theme</label>
                <div className="export-scale-selector">
                  <button
                    type="button"
                    className={`scale-btn ${pdfTheme === 'light' ? 'active' : ''}`}
                    onClick={(): void => setPdfTheme('light')}
                    disabled={isExporting}
                  >
                    Light Paper
                  </button>
                  <button
                    type="button"
                    className={`scale-btn ${pdfTheme === 'dark' ? 'active' : ''}`}
                    onClick={(): void => setPdfTheme('dark')}
                    disabled={isExporting}
                  >
                    Dark Paper
                  </button>
                </div>
              </div>

              {isExporting && pdfProgress && (
                <div className="export-progress-box">
                  <div className="export-progress-status">
                    <span>{pdfProgress.status}</span>
                    <span style={{ fontWeight: 600 }}>
                      {Math.round((pdfProgress.current / pdfProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="export-progress-bar-track">
                    <div
                      className="export-progress-bar-fill"
                      style={{
                        width: `${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%`
                      }}
                    />
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
