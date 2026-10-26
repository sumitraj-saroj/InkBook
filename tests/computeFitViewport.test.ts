import { describe, it, expect } from 'vitest'
import { computeFitViewport, clampViewport } from '@shared/pageBounds'

describe('computeFitViewport', () => {
  const insets = { top: 72, bottom: 64, left: 16, right: 16 }
  const padding = 20

  it('correctly fits and centers an A4 portrait page in a standard window', () => {
    const pageSize = { width: 794, height: 1123 }
    const canvasSize = { width: 1040, height: 752 }

    const fit = computeFitViewport(pageSize, canvasSize, insets, padding)

    expect(fit.zoom).toBeGreaterThan(0)

    // Calculate rendered screen bounds in canvas coordinates
    const pageScreenLeft = fit.scrollX * fit.zoom
    const pageScreenRight = pageScreenLeft + pageSize.width * fit.zoom
    const pageScreenTop = fit.scrollY * fit.zoom
    const pageScreenBottom = pageScreenTop + pageSize.height * fit.zoom

    const usableLeft = (insets.left ?? 0) + padding
    const usableRight = canvasSize.width - (insets.right ?? 0) - padding
    const usableTop = (insets.top ?? 0) + padding
    const usableBottom = canvasSize.height - (insets.bottom ?? 0) - padding

    // Must be completely inside the usable area (not under top toolbar, not touching bottom bar)
    expect(pageScreenTop).toBeGreaterThanOrEqual(usableTop - 0.001)
    expect(pageScreenBottom).toBeLessThanOrEqual(usableBottom + 0.001)
    expect(pageScreenLeft).toBeGreaterThanOrEqual(usableLeft - 0.001)
    expect(pageScreenRight).toBeLessThanOrEqual(usableRight + 0.001)

    // Must be centered within usable area
    const leftMargin = pageScreenLeft - usableLeft
    const rightMargin = usableRight - pageScreenRight
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(0.01)

    const topMargin = pageScreenTop - usableTop
    const bottomMargin = usableBottom - pageScreenBottom
    expect(Math.abs(topMargin - bottomMargin)).toBeLessThan(0.01)

    // Must be accepted by clampViewport without being clamped
    const clamped = clampViewport({
      scrollX: fit.scrollX,
      scrollY: fit.scrollY,
      zoom: fit.zoom,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      viewportWidth: canvasSize.width,
      viewportHeight: canvasSize.height
    })
    expect(clamped.clamped).toBe(false)
  })

  it('correctly fits and centers an A4 landscape page', () => {
    const pageSize = { width: 1123, height: 794 }
    const canvasSize = { width: 1040, height: 752 }

    const fit = computeFitViewport(pageSize, canvasSize, insets, padding)

    const pageScreenLeft = fit.scrollX * fit.zoom
    const pageScreenRight = pageScreenLeft + pageSize.width * fit.zoom
    const pageScreenTop = fit.scrollY * fit.zoom
    const pageScreenBottom = pageScreenTop + pageSize.height * fit.zoom

    const usableLeft = (insets.left ?? 0) + padding
    const usableRight = canvasSize.width - (insets.right ?? 0) - padding
    const usableTop = (insets.top ?? 0) + padding
    const usableBottom = canvasSize.height - (insets.bottom ?? 0) - padding

    expect(pageScreenTop).toBeGreaterThanOrEqual(usableTop - 0.001)
    expect(pageScreenBottom).toBeLessThanOrEqual(usableBottom + 0.001)
    expect(pageScreenLeft).toBeGreaterThanOrEqual(usableLeft - 0.001)
    expect(pageScreenRight).toBeLessThanOrEqual(usableRight + 0.001)

    const leftMargin = pageScreenLeft - usableLeft
    const rightMargin = usableRight - pageScreenRight
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(0.01)

    const clamped = clampViewport({
      scrollX: fit.scrollX,
      scrollY: fit.scrollY,
      zoom: fit.zoom,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      viewportWidth: canvasSize.width,
      viewportHeight: canvasSize.height
    })
    expect(clamped.clamped).toBe(false)
  })

  it('correctly fits and centers in a tiny window', () => {
    const pageSize = { width: 794, height: 1123 }
    const canvasSize = { width: 400, height: 300 }
    const tinyInsets = { top: 40, bottom: 40, left: 10, right: 10 }

    const fit = computeFitViewport(pageSize, canvasSize, tinyInsets, 10)

    const pageScreenTop = fit.scrollY * fit.zoom
    const pageScreenBottom = pageScreenTop + pageSize.height * fit.zoom
    const pageScreenLeft = fit.scrollX * fit.zoom
    const pageScreenRight = pageScreenLeft + pageSize.width * fit.zoom

    const usableLeft = (tinyInsets.left ?? 0) + 10
    const usableRight = canvasSize.width - (tinyInsets.right ?? 0) - 10
    const usableTop = (tinyInsets.top ?? 0) + 10
    const usableBottom = canvasSize.height - (tinyInsets.bottom ?? 0) - 10

    expect(pageScreenTop).toBeGreaterThanOrEqual(usableTop - 0.001)
    expect(pageScreenBottom).toBeLessThanOrEqual(usableBottom + 0.001)
    expect(pageScreenLeft).toBeGreaterThanOrEqual(usableLeft - 0.001)
    expect(pageScreenRight).toBeLessThanOrEqual(usableRight + 0.001)

    const clamped = clampViewport({
      scrollX: fit.scrollX,
      scrollY: fit.scrollY,
      zoom: fit.zoom,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      viewportWidth: canvasSize.width,
      viewportHeight: canvasSize.height
    })
    expect(clamped.clamped).toBe(false)
  })

  it('correctly fits and centers in a huge 4K window', () => {
    const pageSize = { width: 794, height: 1123 }
    const canvasSize = { width: 3840, height: 2160 }

    const fit = computeFitViewport(pageSize, canvasSize, insets, padding)

    const pageScreenTop = fit.scrollY * fit.zoom
    const pageScreenBottom = pageScreenTop + pageSize.height * fit.zoom
    const pageScreenLeft = fit.scrollX * fit.zoom
    const pageScreenRight = pageScreenLeft + pageSize.width * fit.zoom

    const usableLeft = (insets.left ?? 0) + padding
    const usableRight = canvasSize.width - (insets.right ?? 0) - padding
    const usableTop = (insets.top ?? 0) + padding
    const usableBottom = canvasSize.height - (insets.bottom ?? 0) - padding

    expect(pageScreenTop).toBeGreaterThanOrEqual(usableTop - 0.001)
    expect(pageScreenBottom).toBeLessThanOrEqual(usableBottom + 0.001)
    expect(pageScreenLeft).toBeGreaterThanOrEqual(usableLeft - 0.001)
    expect(pageScreenRight).toBeLessThanOrEqual(usableRight + 0.001)

    const leftMargin = pageScreenLeft - usableLeft
    const rightMargin = usableRight - pageScreenRight
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(0.01)

    const clamped = clampViewport({
      scrollX: fit.scrollX,
      scrollY: fit.scrollY,
      zoom: fit.zoom,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      viewportWidth: canvasSize.width,
      viewportHeight: canvasSize.height
    })
    expect(clamped.clamped).toBe(false)
  })
})
