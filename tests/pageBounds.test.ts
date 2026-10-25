import { describe, it, expect } from 'vitest'
import {
  getElementBounds,
  isInsidePage,
  clampElementsToPage,
  rotatePoint,
  calculatePageFit,
  clampViewport,
  PAGE_PRESETS,
  BoundedElement
} from '../src/shared'

describe('pageBounds', () => {
  const a4Page = { width: PAGE_PRESETS.A4.width, height: PAGE_PRESETS.A4.height } // 794 x 1123

  describe('rotatePoint', () => {
    it('returns same coordinates if angle is 0', () => {
      const [rx, ry] = rotatePoint(100, 200, 50, 50, 0)
      expect(rx).toBe(100)
      expect(ry).toBe(200)
    })

    it('rotates 90 degrees around origin', () => {
      // (10, 0) rotated 90 deg (PI/2) around (0,0) -> (0, 10)
      const [rx, ry] = rotatePoint(10, 0, 0, 0, Math.PI / 2)
      expect(rx).toBeCloseTo(0, 5)
      expect(ry).toBeCloseTo(10, 5)
    })

    it('rotates 180 degrees around center', () => {
      const [rx, ry] = rotatePoint(10, 10, 20, 20, Math.PI)
      expect(rx).toBeCloseTo(30, 5)
      expect(ry).toBeCloseTo(30, 5)
    })
  })

  describe('getElementBounds', () => {
    it('calculates unrotated rectangle bounds', () => {
      const el: BoundedElement = {
        id: '1',
        type: 'rectangle',
        x: 50,
        y: 60,
        width: 100,
        height: 120,
        angle: 0
      }
      const bounds = getElementBounds(el)
      expect(bounds.minX).toBe(50)
      expect(bounds.minY).toBe(60)
      expect(bounds.maxX).toBe(150)
      expect(bounds.maxY).toBe(180)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBe(120)
    })

    it('calculates rotated rectangle bounds (90 degrees)', () => {
      const el: BoundedElement = {
        id: '2',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        angle: Math.PI / 2 // 90 degrees
      }
      const bounds = getElementBounds(el)
      // When rotated 90 deg, width becomes 100 and height becomes 200
      expect(bounds.width).toBeCloseTo(100, 5)
      expect(bounds.height).toBeCloseTo(200, 5)
      // Center remains (200, 150)
      expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(200, 5)
      expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(150, 5)
    })

    it('calculates ellipse bounds with rotation', () => {
      const el: BoundedElement = {
        id: '3',
        type: 'ellipse',
        x: 100,
        y: 100,
        width: 100,
        height: 60,
        angle: Math.PI / 4 // 45 deg
      }
      const bounds = getElementBounds(el)
      // Center is (150, 130), halfW = hypot(50*cos(45), 30*sin(45)) = ~41.23
      expect(bounds.minX).toBeCloseTo(150 - 41.231, 2)
      expect(bounds.maxX).toBeCloseTo(150 + 41.231, 2)
      expect(bounds.width).toBeCloseTo(82.462, 2)
      expect(bounds.height).toBeGreaterThan(0)
    })

    it('calculates diamond bounds', () => {
      const el: BoundedElement = {
        id: '4',
        type: 'diamond',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        angle: 0
      }
      const bounds = getElementBounds(el)
      expect(bounds.minX).toBe(100)
      expect(bounds.maxX).toBe(200)
      expect(bounds.minY).toBe(100)
      expect(bounds.maxY).toBe(200)
    })

    it('calculates linear element and arrow bounds from points', () => {
      const arrow: BoundedElement = {
        id: '5',
        type: 'arrow',
        x: 50,
        y: 50,
        width: 150,
        height: 100,
        points: [
          [0, 0],
          [50, 20],
          [150, 100]
        ],
        angle: 0,
        endArrowhead: 'arrow'
      }
      const bounds = getElementBounds(arrow)
      // Base points are x: 50..200, y: 50..150; with arrowhead margin:
      expect(bounds.minX).toBeLessThanOrEqual(50)
      expect(bounds.maxX).toBeGreaterThanOrEqual(200)
      expect(bounds.minY).toBeLessThanOrEqual(50)
      expect(bounds.maxY).toBeGreaterThanOrEqual(150)
    })

    it('calculates freedraw element bounds from points', () => {
      const freedraw: BoundedElement = {
        id: '6',
        type: 'freedraw',
        x: 80,
        y: 90,
        width: 60,
        height: 70,
        points: [
          [0, 0],
          [20, 30],
          [60, 70]
        ],
        angle: 0
      }
      const bounds = getElementBounds(freedraw)
      expect(bounds.minX).toBe(80)
      expect(bounds.minY).toBe(90)
      expect(bounds.maxX).toBe(140)
      expect(bounds.maxY).toBe(160)
    })

    it('calculates text bounds with rotation', () => {
      const text: BoundedElement = {
        id: '7',
        type: 'text',
        x: 100,
        y: 100,
        width: 80,
        height: 30,
        angle: Math.PI / 2
      }
      const bounds = getElementBounds(text)
      expect(bounds.width).toBeCloseTo(30, 5)
      expect(bounds.height).toBeCloseTo(80, 5)
    })
  })

  describe('isInsidePage', () => {
    it('returns true when element is completely inside', () => {
      const bounds = { minX: 10, minY: 10, maxX: 700, maxY: 1000, width: 690, height: 990 }
      expect(isInsidePage(bounds, a4Page)).toBe(true)
    })

    it('returns false when element extends past right edge', () => {
      const bounds = { minX: 100, minY: 10, maxX: 800, maxY: 500, width: 700, height: 490 }
      expect(isInsidePage(bounds, a4Page)).toBe(false)
    })

    it('returns false when element extends past bottom edge', () => {
      const bounds = { minX: 10, minY: 1000, maxX: 500, maxY: 1150, width: 490, height: 150 }
      expect(isInsidePage(bounds, a4Page)).toBe(false)
    })

    it('returns false when element extends into negative coordinates', () => {
      const bounds = { minX: -10, minY: 50, maxX: 100, maxY: 150, width: 110, height: 100 }
      expect(isInsidePage(bounds, a4Page)).toBe(false)
    })

    it('supports Page object with size and orientation', () => {
      const landscapePage = {
        size: { preset: 'A4' as const, width: 794, height: 1123 },
        orientation: 'landscape' as const
      }
      // Landscape A4 is 1123 x 794
      const bounds = { minX: 800, minY: 100, maxX: 1000, maxY: 600, width: 200, height: 500 }
      expect(isInsidePage(bounds, landscapePage)).toBe(true)
    })
  })

  describe('clampElementsToPage', () => {
    it('returns original array if all elements are inside', () => {
      const elements: BoundedElement[] = [
        { id: '1', type: 'rectangle', x: 50, y: 50, width: 100, height: 100 }
      ]
      const clamped = clampElementsToPage(elements, a4Page)
      expect(clamped).toBe(elements)
    })

    it('translates dragged element back into page when it crosses the right edge', () => {
      const elements: BoundedElement[] = [
        { id: '1', type: 'rectangle', x: 750, y: 100, width: 100, height: 100 }
      ]
      const clamped = clampElementsToPage(elements, a4Page)
      const first = clamped[0]!
      expect(first.x).toBe(694) // 794 - 100 = 694
      expect(first.y).toBe(100)
      const b = getElementBounds(first)
      expect(isInsidePage(b, a4Page)).toBe(true)
    })

    it('translates element back into page when it crosses the left edge (negative x)', () => {
      const elements: BoundedElement[] = [
        { id: '1', type: 'rectangle', x: -40, y: 50, width: 100, height: 100 }
      ]
      const clamped = clampElementsToPage(elements, a4Page)
      const first = clamped[0]!
      expect(first.x).toBe(0)
      expect(first.y).toBe(50)
      expect(isInsidePage(getElementBounds(first), a4Page)).toBe(true)
    })

    it('translates element back into page when it crosses the bottom edge', () => {
      const elements: BoundedElement[] = [
        { id: '1', type: 'rectangle', x: 100, y: 1100, width: 100, height: 50 }
      ]
      const clamped = clampElementsToPage(elements, a4Page)
      const first = clamped[0]!
      expect(first.y).toBe(1073) // 1123 - 50 = 1073
      expect(isInsidePage(getElementBounds(first), a4Page)).toBe(true)
    })

    it('clamps size for oversized unrotated elements that exceed page size', () => {
      const oversized: BoundedElement = {
        id: '1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 1500,
        height: 2000
      }
      const clamped = clampElementsToPage([oversized], a4Page)
      const first = clamped[0]!
      expect(first.width).toBe(794)
      expect(first.height).toBe(1123)
      expect(isInsidePage(getElementBounds(first), a4Page)).toBe(true)
    })

    it('clamps freedraw points extending beyond the page', () => {
      const freedraw: BoundedElement = {
        id: '1',
        type: 'freedraw',
        x: 750,
        y: 100,
        width: 100,
        height: 50,
        points: [
          [0, 0],
          [30, 20],
          [100, 40] // 750 + 100 = 850 > 794
        ]
      }
      const clamped = clampElementsToPage([freedraw], a4Page)
      const first = clamped[0]!
      const b = getElementBounds(first)
      expect(isInsidePage(b, a4Page)).toBe(true)
    })

    it('reverts rotated element to previous snapshot when rotation exceeds page bounds and cannot fit', () => {
      const prev: BoundedElement = {
        id: '1',
        type: 'rectangle',
        x: 10,
        y: 10,
        width: 790,
        height: 1100,
        angle: 0
      }
      // Huge rectangle rotated by 45 degrees cannot fit inside 794 x 1123
      const updated: BoundedElement = {
        ...prev,
        angle: Math.PI / 4
      }
      const clamped = clampElementsToPage([updated], a4Page, [prev])
      const first = clamped[0]!
      expect(first.angle).toBe(0) // reverted to prev
      expect(isInsidePage(getElementBounds(first), a4Page)).toBe(true)
    })

    it('shifts all elements uniformly when dragged as a group or multi-selection', () => {
      const prev: BoundedElement[] = [
        { id: '1', type: 'rectangle', x: 500, y: 100, width: 80, height: 80 },
        { id: '2', type: 'rectangle', x: 600, y: 100, width: 80, height: 80 }
      ]
      // Both elements dragged right by 150px: element 2 crosses edge (750 + 80 = 830 > 794)
      const moved: BoundedElement[] = [
        { ...prev[0]!, x: 650 },
        { ...prev[1]!, x: 750 }
      ]
      const clamped = clampElementsToPage(moved, a4Page, prev)
      const el1 = clamped[0]!
      const el2 = clamped[1]!
      // Group width is (750 + 80) - 650 = 180. To fit within 794, shift is 794 - 830 = -36
      // el2.x becomes 750 - 36 = 714 (714 + 80 = 794)
      // el1.x becomes 650 - 36 = 614, preserving the 100px relative distance!
      expect(el2.x).toBe(714)
      expect(el1.x).toBe(614)
      expect(el2.x - el1.x).toBe(100)
    })

    it('shifts newly pasted or duplicated elements into page preserving relative positions', () => {
      // User pastes 2 elements at cursor near bottom-right edge
      const pasted: BoundedElement[] = [
        { id: 'p1', type: 'rectangle', x: 750, y: 1100, width: 80, height: 50 },
        { id: 'p2', type: 'rectangle', x: 800, y: 1120, width: 50, height: 40 }
      ]
      const clamped = clampElementsToPage(pasted, a4Page, [])
      const p1 = clamped[0]!
      const p2 = clamped[1]!
      // p2 was up to x=850, y=1160. To fit inside 794x1123, group shifts left by (850 - 794) = 56, and up by (1160 - 1123) = 37
      expect(isInsidePage(getElementBounds(p1), a4Page)).toBe(true)
      expect(isInsidePage(getElementBounds(p2), a4Page)).toBe(true)
      // Relative distance preserved:
      expect(p2.x - p1.x).toBe(50)
      expect(p2.y - p1.y).toBe(20)
    })

    it('scales down oversized images proportionally to fit page', () => {
      const hugeImage: BoundedElement = {
        id: 'img1',
        type: 'image',
        x: 100,
        y: 100,
        width: 1588, // 2x A4 width
        height: 2246 // 2x A4 height
      }
      const clamped = clampElementsToPage([hugeImage], a4Page, [])
      const img = clamped[0]!
      expect(img.width).toBeLessThanOrEqual(794)
      expect(img.height).toBeLessThanOrEqual(1123)
      // Aspect ratio preserved (1588 / 2246 ~ 0.707)
      expect(img.width / img.height).toBeCloseTo(1588 / 2246, 1)
      expect(isInsidePage(getElementBounds(img), a4Page)).toBe(true)
    })

    it('clamps arrow endpoints taking arrowhead margin into account', () => {
      const arrow: BoundedElement = {
        id: 'a1',
        type: 'arrow',
        x: 700,
        y: 100,
        width: 120,
        height: 20,
        points: [
          [0, 0],
          [120, 0] // 700 + 120 = 820 > 794
        ],
        endArrowhead: 'arrow'
      }
      const clamped = clampElementsToPage([arrow], a4Page, [])
      const el = clamped[0]!
      const bounds = getElementBounds(el)
      expect(isInsidePage(bounds, a4Page)).toBe(true)
    })

    it('shifts text leftward when text typing grows past right edge', () => {
      // Text originally at x=700 with width=50 (fits inside 794)
      const prev: BoundedElement = {
        id: 't1',
        type: 'text',
        x: 700,
        y: 200,
        width: 50,
        height: 30
      }
      // User types more text, width expands to 150 (700 + 150 = 850 > 794)
      const expanded: BoundedElement = {
        ...prev,
        width: 150
      }
      const clamped = clampElementsToPage([expanded], a4Page, [prev])
      const el = clamped[0]!
      // Should shift left to 794 - 150 = 644
      expect(el.x).toBe(644)
      expect(isInsidePage(getElementBounds(el), a4Page)).toBe(true)
    })

    it('ignores deleted elements', () => {
      const deleted: BoundedElement = {
        id: '1',
        type: 'rectangle',
        x: -500,
        y: -500,
        width: 100,
        height: 100,
        isDeleted: true
      }
      const clamped = clampElementsToPage([deleted], a4Page)
      const first = clamped[0]!
      expect(first.x).toBe(-500)
    })
  })

  describe('viewport helpers', () => {
    it('calculates page fit centered in viewport', () => {
      const fit = calculatePageFit({
        pageWidth: 794,
        pageHeight: 1123,
        viewportWidth: 1000,
        viewportHeight: 800,
        padding: 40
      })
      expect(fit.zoom).toBeGreaterThan(0)
      expect(fit.zoom).toBeLessThanOrEqual(1.0)
      // Screen X of page center should be exactly viewportWidth / 2 = 500
      const centerScreenX = (794 / 2 + fit.scrollX) * fit.zoom
      expect(centerScreenX).toBeCloseTo(500, 2)
      // Screen Y of page center should be exactly viewportHeight / 2 = 400
      const centerScreenY = (1123 / 2 + fit.scrollY) * fit.zoom
      expect(centerScreenY).toBeCloseTo(400, 2)
    })

    it('clamps viewport when scrolled completely out of view', () => {
      // Page is at [0, 0, 794, 1123]. Scrolled massively off screen to scrollX = -5000
      const res = clampViewport({
        scrollX: -5000,
        scrollY: 0,
        zoom: 1,
        pageWidth: 794,
        pageHeight: 1123,
        viewportWidth: 1000,
        viewportHeight: 800,
        margin: 80
      })
      expect(res.clamped).toBe(true)
      expect(res.scrollX).toBeGreaterThan(-5000)
      // Bottom-right edge (794 + scrollX) * zoom must be >= 80
      expect((794 + res.scrollX) * res.zoom).toBeGreaterThanOrEqual(79.9)
    })
  })
})
