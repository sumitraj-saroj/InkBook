import { describe, it, expect, vi } from 'vitest'
import {
  drawPageBackgroundToCanvas,
  generateBackgroundSvgMarkup
} from '../src/shared/backgroundCanvas'
import { BACKGROUND_CONFIG, getBackgroundColors } from '../src/shared/backgroundConfig'

describe('Page export background canvas rendering', () => {
  function createMockContext(): CanvasRenderingContext2D {
    return {
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1
    } as unknown as CanvasRenderingContext2D
  }

  it('draws solid paper background when transparent is false', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'blank', 'dark', false)

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 794, 1123)
    expect(ctx.fillStyle).toBe(getBackgroundColors('dark').paper)
  })

  it('skips paper fill when transparent is true', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'blank', 'dark', true)

    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it('draws ruled lines and left margin line for ruled background', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'ruled', 'dark', false)

    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()

    // Ruled lines start at ruledTopMargin (96) and repeat every spacing (32)
    const expectedLineCount =
      Math.floor((1123 - BACKGROUND_CONFIG.ruledTopMargin) / BACKGROUND_CONFIG.spacing) + 1
    // Total moveTo calls: one per line + 1 for margin line
    expect(ctx.moveTo).toHaveBeenCalledTimes(expectedLineCount + 1)
  })

  it('draws horizontal and vertical grid lines for grid background', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'grid', 'light', false)

    const expectedXCount =
      Math.floor((794 - BACKGROUND_CONFIG.spacing) / BACKGROUND_CONFIG.spacing) + 1
    const expectedYCount =
      Math.floor((1123 - BACKGROUND_CONFIG.spacing) / BACKGROUND_CONFIG.spacing) + 1

    expect(ctx.moveTo).toHaveBeenCalledTimes(expectedXCount + expectedYCount)
    expect(ctx.strokeStyle).toBe(getBackgroundColors('light').gridLine)
  })

  it('draws dot circles for dots background', () => {
    const ctx = createMockContext()
    drawPageBackgroundToCanvas(ctx, 794, 1123, 'dots', 'dark', false)

    expect(ctx.arc).toHaveBeenCalled()
    expect(ctx.fill).toHaveBeenCalled()
    expect(ctx.fillStyle).toBe(getBackgroundColors('dark').dot)
  })

  it('generates correct vector SVG markup for all backgrounds', () => {
    // 1. Solid blank
    const blankSvg = generateBackgroundSvgMarkup(794, 1123, 'blank', 'dark', false)
    expect(blankSvg).toContain('<rect x="0" y="0" width="794" height="1123"')
    expect(blankSvg).toContain(`fill="${getBackgroundColors('dark').paper}"`)

    // 2. Transparent blank
    const transparentSvg = generateBackgroundSvgMarkup(794, 1123, 'blank', 'dark', true)
    expect(transparentSvg).toBe('')

    // 3. Ruled SVG
    const ruledSvg = generateBackgroundSvgMarkup(794, 1123, 'ruled', 'dark', false)
    expect(ruledSvg).toContain('<line x1="0"')
    expect(ruledSvg).toContain(`stroke="${getBackgroundColors('dark').ruledLine}"`)
    expect(ruledSvg).toContain(`stroke="${getBackgroundColors('dark').ruledMarginLine}"`)

    // 4. Grid SVG
    const gridSvg = generateBackgroundSvgMarkup(794, 1123, 'grid', 'light', false)
    expect(gridSvg).toContain(`stroke="${getBackgroundColors('light').gridLine}"`)

    // 5. Dots SVG
    const dotsSvg = generateBackgroundSvgMarkup(794, 1123, 'dots', 'dark', false)
    expect(dotsSvg).toContain('<circle cx=')
    expect(dotsSvg).toContain(`fill="${getBackgroundColors('dark').dot}"`)
  })
})
