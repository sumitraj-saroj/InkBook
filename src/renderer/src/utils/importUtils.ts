import { restore } from '@excalidraw/excalidraw'
import type { BinaryFiles } from '@excalidraw/excalidraw/types'
import {
  getPageDimensions,
  scaleAndCenterElements,
  type BoundedElement,
  type Page
} from '@shared/index'
import { useNotebookStore } from '../store/notebookStore'

export interface RestoredSceneData {
  elements: readonly BoundedElement[]
  files: BinaryFiles
}

/**
 * Parses raw JSON string of an .excalidraw file and restores elements and embedded files.
 */
export function parseExcalidrawJson(jsonContent: string): RestoredSceneData {
  const parsed = JSON.parse(jsonContent)
  const restored = restore(parsed, null, null)

  return {
    elements: restored.elements as unknown as readonly BoundedElement[],
    files: restored.files ?? {}
  }
}

/**
 * Extracts a readable title from a file path or returns a fallback title.
 */
export function getTitleFromPath(filePath?: string, fallback = 'Imported Page'): string {
  if (!filePath) return fallback
  const segments = filePath.split(/[/\\]/)
  const lastSegment = segments[segments.length - 1] ?? fallback
  return lastSegment.replace(/\.(excalidraw|json)$/i, '') || fallback
}

/**
 * Imports an .excalidraw drawing as a brand-new notebook page.
 * Scales down content uniformly to fit within page margins if larger than page dimensions,
 * centers elements on the page, and switches to the new page.
 */
export function importExcalidrawAsNewPage(
  content: string,
  filePath?: string
): { page: Page; elements: readonly BoundedElement[]; files: BinaryFiles } {
  const restored = parseExcalidrawJson(content)
  const store = useNotebookStore.getState()

  // Create new page with default A4 portrait preset
  const newPage = store.addPage('A4', 'portrait', 'blank')
  const title = getTitleFromPath(filePath, `Imported - ${newPage.title}`)
  store.renamePage(newPage.id, title)

  const dims = getPageDimensions(newPage)
  const scaledElements = scaleAndCenterElements(restored.elements, dims.width, dims.height, 48)

  store.updatePageScene(newPage.id, {
    elements: scaledElements,
    files: restored.files as Record<string, unknown>
  })

  return {
    page: { ...newPage, title },
    elements: scaledElements,
    files: restored.files
  }
}
