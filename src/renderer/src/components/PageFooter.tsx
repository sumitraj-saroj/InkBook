import { useCallback, type JSX, type ReactNode } from 'react'
import {
  Minus,
  Plus,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  Grid3X3,
  CircleDot,
  Square,
  ChevronUp
} from 'lucide-react'
import { CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { AppState } from '@excalidraw/excalidraw/types'
import { useNotebookStore } from '../store/notebookStore'
import { useEditor } from '../context/EditorContext'
import { Pill, PillButton, PillDivider, Menu, type MenuItemType } from './ui'
import type { PageBackground } from '@shared/types'

export interface PageFooterProps {
  onPrevPage: () => void
  onNextPage: () => void
  onAddPage: () => void
  onFitPage: () => void
  onOpenSettings?: () => void
}

export function PageFooter({
  onPrevPage,
  onNextPage,
  onAddPage,
  onFitPage,
  onOpenSettings
}: PageFooterProps): JSX.Element {
  const pages = useNotebookStore((s) => s.currentNotebook.pages)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const setPageBackground = useNotebookStore((s) => s.setPageBackground)

  const { excalidrawAPI, zoom, setZoom } = useEditor()

  const currentIndex = pages.findIndex((p) => p.id === currentPageId)
  const totalPages = Math.max(1, pages.length)
  const activePage = currentIndex !== -1 ? pages[currentIndex] : pages[0]

  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= pages.length - 1

  const sizeLabel = activePage
    ? activePage.size.preset === 'custom'
      ? `${activePage.size.width}×${activePage.size.height}`
      : `${activePage.size.preset} ${activePage.orientation === 'landscape' ? 'Landscape' : 'Portrait'}`
    : 'A4 Portrait'

  const currentBg: PageBackground = activePage?.background ?? 'ruled'
  const bgNames: Record<PageBackground, string> = {
    ruled: 'Ruled',
    grid: 'Grid',
    dots: 'Dots',
    blank: 'Blank'
  }
  const bgIcons: Record<PageBackground, typeof AlignLeft> = {
    ruled: AlignLeft,
    grid: Grid3X3,
    dots: CircleDot,
    blank: Square
  }
  const CurrentBgIcon = bgIcons[currentBg] ?? AlignLeft

  const handleZoomOut = useCallback((): void => {
    if (excalidrawAPI) {
      const appState = excalidrawAPI.getAppState()
      const current = appState.zoom?.value ?? 1
      const next = Math.max(0.1, Number((current / 1.2).toFixed(2)))
      excalidrawAPI.updateScene({
        appState: {
          zoom: { value: next as unknown as NonNullable<AppState['zoom']>['value'] }
        } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
        captureUpdate: CaptureUpdateAction.NEVER
      })
      setZoom(next)
    }
  }, [excalidrawAPI, setZoom])

  const handleZoomIn = useCallback((): void => {
    if (excalidrawAPI) {
      const appState = excalidrawAPI.getAppState()
      const current = appState.zoom?.value ?? 1
      const next = Math.min(5.0, Number((current * 1.2).toFixed(2)))
      excalidrawAPI.updateScene({
        appState: {
          zoom: { value: next as unknown as NonNullable<AppState['zoom']>['value'] }
        } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
        captureUpdate: CaptureUpdateAction.NEVER
      })
      setZoom(next)
    }
  }, [excalidrawAPI, setZoom])

  const handleResetZoom = useCallback((): void => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          zoom: { value: 1 as unknown as NonNullable<AppState['zoom']>['value'] }
        } as unknown as Parameters<typeof excalidrawAPI.updateScene>[0]['appState'],
        captureUpdate: CaptureUpdateAction.NEVER
      })
      setZoom(1)
    }
  }, [excalidrawAPI, setZoom])

  const handleUndo = useCallback((): void => {
    const btn = document.querySelector<HTMLButtonElement>(
      '.excalidraw .undo-button-container button, .excalidraw button[aria-label*="Undo"], .excalidraw button[aria-label*="undo"]'
    )
    if (btn) {
      btn.click()
      return
    }
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    const target = document.querySelector('.excalidraw') || window
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        code: 'KeyZ',
        ctrlKey: !isMac,
        metaKey: isMac,
        bubbles: true
      })
    )
  }, [])

  const handleRedo = useCallback((): void => {
    const btn = document.querySelector<HTMLButtonElement>(
      '.excalidraw .redo-button-container button, .excalidraw button[aria-label*="Redo"], .excalidraw button[aria-label*="redo"]'
    )
    if (btn) {
      btn.click()
      return
    }
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    const target = document.querySelector('.excalidraw') || window
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'y',
        code: 'KeyY',
        ctrlKey: !isMac,
        metaKey: isMac,
        bubbles: true
      })
    )
  }, [])

  const backgroundMenuItems: MenuItemType[] = [
    {
      label: 'Ruled',
      icon: AlignLeft,
      onClick: (): void => {
        if (currentPageId) setPageBackground(currentPageId, 'ruled')
      }
    },
    {
      label: 'Grid',
      icon: Grid3X3,
      onClick: (): void => {
        if (currentPageId) setPageBackground(currentPageId, 'grid')
      }
    },
    {
      label: 'Dots',
      icon: CircleDot,
      onClick: (): void => {
        if (currentPageId) setPageBackground(currentPageId, 'dots')
      }
    },
    {
      label: 'Blank',
      icon: Square,
      onClick: (): void => {
        if (currentPageId) setPageBackground(currentPageId, 'blank')
      }
    }
  ]

  return (
    <footer className="page-footer" role="region" aria-label="Page navigation and canvas controls">
      {/* Bottom-left pill: zoom out, zoom %, zoom in, Fit, undo, redo */}
      <div className="page-footer-left">
        <Pill className="page-footer-pill page-footer-pill--canvas">
          <PillButton
            icon={Minus}
            onClick={handleZoomOut}
            tooltip="Zoom out"
            shortcut="Ctrl+-"
            aria-label="Zoom out"
          />
          <PillButton
            onClick={handleResetZoom}
            tooltip="Reset zoom to 100%"
            shortcut="Ctrl+0"
            aria-label="Reset zoom"
            className="footer-zoom-btn"
          >
            <span>{Math.round(zoom * 100)}%</span>
          </PillButton>
          <PillButton
            icon={Plus}
            onClick={handleZoomIn}
            tooltip="Zoom in"
            shortcut="Ctrl++"
            aria-label="Zoom in"
          />

          <PillDivider />

          <PillButton
            onClick={onFitPage}
            tooltip="Fit page to window"
            shortcut="Ctrl+0"
            aria-label="Fit page"
            className="footer-fit-btn"
          >
            <span>Fit</span>
            <span className="sr-only"> page</span>
          </PillButton>

          <PillDivider />

          <PillButton
            icon={Undo2}
            onClick={handleUndo}
            tooltip="Undo"
            shortcut="Ctrl+Z"
            aria-label="Undo"
          />
          <PillButton
            icon={Redo2}
            onClick={handleRedo}
            tooltip="Redo"
            shortcut="Ctrl+Y"
            aria-label="Redo"
          />
        </Pill>
      </div>

      {/* Bottom-center pill: prev, page indicator, next, add page, background selector, size settings */}
      <div className="page-footer-center">
        <Pill className="page-footer-pill page-footer-pill--nav">
          <PillButton
            icon={ChevronLeft}
            onClick={onPrevPage}
            disabled={isFirst}
            tooltip="Previous page"
            shortcut="Ctrl+PageUp"
            aria-label="Previous page"
          />

          <span className="footer-page-indicator" title="Current page number and total pages">
            Page <strong>{currentIndex + 1}</strong> / {totalPages}
          </span>

          <PillButton
            icon={ChevronRight}
            onClick={onNextPage}
            disabled={isLast}
            tooltip="Next page"
            shortcut="Ctrl+PageDown"
            aria-label="Next page"
          />

          <PillDivider />

          <PillButton
            icon={Plus}
            onClick={onAddPage}
            tooltip="Add page"
            shortcut="Ctrl+Shift+N"
            aria-label="Add page"
          />

          <PillDivider />

          <Menu
            align="left"
            placement="top"
            width={160}
            trigger={({ isOpen, toggle, ref }): ReactNode => (
              <PillButton
                ref={ref}
                onClick={toggle}
                active={isOpen}
                tooltip="Change paper background"
                aria-label="Paper background"
                className="footer-bg-btn"
              >
                <CurrentBgIcon size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>{bgNames[currentBg]}</span>
                <ChevronUp size={12} strokeWidth={1.75} aria-hidden="true" />
              </PillButton>
            )}
            items={backgroundMenuItems}
          />

          <PillDivider />

          {onOpenSettings && (
            <PillButton
              onClick={onOpenSettings}
              tooltip="Page size & orientation settings"
              aria-label="Page settings"
              className="footer-size-chip"
            >
              <span>{sizeLabel}</span>
            </PillButton>
          )}
        </Pill>
      </div>
    </footer>
  )
}
