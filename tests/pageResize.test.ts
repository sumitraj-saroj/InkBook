import { describe, it, expect, vi } from 'vitest'
import {
  checkElementsFitPage,
  scaleAndCenterElements,
  clampElementsToPage,
  drawPageBackgroundToCanvas,
  generateBackgroundSvgMarkup,
  BACKGROUND_CONFIG,
  getBackgroundColors,
  type BoundedElement
} from '../src/shared/index'

describe('pageResize: checkElementsFitPage and overflow handling', () => {
  const elementsInsideA4: BoundedElement[] = [
    { id: '1', type: 'rectangle', x: 50, y: 50, width: 200, height: 100 },
    { id: '2', type: 'ellipse', x: 400, y: 600, width: 100, height: 100 }
  ]

  const elementNearBottomA4: BoundedElement = {
    id: '3',
    type: 'rectangle',
    x: 100,
    y: 900,
    width: 200,
    height: 100
  }

  it('detects when elements fit within dimensions', () => {
    // Both elements fit inside A4 (794 x 1123)
    expect(checkElementsFitPage(elementsInsideA4, { width: 794, height: 1123 })).toBe(true)
  })

  it('detects when elements overflow smaller dimensions', () => {
    // elementNearBottomA4 has maxY = 1000, which overflows A5 height (794)
    const elements = [...elementsInsideA4, elementNearBottomA4]
    expect(checkElementsFitPage(elements, { width: 559, height: 794 })).toBe(false)
  })

  it('safely handles overflow via scaleAndCenterElements without losing elements', () => {
    const elements = [...elementsInsideA4, elementNearBottomA4]
    const a5Dims = { width: 559, height: 794 }

    // When scaled to fit A5 with 48px margin
    const scaled = scaleAndCenterElements(elements, a5Dims.width, a5Dims.height, 48)

    // All original elements are preserved (never deleted)
    expect(scaled).toHaveLength(elements.length)
    expect(scaled.map((e) => e.id)).toEqual(elements.map((e) => e.id))

    // Now all elements fit inside A5
    expect(checkElementsFitPage(scaled, a5Dims)).toBe(true)
  })

  it('safely handles overflow via clampElementsToPage without losing elements', () => {
    const elements = [...elementsInsideA4, elementNearBottomA4]
    const a5Dims = { width: 559, height: 794 }

    // When clamped to A5
    const clamped = clampElementsToPage(elements, a5Dims, elements)

    // All elements are preserved
    expect(clamped).toHaveLength(elements.length)
    expect(clamped.map((e) => e.id)).toEqual(elements.map((e) => e.id))

    // Clamped elements now fit inside A5
    expect(checkElementsFitPage(clamped, a5Dims)).toBe(true)
  })
})

describe('pageSettings: showMarginLine toggle', () => {
  function createMockContext(): CanvasRenderingContext2D {
    return {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1
    } as unknown as CanvasRenderingContext2D
  }

  it('draws margin line on canvas when showMarginLine is true', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'ruled', 'dark', false, true)

    expect(ctx.moveTo).toHaveBeenCalledWith(BACKGROUND_CONFIG.ruledLeftMargin, 0)
  })

  it('omits margin line on canvas when showMarginLine is false', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'ruled', 'dark', false, false)

    expect(ctx.moveTo).not.toHaveBeenCalledWith(BACKGROUND_CONFIG.ruledLeftMargin, 0)
  })

  it('includes margin line in SVG when showMarginLine is true', () => {
    const svg = generateBackgroundSvgMarkup(794, 1123, 'ruled', 'light', false, true)
    expect(svg).toContain(`stroke="${getBackgroundColors('light').ruledMarginLine}"`)
  })

  it('omits margin line in SVG when showMarginLine is false', () => {
    const svg = generateBackgroundSvgMarkup(794, 1123, 'ruled', 'light', false, false)
    expect(svg).not.toContain(`stroke="${getBackgroundColors('light').ruledMarginLine}"`)
  })
})
