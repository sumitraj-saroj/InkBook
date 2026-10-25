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
  transparent = false
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
  const { spacing, ruledTopMargin, ruledLeftMargin, showRuledLeftMargin, dotRadius, strokeWidth } =
    BACKGROUND_CONFIG

  if (background === 'ruled') {
    ctx.strokeStyle = colors.ruledLine
    ctx.lineWidth = strokeWidth
    ctx.beginPath()
    for (let y = ruledTopMargin; y < height; y += spacing) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    ctx.stroke()

    if (showRuledLeftMargin) {
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
