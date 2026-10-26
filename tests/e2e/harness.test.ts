import { describe, it, expect } from 'vitest'
import { launchInkBook } from './harness'

describe('Playwright Electron E2E Harness', () => {
  it('launches the built app and exposes Excalidraw appState via window.__inkbook', async () => {
    const instance = await launchInkBook({
      viewport: { width: 1280, height: 800 }
    })

    try {
      const state = await instance.getAppState()
      expect(state).toBeDefined()
      expect(typeof state.scrollX).toBe('number')
      expect(typeof state.scrollY).toBe('number')
      expect(typeof state.zoom).toBe('number')
      expect(state.zoom).toBeGreaterThan(0)
      expect(state.pageSize.width).toBe(794)
      expect(state.pageSize.height).toBe(1123)
      expect(state.canvasSize.width).toBeGreaterThan(0)
      expect(state.canvasSize.height).toBeGreaterThan(0)
    } finally {
      await instance.close()
    }
  }, 25000)
})
