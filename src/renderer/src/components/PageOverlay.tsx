import React from 'react'
import { useTheme } from '../context/ThemeContext'
import type { PageDimensions } from '@shared/index'

interface PageOverlayProps {
  pageDimensions: PageDimensions
  scrollX: number
  scrollY: number
  zoom: number
}

function PageOverlayComponent({
  pageDimensions,
  scrollX,
  scrollY,
  zoom
}: PageOverlayProps): React.JSX.Element {
  const { theme } = useTheme()

  const left = scrollX * zoom
  const top = scrollY * zoom
  const width = pageDimensions.width * zoom
  const height = pageDimensions.height * zoom

  const isDark = theme === 'dark'

  return (
    <div
      className="page-overlay-container"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2
      }}
      aria-hidden="true"
    >
      <div
        className="page-sheet-boundary"
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          boxShadow: isDark
            ? '0 0 0 9999px rgba(0, 0, 0, 0.40), 0 20px 60px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.10)'
            : '0 0 0 9999px rgba(0, 0, 0, 0.12), 0 20px 60px -10px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          borderRadius: '2px',
          transition: 'none'
        }}
      />
    </div>
  )
}

export const PageOverlay = React.memo(PageOverlayComponent)
