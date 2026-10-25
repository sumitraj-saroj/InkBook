import { BACKGROUND_CONFIG, getBackgroundColors } from './backgroundConfig'
import type { PageBackground } from './types'

/**
 * Draws the page paper and ruled/grid/dots background pattern directly onto a 2D canvas context.
 */
export function drawPageBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: PageBackground,
  theme: 'dark' | 'light' = 'dark',
  transparent = false,
  showMarginLine = BACKGROUND_CONFIG.showRuledLeftMargin
): void {
  const colors = getBackgroundColors(theme)

  if (!transparent) {
    ctx.fillStyle = colors.paper
    ctx.fillRect(0, 0, width, height)
  }

  if (background === 'blank') {
    return
  }

  ctx.save()
  const { spacing, ruledTopMargin, ruledLeftMargin, dotRadius, strokeWidth } = BACKGROUND_CONFIG

  if (background === 'ruled') {
    ctx.strokeStyle = colors.ruledLine
    ctx.lineWidth = strokeWidth
    ctx.beginPath()
    for (let y = ruledTopMargin; y < height; y += spacing) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()

    if (showMarginLine) {
      ctx.strokeStyle = colors.ruledMarginLine
      ctx.beginPath()
      ctx.moveTo(ruledLeftMargin, 0)
      ctx.lineTo(ruledLeftMargin, height)
      ctx.stroke()
    }
  } else if (background === 'grid') {
    ctx.strokeStyle = colors.gridLine
    ctx.lineWidth = strokeWidth
    ctx.beginPath()
    for (let x = spacing; x < width; x += spacing) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    for (let y = spacing; y < height; y += spacing) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()
  } else if (background === 'dots') {
    ctx.fillStyle = colors.dot
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  ctx.restore()
}

/**
 * Generates vector SVG markup for the page paper and background pattern.
 */
export function generateBackgroundSvgMarkup(
  width: number,
  height: number,
  background: PageBackground,
  theme: 'dark' | 'light' = 'dark',
  transparent = false,
  showMarginLine = BACKGROUND_CONFIG.showRuledLeftMargin
): string {
  const colors = getBackgroundColors(theme)
  const { spacing, ruledTopMargin, ruledLeftMargin, dotRadius, strokeWidth } = BACKGROUND_CONFIG

  let bgMarkup = ''
  if (!transparent) {
    bgMarkup += `<rect x="0" y="0" width="${width}" height="${height}" fill="${colors.paper}" />\n`
  }

  if (background === 'blank') {
    return bgMarkup
  }

  if (background === 'ruled') {
    let lines = ''
    for (let y = ruledTopMargin; y < height; y += spacing) {
      lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${colors.ruledLine}" stroke-width="${strokeWidth}" />\n`
    }
    if (showMarginLine) {
      lines += `<line x1="${ruledLeftMargin}" y1="0" x2="${ruledLeftMargin}" y2="${height}" stroke="${colors.ruledMarginLine}" stroke-width="${strokeWidth}" />\n`
    }
    bgMarkup += lines
  } else if (background === 'grid') {
    let lines = ''
    for (let x = spacing; x < width; x += spacing) {
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${colors.gridLine}" stroke-width="${strokeWidth}" />\n`
    }
    for (let y = spacing; y < height; y += spacing) {
      lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${colors.gridLine}" stroke-width="${strokeWidth}" />\n`
    }
    bgMarkup += lines
  } else if (background === 'dots') {
    let dots = ''
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        dots += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${colors.dot}" />\n`
      }
    }
    bgMarkup += dots
  }

  return bgMarkup
}
