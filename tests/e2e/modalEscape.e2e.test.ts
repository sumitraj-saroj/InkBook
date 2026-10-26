import { describe, it, expect } from 'vitest'
import { launchInkBook } from './harness'

describe('Modal Escape Key Dismissal E2E', () => {
  it('dismisses Welcome, Export, Shortcuts, and Search modals on Escape', async () => {
    const instance = await launchInkBook({
      viewport: { width: 1280, height: 800 }
    })
    const { page } = instance

    try {
      await page.waitForTimeout(500)

      // 1. Welcome Screen
      console.log('Testing Welcome modal...')
      await page.click('button:has-text("Welcome")')
      await page.waitForSelector('.welcome-overlay', { state: 'visible' })
      console.log('Welcome overlay visible, pressing Escape...')
      await page.keyboard.press('Escape')
      await page.waitForSelector('.welcome-overlay', { state: 'detached' })
      expect(await page.$('.welcome-overlay')).toBeNull()
      console.log('Welcome overlay closed!')

      // 2. Export Dialog
      console.log('Testing Export modal...')
      await page.click('button:has-text("Export")')
      await page.waitForSelector('.export-dialog-card', { state: 'visible' })
      await page.keyboard.press('Escape')
      await page.waitForSelector('.export-dialog-card', { state: 'detached' })
      expect(await page.$('.export-dialog-card')).toBeNull()
      console.log('Export modal closed!')

      // 3. Shortcuts Help Dialog (F1)
      console.log('Testing Shortcuts modal...')
      await page.keyboard.press('F1')
      await page.waitForSelector('.shortcuts-body', { state: 'visible' })
      await page.keyboard.press('Escape')
      await page.waitForSelector('.shortcuts-body', { state: 'detached' })
      expect(await page.$('.shortcuts-body')).toBeNull()
      console.log('Shortcuts modal closed!')

      // 4. Search Dialog (Ctrl+F)
      console.log('Testing Search modal...')
      await page.keyboard.press('Control+f')
      await page.waitForSelector('.search-dialog-modal', { state: 'visible' })
      await page.keyboard.press('Escape')
      await page.waitForSelector('.search-dialog-modal', { state: 'detached' })
      expect(await page.$('.search-dialog-modal')).toBeNull()
      console.log('Search modal closed!')
    } finally {
      await instance.close()
    }
  }, 30000)
})
