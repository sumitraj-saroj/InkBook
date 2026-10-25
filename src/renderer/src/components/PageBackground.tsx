import React from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  type PageDimensions,
  type PageBackground as PageBackgroundType,
  getBackgroundColors
} from '@shared/index'

export interface PageBackgroundProps {
  pageDimensions: PageDimensions
  background: PageBackgroundType
  showMarginLine?: boolean
  scrollX: number
  scrollY: number
  zoom: number
}

export function PageBackground({
  pageDimensions,
  background: _background,
  scrollX,
  scrollY,
  zoom
}: PageBackgroundProps): React.JSX.Element {
  const { theme } = useTheme()
  const colors = getBackgroundColors(theme)

  const clipId = 'page-paper-clip'

  return (
    <svg
      className="page-background-svg"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={pageDimensions.width} height={pageDimensions.height} />
        </clipPath>
      </defs>

      <g transform={`translate(${scrollX * zoom}, ${scrollY * zoom}) scale(${zoom})`}>
        {/* Paper base sheet clipped strictly to page boundaries */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y="0"
            width={pageDimensions.width}
            height={pageDimensions.height}
            fill={colors.paper}
          />
        </g>
      </g>
    </svg>
  )
}
