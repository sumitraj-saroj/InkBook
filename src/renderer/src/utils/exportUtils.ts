import { exportToCanvas } from '@excalidraw/excalidraw'
import type { BinaryFiles } from '@excalidraw/excalidraw/types'
import { getPageDimensions, drawPageBackgroundToCanvas, type Page } from '@shared/index'

export { drawPageBackgroundToCanvas }

export interface PngExportOptions {
  includeBackground?: boolean
  transparent?: boolean
  scale?: 1 | 2 | 3
  theme?: 'dark' | 'light'
}

/**
 * Renders a full InkBook page as an HTMLCanvasElement with scaling and background options.
 */
export async function renderPageToCanvas(
  page: Page,
  options: PngExportOptions = {},
  liveScene?: {
    elements?: readonly unknown[]
    files?: Record<string, unknown>
    appState?: Record<string, unknown>
  }
): Promise<HTMLCanvasElement> {
  const { includeBackground = true, transparent = false, scale = 1, theme = 'dark' } = options

  const dims = getPageDimensions(page)
  const fullWidth = dims.width
  const fullHeight = dims.height

  // 1. Create main output canvas
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(fullWidth * scale)
  canvas.height = Math.round(fullHeight * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D canvas rendering context')
  }

  // 2. Render background if requested or non-transparent paper
  if (includeBackground || !transparent) {
    ctx.save()
    ctx.scale(scale, scale)
    drawPageBackgroundToCanvas(
      ctx,
      fullWidth,
      fullHeight,
      includeBackground ? page.background : 'blank',
      theme,
      transparent
    )
    ctx.restore()
  }

  // 3. Render Excalidraw elements using exportToCanvas
  const elements = (liveScene?.elements ?? page.scene.elements ?? []).filter(
    (el) => !(el as Record<string, unknown>)['isDeleted']
  )
  const files = (liveScene?.files ?? page.scene.files ?? {}) as BinaryFiles
  const appState = liveScene?.appState ?? page.scene.appState ?? {}

  // Frame to force exact page boundaries
  const frame = {
    id: 'page-export-frame',
    type: 'frame',
    x: 0,
    y: 0,
    width: fullWidth,
    height: fullHeight,
    isDeleted: false
  }

  type ExportCanvasArgs = Parameters<typeof exportToCanvas>[0]

  try {
    const elementsCanvas = await exportToCanvas({
      elements: elements as ExportCanvasArgs['elements'],
      appState: {
        ...appState,
        exportScale: scale,
        exportBackground: false,
        viewBackgroundColor: 'transparent',
        exportWithDarkMode: theme === 'dark'
      } as ExportCanvasArgs['appState'],
      files,
      exportingFrame: frame as unknown as ExportCanvasArgs['exportingFrame'],
      exportPadding: 0
    })

    // Draw elements on top of the background canvas
    ctx.drawImage(elementsCanvas, 0, 0)
  } catch (err) {
    console.warn('Excalidraw elements canvas render note:', err)
  }

  return canvas
}

/**
 * Exports a page as a PNG data URL.
 */
export async function exportPageToPngDataUrl(
  page: Page,
  options: PngExportOptions = {},
  liveScene?: {
    elements?: readonly unknown[]
    files?: Record<string, unknown>
    appState?: Record<string, unknown>
  }
): Promise<string> {
  const canvas = await renderPageToCanvas(page, options, liveScene)
  return canvas.toDataURL('image/png')
}
