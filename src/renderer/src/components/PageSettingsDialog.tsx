import { useState } from 'react'
import {
  PAGE_PRESETS,
  scaleAndCenterElements,
  clampElementsToPage,
  checkElementsFitPage,
  type Page,
  type PagePreset,
  type PageOrientation,
  type PageBackground,
  type BoundedElement
} from '@shared/index'
import { useNotebookStore } from '../store/notebookStore'
import { useEditor } from '../context/EditorContext'
import { useTheme } from '../context/ThemeContext'
import { CaptureUpdateAction } from '@excalidraw/excalidraw'

export interface PageSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onFitPage?: () => void
}

export function PageSettingsDialog({
  isOpen,
  onClose,
  onFitPage
}: PageSettingsDialogProps): React.JSX.Element | null {
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const updatePageSettings = useNotebookStore((s) => s.updatePageSettings)
  const updatePageScene = useNotebookStore((s) => s.updatePageScene)
  const { excalidrawAPI } = useEditor()
  const { paperColorInDarkMode, setPaperColorInDarkMode } = useTheme()

  const activePage: Page | undefined = currentNotebook.pages.find((p) => p.id === currentPageId)

  const [preset, setPreset] = useState<PagePreset>(activePage?.size.preset ?? 'A4')
  const [orientation, setOrientation] = useState<PageOrientation>(
    activePage?.orientation ?? 'portrait'
  )
  const [background, setBackground] = useState<PageBackground>(activePage?.background ?? 'ruled')
  const [showMarginLine, setShowMarginLine] = useState<boolean>(activePage?.showMarginLine ?? true)
  const [customWidth, setCustomWidth] = useState<number>(activePage?.size.width ?? 794)
  const [customHeight, setCustomHeight] = useState<number>(activePage?.size.height ?? 1123)

  // Overflow resolution prompt state
  const [overflowPrompt, setOverflowPrompt] = useState<{
    targetWidth: number
    targetHeight: number
  } | null>(null)

  if (!isOpen || !activePage) return null

  // Calculate target page dimensions
  const getTargetDimensions = (): { width: number; height: number } => {
    let baseWidth = customWidth
    let baseHeight = customHeight

    if (preset === 'A4') {
      baseWidth = PAGE_PRESETS.A4.width
      baseHeight = PAGE_PRESETS.A4.height
    } else if (preset === 'A5') {
      baseWidth = PAGE_PRESETS.A5.width
      baseHeight = PAGE_PRESETS.A5.height
    }

    if (orientation === 'landscape') {
      return {
        width: Math.max(baseWidth, baseHeight),
        height: Math.min(baseWidth, baseHeight)
      }
    }
    return {
      width: Math.min(baseWidth, baseHeight),
      height: Math.max(baseWidth, baseHeight)
    }
  }

  const applyChangesWithElements = (
    finalElements: readonly BoundedElement[],
    targetDims: { width: number; height: number }
  ): void => {
    updatePageSettings(activePage.id, {
      size: {
        preset,
        width: targetDims.width,
        height: targetDims.height
      },
      orientation,
      background,
      showMarginLine
    })

    updatePageScene(activePage.id, {
      elements: finalElements
    })

    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        elements: finalElements as unknown as Parameters<
          typeof excalidrawAPI.updateScene
        >[0]['elements'],
        captureUpdate: CaptureUpdateAction.IMMEDIATELY
      })
      onFitPage?.()
    }

    setOverflowPrompt(null)
    onClose()
  }

  const handleApply = (): void => {
    const targetDims = getTargetDimensions()

    // Get live scene elements if active, otherwise page elements
    const elements = excalidrawAPI
      ? (excalidrawAPI.getSceneElements() as unknown as readonly BoundedElement[])
      : (activePage.scene.elements as readonly BoundedElement[])

    const fits = checkElementsFitPage(elements, targetDims)

    if (fits) {
      applyChangesWithElements(elements, targetDims)
    } else {
      // Show overflow resolution prompt to prevent silent element deletion
      setOverflowPrompt({
        targetWidth: targetDims.width,
        targetHeight: targetDims.height
      })
    }
  }

  const handleResolveOverflow = (action: 'scale' | 'clamp'): void => {
    if (!overflowPrompt) return
    const targetDims = { width: overflowPrompt.targetWidth, height: overflowPrompt.targetHeight }

    const elements = excalidrawAPI
      ? (excalidrawAPI.getSceneElements() as unknown as readonly BoundedElement[])
      : (activePage.scene.elements as readonly BoundedElement[])

    if (action === 'scale') {
      const scaled = scaleAndCenterElements(elements, targetDims.width, targetDims.height, 48)
      applyChangesWithElements(scaled, targetDims)
    } else {
      const clamped = clampElementsToPage(elements, targetDims, elements)
      applyChangesWithElements(clamped, targetDims)
    }
  }

  return (
    <div
      className="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Page Settings"
      onClick={onClose}
    >
      <div className="welcome-card page-settings-card" onClick={(e) => e.stopPropagation()}>
        <header className="welcome-header">
          <div className="welcome-badge">Settings</div>
          <h2 className="welcome-title">Page Settings</h2>
          <p className="welcome-subtitle">&ldquo;{activePage.title}&rdquo;</p>
          <button
            className="welcome-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close page settings"
          >
            ✕
          </button>
        </header>

        <div className="welcome-body page-settings-body">
          {overflowPrompt ? (
            <div className="overflow-warning-box">
              <div className="overflow-warning-header">
                <span className="warning-icon">⚠️</span>
                <strong>Content exceeds new page boundaries</strong>
              </div>
              <p className="overflow-warning-text">
                Some drawing elements do not fit within the new dimensions (
                {overflowPrompt.targetWidth} × {overflowPrompt.targetHeight} px). Choose how you
                would like to handle them:
              </p>
              <div className="overflow-actions-grid">
                <button
                  type="button"
                  className="overflow-option-btn primary"
                  onClick={() => handleResolveOverflow('scale')}
                >
                  <div className="overflow-btn-title">Scale Content to Fit</div>
                  <div className="overflow-btn-desc">
                    Scales down elements uniformly with margins and centers them on the page.
                  </div>
                </button>
                <button
                  type="button"
                  className="overflow-option-btn"
                  onClick={() => handleResolveOverflow('clamp')}
                >
                  <div className="overflow-btn-title">Clamp to Page</div>
                  <div className="overflow-btn-desc">
                    Translates and limits elements to the new boundary without scaling.
                  </div>
                </button>
              </div>
              <button
                type="button"
                className="overflow-cancel-btn"
                onClick={() => setOverflowPrompt(null)}
              >
                Back to Settings
              </button>
            </div>
          ) : (
            <div className="page-settings-form">
              {/* Size Preset */}
              <div className="settings-field">
                <label className="settings-label">Page Size Preset</label>
                <div className="settings-btn-group">
                  <button
                    type="button"
                    className={`settings-toggle-btn ${preset === 'A4' ? 'active' : ''}`}
                    onClick={() => setPreset('A4')}
                  >
                    A4 (794 × 1123)
                  </button>
                  <button
                    type="button"
                    className={`settings-toggle-btn ${preset === 'A5' ? 'active' : ''}`}
                    onClick={() => setPreset('A5')}
                  >
                    A5 (559 × 794)
                  </button>
                  <button
                    type="button"
                    className={`settings-toggle-btn ${preset === 'custom' ? 'active' : ''}`}
                    onClick={() => setPreset('custom')}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {preset === 'custom' && (
                <div className="settings-custom-dims">
                  <div className="dim-input-group">
                    <label>Width (px)</label>
                    <input
                      type="number"
                      min="300"
                      max="4000"
                      value={customWidth}
                      onChange={(e) =>
                        setCustomWidth(Math.max(300, parseInt(e.target.value, 10) || 794))
                      }
                    />
                  </div>
                  <div className="dim-input-group">
                    <label>Height (px)</label>
                    <input
                      type="number"
                      min="300"
                      max="4000"
                      value={customHeight}
                      onChange={(e) =>
                        setCustomHeight(Math.max(300, parseInt(e.target.value, 10) || 1123))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Orientation */}
              <div className="settings-field">
                <label className="settings-label">Orientation</label>
                <div className="settings-btn-group">
                  <button
                    type="button"
                    className={`settings-toggle-btn ${orientation === 'portrait' ? 'active' : ''}`}
                    onClick={() => setOrientation('portrait')}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    className={`settings-toggle-btn ${orientation === 'landscape' ? 'active' : ''}`}
                    onClick={() => setOrientation('landscape')}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Background */}
              <div className="settings-field">
                <label className="settings-label">Background Pattern</label>
                <div className="settings-btn-group">
                  {(['ruled', 'grid', 'dots', 'blank'] as const).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className={`settings-toggle-btn ${background === bg ? 'active' : ''}`}
                      onClick={() => setBackground(bg)}
                    >
                      {bg.charAt(0).toUpperCase() + bg.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ruled margin line option */}
              {background === 'ruled' && (
                <div className="settings-checkbox-row">
                  <label className="settings-checkbox-label">
                    <input
                      type="checkbox"
                      checked={showMarginLine}
                      onChange={(e) => setShowMarginLine(e.target.checked)}
                    />
                    <span>Show left vertical margin line</span>
                  </label>
                </div>
              )}

              {/* Paper color in dark mode */}
              <div className="settings-field">
                <label className="settings-label">Paper Color in Dark Mode</label>
                <div className="settings-btn-group">
                  <button
                    type="button"
                    className={`settings-toggle-btn ${paperColorInDarkMode === 'dark' ? 'active' : ''}`}
                    onClick={() => setPaperColorInDarkMode('dark')}
                  >
                    Dark Paper
                  </button>
                  <button
                    type="button"
                    className={`settings-toggle-btn ${paperColorInDarkMode === 'light' ? 'active' : ''}`}
                    onClick={() => setPaperColorInDarkMode('light')}
                  >
                    Light Paper (Cream)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="welcome-footer">
          <button className="welcome-continue-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          {!overflowPrompt && (
            <button className="welcome-continue-btn primary-btn" onClick={handleApply}>
              Apply Settings
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
