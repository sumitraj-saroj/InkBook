import { getPageDimensions } from './constants'
import type { PageOrientation, PageSize } from './types'

export interface ElementBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface BoundedElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  angle?: number
  type?: string
  points?: readonly (readonly [number, number])[]
  isDeleted?: boolean
  containerId?: string | null
  startArrowhead?: string | null
  endArrowhead?: string | null
  strokeWidth?: number
  version?: number
  versionNonce?: number
  [key: string]: unknown
}

/**
 * Rotates a 2D point (x, y) around a center (cx, cy) by an angle (in radians).
 */
export function rotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angle: number
): [number, number] {
  if (!angle) return [x, y]
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = x - cx
  const dy = y - cy
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
}

/**
 * Calculates the axis-aligned bounding box of an element in scene coordinates,
 * taking into account rotation and element type.
 */
export function getElementBounds(element: BoundedElement): ElementBounds {
  const angle = element.angle ?? 0
  const width = element.width ?? 0
  const height = element.height ?? 0
  const x = element.x ?? 0
  const y = element.y ?? 0

  const cx = x + width / 2
  const cy = y + height / 2

  if (element.type === 'ellipse') {
    const a = Math.abs(width) / 2
    const b = Math.abs(height) / 2
    const halfW = Math.hypot(a * Math.cos(angle), b * Math.sin(angle))
    const halfH = Math.hypot(a * Math.sin(angle), b * Math.cos(angle))
    const minX = cx - halfW
    const maxX = cx + halfW
    const minY = cy - halfH
    const maxY = cy + halfH
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  if (element.type === 'diamond') {
    const top = rotatePoint(cx, y, cx, cy, angle)
    const right = rotatePoint(x + width, cy, cx, cy, angle)
    const bottom = rotatePoint(cx, y + height, cx, cy, angle)
    const left = rotatePoint(x, cy, cx, cy, angle)

    const minX = Math.min(top[0], right[0], bottom[0], left[0])
    const maxX = Math.max(top[0], right[0], bottom[0], left[0])
    const minY = Math.min(top[1], right[1], bottom[1], left[1])
    const maxY = Math.max(top[1], right[1], bottom[1], left[1])
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // Linear elements (line, arrow) and freedraw
  if (
    (element.type === 'line' || element.type === 'arrow' || element.type === 'freedraw') &&
    element.points &&
    element.points.length > 0
  ) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const [px, py] of element.points) {
      const sceneX = x + px
      const sceneY = y + py
      const rotated = rotatePoint(sceneX, sceneY, cx, cy, angle)
      minX = Math.min(minX, rotated[0])
      minY = Math.min(minY, rotated[1])
      maxX = Math.max(maxX, rotated[0])
      maxY = Math.max(maxY, rotated[1])
    }

    // For arrows with arrowheads, account for the arrowhead geometry
    if (element.type === 'arrow') {
      const stroke = element.strokeWidth ?? 1
      const arrowheadMargin = Math.max(stroke * 2, 10)
      if (element.startArrowhead || element.endArrowhead) {
        minX -= arrowheadMargin
        minY -= arrowheadMargin
        maxX += arrowheadMargin
        maxY += arrowheadMargin
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // Text elements and standard rectangular elements (rectangle, image, frame, text)
  if (!angle) {
    const minX = Math.min(x, x + width)
    const maxX = Math.max(x, x + width)
    const minY = Math.min(y, y + height)
    const maxY = Math.max(y, y + height)
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  const p1 = rotatePoint(x, y, cx, cy, angle)
  const p2 = rotatePoint(x + width, y, cx, cy, angle)
  const p3 = rotatePoint(x + width, y + height, cx, cy, angle)
  const p4 = rotatePoint(x, y + height, cx, cy, angle)

  const minX = Math.min(p1[0], p2[0], p3[0], p4[0])
  const maxX = Math.max(p1[0], p2[0], p3[0], p4[0])
  const minY = Math.min(p1[1], p2[1], p3[1], p4[1])
  const maxY = Math.max(p1[1], p2[1], p3[1], p4[1])

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export type PageTarget =
  { size: PageSize; orientation: PageOrientation } | { width: number; height: number }

export function resolvePageDimensions(page: PageTarget): { width: number; height: number } {
  if ('size' in page && 'orientation' in page) {
    return getPageDimensions(page)
  }
  return { width: page.width, height: page.height }
}

/**
 * Checks whether an element's bounding box is fully contained within the page rectangle (0,0,width,height).
 */
export function isInsidePage(bounds: ElementBounds, page: PageTarget, tolerance = 0.01): boolean {
  const dims = resolvePageDimensions(page)
  return (
    bounds.minX >= -tolerance &&
    bounds.minY >= -tolerance &&
    bounds.maxX <= dims.width + tolerance &&
    bounds.maxY <= dims.height + tolerance
  )
}

/**
 * Clamps an individual element so its bounding box lies strictly within the page.
 */
export function clampElementToPage<T extends BoundedElement>(
  element: T,
  page: PageTarget,
  previousElement?: T
): T {
  if (element.isDeleted) return element

  const dims = resolvePageDimensions(page)
  const bounds = getElementBounds(element)

  if (isInsidePage(bounds, dims)) {
    return element
  }

  const pageWidth = dims.width
  const pageHeight = dims.height
  const bw = bounds.width
  const bh = bounds.height

  // 1. If element's bounding box fits within page dimensions, translate it into view
  if (bw <= pageWidth + 0.01 && bh <= pageHeight + 0.01) {
    let dx = 0
    let dy = 0

    if (bounds.minX < 0) {
      dx = -bounds.minX
    } else if (bounds.maxX > pageWidth) {
      dx = pageWidth - bounds.maxX
    }

    if (bounds.minY < 0) {
      dy = -bounds.minY
    } else if (bounds.maxY > pageHeight) {
      dy = pageHeight - bounds.maxY
    }

    const translated: T = {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      version: (element.version ?? 0) + 1,
      versionNonce: Math.floor(Math.random() * 2000000000)
    }

    const newBounds = getElementBounds(translated)
    if (isInsidePage(newBounds, dims)) {
      return translated
    }
  }

  // 2. Element exceeds page dimensions or rotation prevents pure translation
  // Handle linear elements (lines, arrows) and freedraw by clamping their points
  if (
    (element.type === 'line' || element.type === 'arrow' || element.type === 'freedraw') &&
    element.points &&
    element.points.length > 0
  ) {
    const angle = element.angle ?? 0
    if (!angle) {
      const clampedPoints = element.points.map(([px, py]) => {
        const sx = Math.max(0, Math.min(pageWidth, element.x + px))
        const sy = Math.max(0, Math.min(pageHeight, element.y + py))
        return [sx - element.x, sy - element.y] as const
      })

      const clamped: T = {
        ...element,
        points: clampedPoints,
        version: (element.version ?? 0) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000)
      }

      const newBounds = getElementBounds(clamped)
      if (isInsidePage(newBounds, dims)) {
        return clamped
      }
    }
  }

  // 3. For unrotated shapes (rectangles, ellipses, diamonds, images, frames)
  if (!element.angle) {
    let nextX = Math.max(0, Math.min(pageWidth, element.x))
    let nextY = Math.max(0, Math.min(pageHeight, element.y))
    let nextW = Math.max(1, Math.min(element.width, pageWidth - nextX))
    let nextH = Math.max(1, Math.min(element.height, pageHeight - nextY))

    if (element.x < 0) {
      nextW = Math.max(1, element.width + element.x)
      nextX = 0
    }
    if (element.y < 0) {
      nextH = Math.max(1, element.height + element.y)
      nextY = 0
    }

    const clamped: T = {
      ...element,
      x: nextX,
      y: nextY,
      width: Math.min(nextW, pageWidth - nextX),
      height: Math.min(nextH, pageHeight - nextY),
      version: (element.version ?? 0) + 1,
      versionNonce: Math.floor(Math.random() * 2000000000)
    }

    const newBounds = getElementBounds(clamped)
    if (isInsidePage(newBounds, dims)) {
      return clamped
    }
  }

  // 4. If previous valid state exists, revert to it
  if (previousElement && !previousElement.isDeleted) {
    const prevBounds = getElementBounds(previousElement)
    if (isInsidePage(prevBounds, dims)) {
      return {
        ...previousElement,
        version: (element.version ?? 0) + 1,
        versionNonce: Math.floor(Math.random() * 2000000000)
      }
    }
  }

  // 5. Hard fallback: fit into top-left of page
  const safeW = Math.max(1, Math.min(element.width, pageWidth))
  const safeH = Math.max(1, Math.min(element.height, pageHeight))
  return {
    ...element,
    x: 0,
    y: 0,
    width: safeW,
    height: safeH,
    angle: 0,
    version: (element.version ?? 0) + 1,
    versionNonce: Math.floor(Math.random() * 2000000000)
  }
}

/**
 * Validates and clamps an array of elements so that all non-deleted elements
 * strictly reside within the page boundaries. Returns the clamped element array.
 */
export function clampElementsToPage<T extends BoundedElement>(
  elements: readonly T[],
  page: PageTarget,
  previousElements?: readonly T[]
): T[] {
  const dims = resolvePageDimensions(page)
  let hasViolation = false

  for (const el of elements) {
    if (!el.isDeleted) {
      const bounds = getElementBounds(el)
      if (!isInsidePage(bounds, dims)) {
        hasViolation = true
        break
      }
    }
  }

  if (!hasViolation) {
    return elements as T[]
  }

  const prevMap = new Map<string, T>()
  if (previousElements) {
    for (const prev of previousElements) {
      prevMap.set(prev.id, prev)
    }
  }

  return elements.map((el) => {
    if (el.isDeleted) return el
    const prev = prevMap.get(el.id)
    return clampElementToPage(el, dims, prev)
  })
}
