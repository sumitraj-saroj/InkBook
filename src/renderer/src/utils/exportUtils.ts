import { exportToCanvas, exportToSvg, serializeAsJSON } from '@excalidraw/excalidraw'
import type { BinaryFiles } from '@excalidraw/excalidraw/types'
import {
  getPageDimensions,
  drawPageBackgroundToCanvas,
  generateBackgroundSvgMarkup,
  type Page
} from '@shared/index'

export { drawPageBackgroundToCanvas, generateBackgroundSvgMarkup }

export interface PngExportOptions {
  includeBackground?: boolean
  transparent?: boolean
  scale?: 1 | 2 | 3
  theme?: 'dark' | 'light'
}

export interface SvgExportOptions {
  includeBackground?: boolean
  transparent?: boolean
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

/**
 * Exports an InkBook page as a complete SVG string, optionally embedding the vector page background.
 */
export async function exportPageToSvgString(
  page: Page,
  options: SvgExportOptions = {},
  liveScene?: {
    elements?: readonly unknown[]
    files?: Record<string, unknown>
    appState?: Record<string, unknown>
  }
): Promise<string> {
  const { includeBackground = true, transparent = false, theme = 'dark' } = options
  const dims = getPageDimensions(page)
  const fullWidth = dims.width
  const fullHeight = dims.height

  const elements = (liveScene?.elements ?? page.scene.elements ?? []).filter(
    (el) => !(el as Record<string, unknown>)['isDeleted']
  )
  const files = (liveScene?.files ?? page.scene.files ?? {}) as BinaryFiles
  const appState = liveScene?.appState ?? page.scene.appState ?? {}

  const frame = {
    id: 'page-export-frame',
    type: 'frame',
    x: 0,
    y: 0,
    width: fullWidth,
    height: fullHeight,
    isDeleted: false
  }

  type ExportSvgArgs = Parameters<typeof exportToSvg>[0]

  const svgElement = await exportToSvg({
    elements: elements as ExportSvgArgs['elements'],
    appState: {
      ...appState,
      exportBackground: false,
      viewBackgroundColor: 'transparent',
      exportWithDarkMode: theme === 'dark'
    } as ExportSvgArgs['appState'],
    files,
    exportingFrame: frame as unknown as ExportSvgArgs['exportingFrame'],
    exportPadding: 0
  })

  // Set explicit dimensions on SVG element
  svgElement.setAttribute('width', `${fullWidth}`)
  svgElement.setAttribute('height', `${fullHeight}`)
  svgElement.setAttribute('viewBox', `0 0 ${fullWidth} ${fullHeight}`)

  let svgString = new XMLSerializer().serializeToString(svgElement)

  if (includeBackground || !transparent) {
    const bgMarkup = generateBackgroundSvgMarkup(
      fullWidth,
      fullHeight,
      includeBackground ? page.background : 'blank',
      theme,
      transparent
    )
    const insertPos = svgString.indexOf('>') + 1
    if (insertPos > 0) {
      svgString =
        svgString.slice(0, insertPos) +
        `\n<g id="inkbook-page-background">\n${bgMarkup}</g>\n` +
        svgString.slice(insertPos)
    }
  }

  return svgString
}

/**
 * Serializes the page's scene into a pure Excalidraw JSON file (no page background, compatible with excalidraw.com).
 */
export function exportPageToExcalidrawJson(
  page: Page,
  liveScene?: {
    elements?: readonly unknown[]
    files?: Record<string, unknown>
    appState?: Record<string, unknown>
  }
): string {
  const elements = (liveScene?.elements ?? page.scene.elements ?? []).filter(
    (el) => !(el as Record<string, unknown>)['isDeleted']
  )
  const files = (liveScene?.files ?? page.scene.files ?? {}) as BinaryFiles
  const appState = liveScene?.appState ?? page.scene.appState ?? {}

  type SerializeAppState = Parameters<typeof serializeAsJSON>[1]

  return serializeAsJSON(
    elements as Parameters<typeof serializeAsJSON>[0],
    {
      ...appState,
      viewBackgroundColor: '#ffffff'
    } as SerializeAppState,
    files,
    'local'
  )
}
