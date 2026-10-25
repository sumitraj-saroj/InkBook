import { describe, it, expect } from 'vitest'
import {
  getElementsCombinedBounds,
  scaleAndCenterElements,
  regenerateElementIds
} from '../src/shared/importScale'
import type { BoundedElement } from '../src/shared/pageBounds'

describe('importScale: getElementsCombinedBounds', () => {
  it('returns null for empty elements array', () => {
    expect(getElementsCombinedBounds([])).toBeNull()
  })

  it('calculates bounding box enclosing multiple rectangles and circles', () => {
    const elements: BoundedElement[] = [
      { id: '1', x: 100, y: 150, width: 200, height: 100, type: 'rectangle' },
      { id: '2', x: 400, y: 300, width: 100, height: 100, type: 'ellipse' }
    ]

    const bounds = getElementsCombinedBounds(elements)
    expect(bounds).not.toBeNull()
    expect(bounds?.minX).toBe(100)
    expect(bounds?.minY).toBe(150)
    expect(bounds?.maxX).toBe(500)
    expect(bounds?.maxY).toBe(400)
    expect(bounds?.width).toBe(400)
    expect(bounds?.height).toBe(250)
  })

  it('ignores deleted elements', () => {
    const elements: BoundedElement[] = [
      { id: '1', x: 100, y: 100, width: 50, height: 50, type: 'rectangle' },
      { id: '2', x: 1000, y: 1000, width: 500, height: 500, type: 'rectangle', isDeleted: true }
    ]

    const bounds = getElementsCombinedBounds(elements)
    expect(bounds).not.toBeNull()
    expect(bounds?.maxX).toBe(150)
    expect(bounds?.maxY).toBe(150)
  })
})

describe('importScale: scaleAndCenterElements', () => {
  it('centers elements inside page if they already fit', () => {
    const elements: BoundedElement[] = [
      { id: '1', x: 0, y: 0, width: 200, height: 100, type: 'rectangle' }
    ]

    const scaled = scaleAndCenterElements(elements, 794, 1123, 48)
    expect(scaled).toHaveLength(1)
    const el = scaled[0]!

    // Page center is (397, 561.5).
    // Width 200, height 100.
    // Center of el should be (397, 561.5)
    expect(el.width).toBe(200)
    expect(el.height).toBe(100)
    expect(el.x).toBeCloseTo(397 - 100, 1)
    expect(el.y).toBeCloseTo(561.5 - 50, 1)
  })

  it('scales down uniformly when elements exceed page bounds with margin', () => {
    // Large diagram 1400 x 2000
    const elements: BoundedElement[] = [
      { id: '1', x: 0, y: 0, width: 1400, height: 2000, type: 'rectangle' }
    ]

    const pageWidth = 794
    const pageHeight = 1123
    const margin = 48
    const maxAllowedWidth = pageWidth - margin * 2 // 698
    const maxAllowedHeight = pageHeight - margin * 2 // 1027

    const scaled = scaleAndCenterElements(elements, pageWidth, pageHeight, margin)
    expect(scaled).toHaveLength(1)
    const el = scaled[0]!

    // Check that width and height are scaled down to fit within margin
    expect(el.width).toBeLessThanOrEqual(maxAllowedWidth + 0.01)
    expect(el.height).toBeLessThanOrEqual(maxAllowedHeight + 0.01)

    // Check that element is centered
    const bounds = getElementsCombinedBounds(scaled)
    expect(bounds).not.toBeNull()
    const centerX = bounds!.minX + bounds!.width / 2
    const centerY = bounds!.minY + bounds!.height / 2
    expect(centerX).toBeCloseTo(pageWidth / 2, 1)
    expect(centerY).toBeCloseTo(pageHeight / 2, 1)
  })

  it('correctly scales and centers linear points and text font size', () => {
    const elements: BoundedElement[] = [
      {
        id: '1',
        x: 0,
        y: 0,
        width: 1600,
        height: 20,
        type: 'line',
        points: [
          [0, 0],
          [1600, 0]
        ]
      },
      {
        id: '2',
        x: 50,
        y: 50,
        width: 400,
        height: 100,
        type: 'text',
        fontSize: 32
      }
    ]

    const scaled = scaleAndCenterElements(elements, 800, 1000, 50)
    const lineEl = scaled.find((el) => el.type === 'line')!
    const textEl = scaled.find((el) => el.type === 'text')!

    expect(lineEl.points![1]![0]).toBeLessThan(1600)
    expect(textEl.fontSize).toBeLessThan(32)
    expect(textEl.fontSize).toBeGreaterThanOrEqual(8)
  })
})

describe('importScale: regenerateElementIds', () => {
  it('generates new unique IDs and updates containerId and boundElements', () => {
    const elements: BoundedElement[] = [
      {
        id: 'box1',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        type: 'rectangle',
        boundElements: [{ id: 'arrow1', type: 'arrow' }]
      },
      {
        id: 'arrow1',
        x: 110,
        y: 60,
        width: 100,
        height: 10,
        type: 'arrow',
        containerId: 'box1'
      }
    ]

    const remapped = regenerateElementIds(elements)
    expect(remapped).toHaveLength(2)

    const box = remapped.find((e) => e.type === 'rectangle')!
    const arrow = remapped.find((e) => e.type === 'arrow')!

    expect(box.id).not.toBe('box1')
    expect(arrow.id).not.toBe('arrow1')
    expect(arrow.containerId).toBe(box.id)
    expect((box.boundElements as Array<{ id: string }>)[0]?.id).toBe(arrow.id)
  })
})
