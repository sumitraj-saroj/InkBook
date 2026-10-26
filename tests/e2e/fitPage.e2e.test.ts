import { describe, it, expect } from 'vitest'
import { launchInkBook } from './harness'

describe('Fit Page Viewport', () => {
  async function testFitPageAtResolution(width: number, height: number): Promise<void> {
    const instance = await launchInkBook({
      viewport: { width, height }
    })
    const { page } = instance

    try {
      await page.waitForTimeout(600)
      // Trigger Fit page via UI button
      await page.click('button:has-text("Fit page")')
      await page.waitForTimeout(400)

      const metrics = await page.evaluate(() => {
        const editor = document.querySelector('.editor-container')?.getBoundingClientRect()
        const excalToolbar =
          document.querySelector('.App-toolbar')?.getBoundingClientRect() ||
          document.querySelector('.Stack_horizontal')?.getBoundingClientRect()
        const footer = document.querySelector('.page-footer')?.getBoundingClientRect()

        const hook = (
          window as unknown as {
            __inkbook?: {
              getAppState: () => {
                scrollX: number
                scrollY: number
                zoom: number
                canvasSize: { width: number; height: number }
                pageSize: { width: number; height: number }
              } | null
            }
          }
        ).__inkbook

        const state = hook?.getAppState()

        return {
          editorLeft: editor?.left ?? 0,
          editorRight: editor?.right ?? 1000,
          editorTop: editor?.top ?? 0,
          editorBottom: editor?.bottom ?? 800,
          toolbarBottom: excalToolbar?.bottom ?? 0,
          footerTop: footer?.top ?? 800,
          zoom: state?.zoom ?? 1,
          scrollX: state?.scrollX ?? 0,
          scrollY: state?.scrollY ?? 0,
          pageWidth: state?.pageSize.width ?? 794,
          pageHeight: state?.pageSize.height ?? 1123
        }
      })

      // In Excalidraw, page screen coordinates:
      // screenX = editorLeft + (x + scrollX) * zoom
      // screenY = editorTop + (y + scrollY) * zoom
      const pageScreenLeft = metrics.editorLeft + metrics.scrollX * metrics.zoom
      const pageScreenRight = pageScreenLeft + metrics.pageWidth * metrics.zoom
      const pageScreenTop = metrics.editorTop + metrics.scrollY * metrics.zoom
      const pageScreenBottom = pageScreenTop + metrics.pageHeight * metrics.zoom

      console.log(`Metrics at ${width}x${height}:`, {
        pageScreenTop,
        toolbarBottom: metrics.toolbarBottom,
        pageScreenBottom,
        footerTop: metrics.footerTop,
        pageScreenLeft,
        pageScreenRight,
        editorLeft: metrics.editorLeft,
        editorRight: metrics.editorRight
      })

      // 1. Full page rectangle must lie inside the usable area
      expect(pageScreenTop).toBeGreaterThanOrEqual(metrics.toolbarBottom)
      expect(pageScreenBottom).toBeLessThanOrEqual(metrics.footerTop)
      expect(pageScreenLeft).toBeGreaterThanOrEqual(metrics.editorLeft)
      expect(pageScreenRight).toBeLessThanOrEqual(metrics.editorRight)

      // 2. Centered within 2 px horizontally and vertically within usable area
      const horizontalLeftSpace = pageScreenLeft - metrics.editorLeft
      const horizontalRightSpace = metrics.editorRight - pageScreenRight
      expect(Math.abs(horizontalLeftSpace - horizontalRightSpace)).toBeLessThanOrEqual(2)

      const verticalTopSpace = pageScreenTop - metrics.toolbarBottom
      const verticalBottomSpace = metrics.footerTop - pageScreenBottom
      expect(Math.abs(verticalTopSpace - verticalBottomSpace)).toBeLessThanOrEqual(2)
    } finally {
      await instance.close()
    }
  }

  it('fits and centers page within usable area at 1280x800', async () => {
    await testFitPageAtResolution(1280, 800)
  }, 30000)

  it('fits and centers page within usable area at 1920x1080', async () => {
    await testFitPageAtResolution(1920, 1080)
  }, 30000)
})
