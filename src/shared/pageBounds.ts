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

  // Standard rectangular elements (rectangle, image, frame, etc.)
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
