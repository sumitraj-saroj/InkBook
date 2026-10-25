import React, { useId } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  type PageDimensions,
  type PageBackground as PageBackgroundType,
  getBackgroundColors,
  BACKGROUND_CONFIG
} from '@shared/index'

export interface PageBackgroundProps {
  pageDimensions: PageDimensions
  background: PageBackgroundType
  showMarginLine?: boolean
  scrollX: number
  scrollY: number
  zoom: number
}

export function PageBackgroundComponent({
  pageDimensions,
  background,
  showMarginLine = BACKGROUND_CONFIG.showRuledLeftMargin,
  scrollX,
  scrollY,
  zoom
}: PageBackgroundProps): React.JSX.Element {
  const { theme } = useTheme()
  const colors = getBackgroundColors(theme)
  const { spacing, ruledTopMargin, ruledLeftMargin, strokeWidth, dotRadius } = BACKGROUND_CONFIG

  const uniqueId = useId().replace(/:/g, '')
  const clipId = `page-paper-clip-${uniqueId}`
  const ruledPatternId = `page-ruled-pattern-${uniqueId}`
  const gridPatternId = `page-grid-pattern-${uniqueId}`
  const dotsPatternId = `page-dots-pattern-${uniqueId}`

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

        {/* Ruled horizontal lines pattern */}
        <pattern
          id={ruledPatternId}
          x="0"
          y={ruledTopMargin}
          width={pageDimensions.width}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1={spacing}
            x2={pageDimensions.width}
            y2={spacing}
            stroke={colors.ruledLine}
            strokeWidth={strokeWidth}
            shapeRendering="crispEdges"
          />
        </pattern>

        {/* Square grid pattern */}
        <pattern
          id={gridPatternId}
          x="0"
          y="0"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${spacing} 0 L 0 0 0 ${spacing}`}
            fill="none"
            stroke={colors.gridLine}
            strokeWidth={strokeWidth}
            shapeRendering="crispEdges"
          />
        </pattern>

        {/* Dot grid pattern aligned to 0,0 scene coordinates */}
        <pattern
          id={dotsPatternId}
          x={-spacing / 2}
          y={-spacing / 2}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r={dotRadius} fill={colors.dot} />
        </pattern>
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

          {background === 'ruled' && (
            <>
              {/* Horizontal ruled lines */}
              <rect
                x="0"
                y={ruledTopMargin}
                width={pageDimensions.width}
                height={Math.max(0, pageDimensions.height - ruledTopMargin)}
                fill={`url(#${ruledPatternId})`}
              />
              {/* Header dividing line at ruledTopMargin */}
              <line
                x1="0"
                y1={ruledTopMargin}
                x2={pageDimensions.width}
                y2={ruledTopMargin}
                stroke={colors.ruledLine}
                strokeWidth={strokeWidth * 1.5}
                shapeRendering="crispEdges"
              />
              {/* Optional vertical margin line on the left */}
              {showMarginLine && (
                <line
                  x1={ruledLeftMargin}
                  y1="0"
                  x2={ruledLeftMargin}
                  y2={pageDimensions.height}
                  stroke={colors.ruledMarginLine}
                  strokeWidth={strokeWidth}
                  shapeRendering="crispEdges"
                />
              )}
            </>
          )}

          {background === 'grid' && (
            <rect
              x="0"
              y="0"
              width={pageDimensions.width}
              height={pageDimensions.height}
              fill={`url(#${gridPatternId})`}
            />
          )}

          {background === 'dots' && (
            <rect
              x="0"
              y="0"
              width={pageDimensions.width}
              height={pageDimensions.height}
              fill={`url(#${dotsPatternId})`}
            />
          )}
        </g>
      </g>
    </svg>
  )
}

export const PageBackground = React.memo(PageBackgroundComponent)
