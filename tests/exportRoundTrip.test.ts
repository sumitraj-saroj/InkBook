import { describe, it, expect } from 'vitest'
import { validateNotebook } from '../src/shared/schema'
import { scaleAndCenterElements, regenerateElementIds } from '../src/shared/importScale'
import type { BoundedElement } from '../src/shared/pageBounds'
import type { Notebook, Page } from '../src/shared/types'

describe('Embedded images in export and import round-trips', () => {
  const dummyPngDataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  const sampleImageElement: BoundedElement = {
    id: 'img-elem-1',
    type: 'image',
    fileId: 'file-12345',
    x: 100,
    y: 100,
    width: 300,
    height: 200,
    status: 'saved',
    scale: [1, 1],
    angle: 0
  }

  const sampleFiles: Record<string, unknown> = {
    'file-12345': {
      id: 'file-12345',
      dataURL: dummyPngDataUrl,
      mimeType: 'image/png',
      created: 1729000000000
    }
  }

  const samplePage: Page = {
    id: 'page-1',
    title: 'Diagram with Image',
    size: { preset: 'A4', width: 794, height: 1123 },
    orientation: 'portrait',
    background: 'ruled',
    scene: {
      elements: [sampleImageElement],
      appState: { viewBackgroundColor: 'transparent' },
      files: sampleFiles
    }
  }

  it('preserves embedded images across notebook schema validation', () => {
    const notebook: Notebook = {
      format: 'inkbook',
      version: 1,
      id: 'nb-test-1',
      name: 'Notebook with Images',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [samplePage]
    }

    const validation = validateNotebook(notebook)
    expect(validation.success).toBe(true)

    if (validation.success && validation.data) {
      const page = validation.data.pages[0]!
      expect(page.scene.elements).toHaveLength(1)
      const img = page.scene.elements[0] as typeof sampleImageElement
      expect(img.type).toBe('image')
      expect(img.fileId).toBe('file-12345')

      expect(page.scene.files).toHaveProperty('file-12345')
      const fileData = page.scene.files['file-12345'] as { dataURL: string; mimeType: string }
      expect(fileData.dataURL).toBe(dummyPngDataUrl)
      expect(fileData.mimeType).toBe('image/png')
    }
  })

  it('preserves fileId references when regenerating IDs for import into current page', () => {
    const elements: BoundedElement[] = [
      sampleImageElement,
      {
        id: 'box-1',
        type: 'rectangle',
        x: 450,
        y: 100,
        width: 150,
        height: 100
      }
    ]

    const freshElements = regenerateElementIds(elements)
    expect(freshElements).toHaveLength(2)

    const freshImg = freshElements.find((e) => e.type === 'image')!
    expect(freshImg.id).not.toBe('img-elem-1')
    // Crucial: fileId must remain unchanged so it still points to the file in `files`
    expect(freshImg.fileId).toBe('file-12345')
  })

  it('correctly scales and centers embedded image elements within page bounds', () => {
    // Huge image exceeding page dimensions
    const largeImage: BoundedElement = {
      ...sampleImageElement,
      width: 1500,
      height: 1200
    }

    const pageWidth = 794
    const pageHeight = 1123
    const margin = 48

    const scaled = scaleAndCenterElements([largeImage], pageWidth, pageHeight, margin)
    expect(scaled).toHaveLength(1)

    const scaledImg = scaled[0]!
    expect(scaledImg.fileId).toBe('file-12345')
    expect(scaledImg.width).toBeLessThanOrEqual(pageWidth - margin * 2 + 0.01)
    expect(scaledImg.height).toBeLessThanOrEqual(pageHeight - margin * 2 + 0.01)

    // Verify image center is aligned with page center
    const imgCenterX = scaledImg.x + scaledImg.width / 2
    const imgCenterY = scaledImg.y + scaledImg.height / 2
    expect(imgCenterX).toBeCloseTo(pageWidth / 2, 1)
    expect(imgCenterY).toBeCloseTo(pageHeight / 2, 1)
  })

  it('serializes and deserializes pure Excalidraw JSON with embedded image file intact', () => {
    const rawScene = {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: [sampleImageElement],
      appState: { viewBackgroundColor: '#ffffff' },
      files: sampleFiles
    }

    const serialized = JSON.stringify(rawScene)
    const parsed = JSON.parse(serialized)

    expect(parsed.type).toBe('excalidraw')
    expect(parsed.elements[0].fileId).toBe('file-12345')
    expect(parsed.files['file-12345'].dataURL).toBe(dummyPngDataUrl)
  })
})
