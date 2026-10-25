import { getElementBounds, type BoundedElement, type ElementBounds } from './pageBounds'

/**
 * Calculates the combined bounding box enclosing all non-deleted elements.
 * Returns null if elements array is empty or contains only deleted elements.
 */
export function getElementsCombinedBounds(
  elements: readonly BoundedElement[]
): ElementBounds | null {
  const visible = elements.filter((el) => !el.isDeleted)
  if (visible.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const el of visible) {
    const b = getElementBounds(el)
    minX = Math.min(minX, b.minX)
    minY = Math.min(minY, b.minY)
    maxX = Math.max(maxX, b.maxX)
    maxY = Math.max(maxY, b.maxY)
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

/**
 * Scales a collection of elements down uniformly if they exceed page dimensions
 * (accounting for margin), and translates them so their center aligns with the page center.
 *
 * If elements already fit within page dimensions minus margin, scale factor is 1.0 (no distortion),
 * but they are still centered within the page boundaries.
 */
export function scaleAndCenterElements<T extends BoundedElement>(
  elements: readonly T[],
  pageWidth: number,
  pageHeight: number,
  margin = 48
): T[] {
  if (elements.length === 0) return []

  const bounds = getElementsCombinedBounds(elements)
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return elements.map((el) => ({ ...el }))
  }

  const maxAllowedWidth = Math.max(10, pageWidth - margin * 2)
  const maxAllowedHeight = Math.max(10, pageHeight - margin * 2)

  // Scale down uniformly if larger than the allowed bounding area
  let scale = 1.0
  if (bounds.width > maxAllowedWidth || bounds.height > maxAllowedHeight) {
    const scaleX = maxAllowedWidth / bounds.width
    const scaleY = maxAllowedHeight / bounds.height
    scale = Math.min(scaleX, scaleY, 1.0)
  }

  // Original bounding center
  const origCenterX = bounds.minX + bounds.width / 2
  const origCenterY = bounds.minY + bounds.height / 2

  // Target center on the page
  const targetCenterX = pageWidth / 2
  const targetCenterY = pageHeight / 2

  return elements.map((el) => {
    const cloned = { ...el }
    const isLinear =
      (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') &&
      Array.isArray(el.points) &&
      el.points.length > 0

    if (isLinear && el.points) {
      // Scale points relative to element origin
      cloned.points = el.points.map(([px, py]) => [px * scale, py * scale])

      // Element top-left origin translated relative to target center
      const dx = el.x - origCenterX
      const dy = el.y - origCenterY
      cloned.x = targetCenterX + dx * scale
      cloned.y = targetCenterY + dy * scale
      cloned.width = el.width * scale
      cloned.height = el.height * scale
    } else {
      // Standard rectangular, text, diamond, ellipse, image elements
      const newWidth = el.width * scale
      const newHeight = el.height * scale

      // Element center before scaling
      const elCenterX = el.x + el.width / 2
      const elCenterY = el.y + el.height / 2

      // Offset from group center
      const dx = elCenterX - origCenterX
      const dy = elCenterY - origCenterY

      // New center
      const newCenterX = targetCenterX + dx * scale
      const newCenterY = targetCenterY + dy * scale

      cloned.width = newWidth
      cloned.height = newHeight
      cloned.x = newCenterX - newWidth / 2
      cloned.y = newCenterY - newHeight / 2

      // If text element, also scale font size
      if (el.type === 'text' && typeof el.fontSize === 'number') {
        cloned.fontSize = Math.max(8, Math.round(el.fontSize * scale))
      }
    }

    return cloned
  })
}

/**
 * Regenerates element IDs to prevent ID collisions when merging elements into an existing page.
 * Safely remaps containerId, frameId, and boundElements references.
 */
export function regenerateElementIds<T extends BoundedElement>(elements: readonly T[]): T[] {
  const idMap = new Map<string, string>()

  for (const el of elements) {
    const newId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    idMap.set(el.id, newId)
  }

  return elements.map((el) => {
    const newId = idMap.get(el.id) ?? el.id
    const cloned = { ...el, id: newId }

    if (cloned.containerId && idMap.has(cloned.containerId)) {
      cloned.containerId = idMap.get(cloned.containerId)
    }

    if (typeof cloned.frameId === 'string' && idMap.has(cloned.frameId)) {
      cloned.frameId = idMap.get(cloned.frameId)
    }

    if (Array.isArray(cloned.boundElements)) {
      cloned.boundElements = cloned.boundElements.map((b) => ({
        ...b,
        id: idMap.get(b.id) ?? b.id
      }))
    }

    return cloned
  })
}

/**
 * Safely extracts raw library items from an .excalidrawlib or JSON string.
 */
export function parseLibraryItems(jsonContent: string): unknown[] {
  try {
    const parsed = JSON.parse(jsonContent)
    if (Array.isArray(parsed)) {
      return parsed
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.libraryItems)) {
      return parsed.libraryItems
    }
    return []
  } catch {
    return []
  }
}

/**
 * Checks whether all non-deleted elements in the scene fit completely within
 * the target page dimensions.
 */
export function checkElementsFitPage(
  elements: readonly BoundedElement[],
  newDims: { width: number; height: number },
  tolerance = 0.5
): boolean {
  const visible = elements.filter((el) => !el.isDeleted)
  if (visible.length === 0) return true

  for (const el of visible) {
    const b = getElementBounds(el)
    if (
      b.minX < -tolerance ||
      b.minY < -tolerance ||
      b.maxX > newDims.width + tolerance ||
      b.maxY > newDims.height + tolerance
    ) {
      return false
    }
  }
  return true
}
