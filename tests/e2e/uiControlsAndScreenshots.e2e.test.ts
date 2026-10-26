import { describe, it, expect } from 'vitest'
import path from 'path'
import { launchInkBook } from './harness'

describe('UI Redesign Controls & Screenshot Capture E2E', () => {
  const screenshotsDir = path.resolve(__dirname, '../../docs/screenshots')

  it('verifies all UI controls exist, are clickable, captures screenshots, and checks responsiveness', async () => {
    const instance = await launchInkBook({
      viewport: { width: 1280, height: 800 }
    })
    const { page } = instance

    try {
      await page.waitForTimeout(600)

      // 1. Verify Top Bar controls
      const titleBtn = await page.$('.notebook-title-btn')
      expect(titleBtn).not.toBeNull()
      const titleFont = await page.evaluate(() => {
        const el = document.querySelector('.notebook-title-btn')
        return el ? window.getComputedStyle(el).fontFamily : ''
      })
      expect(titleFont.toLowerCase()).toContain('caveat')

      // Save status indicator
      const saveStatus = await page.$('.save-status')
      expect(saveStatus).not.toBeNull()
      const saveText = await page.textContent('.save-status-text')
      expect(saveText).toMatch(/Saved|Saving|Unsaved changes/)

      // Search button
      const searchBtn = await page.$('button[aria-label="Search (Ctrl+K)"]')
      expect(searchBtn).not.toBeNull()

      // Export menu button
      const exportBtn = await page.$('button[aria-label="Export (Ctrl+E)"]')
      expect(exportBtn).not.toBeNull()

      // Theme menu button
      const themeBtn = await page.$('button[aria-label="Theme"]')
      expect(themeBtn).not.toBeNull()

      // More options (overflow ⋯) button
      const overflowBtn = await page.$('button[aria-label="More options"]')
      expect(overflowBtn).not.toBeNull()

      // 2. Verify Sidebar controls
      const sidebarHeaderTitle = await page.textContent('.sidebar-title')
      expect(sidebarHeaderTitle?.trim()).toBe('PAGES')

      const viewModeControl = await page.$('.sidebar-header .ui-segmented-control')
      expect(viewModeControl).not.toBeNull()

      const addPageSidebarBtn = await page.$('.btn-add-page-action')
      expect(addPageSidebarBtn).not.toBeNull()

      const sidebarPageCount = await page.textContent('.sidebar-page-count')
      expect(sidebarPageCount).toMatch(/\d+ page/)

      const resizeHandle = await page.$('.sidebar-resize-handle')
      expect(resizeHandle).not.toBeNull()

      // 3. Verify Bottom Bar controls (Canvas pill & Nav pill)
      // Left pill: zoom out, zoom %, zoom in, Fit, undo, redo
      const zoomOutBtn = await page.$('button[aria-label="Zoom out (Ctrl+-)"]')
      expect(zoomOutBtn).not.toBeNull()

      const zoomResetBtn = await page.$('.footer-zoom-btn')
      expect(zoomResetBtn).not.toBeNull()

      const zoomInBtn = await page.$('button[aria-label="Zoom in (Ctrl++)"]')
      expect(zoomInBtn).not.toBeNull()

      const fitBtn = await page.$('.footer-fit-btn')
      expect(fitBtn).not.toBeNull()

      const undoBtn = await page.$('button[aria-label="Undo (Ctrl+Z)"]')
      expect(undoBtn).not.toBeNull()

      const redoBtn = await page.$('button[aria-label="Redo (Ctrl+Y)"]')
      expect(redoBtn).not.toBeNull()

      // Center pill: prev, indicator, next, add page, background, size chip
      const prevPageBtn = await page.$('button[aria-label="Previous page (Ctrl+PageUp)"]')
      expect(prevPageBtn).not.toBeNull()

      const pageIndicator = await page.$('.footer-page-indicator')
      expect(pageIndicator).not.toBeNull()

      const nextPageBtn = await page.$('button[aria-label="Next page (Ctrl+PageDown)"]')
      expect(nextPageBtn).not.toBeNull()

      const addPagePillBtn = await page.$('button[aria-label="Add page (Ctrl+Shift+N)"]')
      expect(addPagePillBtn).not.toBeNull()

      const bgBtn = await page.$('.footer-bg-btn')
      expect(bgBtn).not.toBeNull()

      const sizeChip = await page.$('.footer-size-chip')
      expect(sizeChip).not.toBeNull()

      // 4. CAPTURE SCREENSHOT: Default Dark Workspace
      await page.screenshot({
        path: path.join(screenshotsDir, 'dark-workspace.png')
      })

      // 5. CAPTURE SCREENSHOT: Sidebar Thumbnail Mode
      const thumbnailModeOption = await page.$(
        '.sidebar-header .ui-segmented-option[title="Thumbnail view"]'
      )
      expect(thumbnailModeOption).not.toBeNull()
      await thumbnailModeOption!.click()
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(screenshotsDir, 'sidebar-thumbnail.png')
      })

      // Switch back to List mode
      const listModeOption = await page.$('.sidebar-header .ui-segmented-option[title="List view"]')
      expect(listModeOption).not.toBeNull()
      await listModeOption!.click()
      await page.waitForTimeout(200)
      await page.screenshot({
        path: path.join(screenshotsDir, 'sidebar-list.png')
      })

      // 6. CAPTURE SCREENSHOT: Export Menu Open
      await exportBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.screenshot({
        path: path.join(screenshotsDir, 'menu-export-open.png')
      })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)

      // 7. CAPTURE SCREENSHOT: Theme Menu Open
      await themeBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.screenshot({
        path: path.join(screenshotsDir, 'menu-theme-open.png')
      })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)

      // 8. CAPTURE SCREENSHOT: Overflow "⋯" Menu Open
      await overflowBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.screenshot({
        path: path.join(screenshotsDir, 'menu-overflow-open.png')
      })

      // 9. CAPTURE SCREENSHOT: Welcome Screen Modal
      await page.click('button:has-text("Welcome screen")')
      await page.waitForSelector('.welcome-overlay', { state: 'visible' })
      await page.waitForTimeout(200)
      await page.screenshot({
        path: path.join(screenshotsDir, 'welcome-screen.png')
      })
      await page.keyboard.press('Escape')
      await page.waitForSelector('.welcome-overlay', { state: 'detached' })
      await page.waitForTimeout(150)

      // 10. CAPTURE SCREENSHOT: Background Pattern Dropdown Open
      await bgBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.screenshot({
        path: path.join(screenshotsDir, 'menu-background-open.png')
      })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)

      // 11. CAPTURE SCREENSHOT: Light Workspace
      await themeBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.click('button:has-text("Light theme")')
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(screenshotsDir, 'light-workspace.png')
      })

      // Switch back to Dark theme
      await themeBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.click('button:has-text("Dark theme")')
      await page.waitForTimeout(200)

      // 12. Check Responsiveness: 1024x700
      await page.setViewportSize({ width: 1024, height: 700 })
      await page.waitForTimeout(300)
      const hasHorizontalScroll1024 = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll1024).toBe(false)
      await page.screenshot({
        path: path.join(screenshotsDir, 'viewport-1024x700.png')
      })

      // 13. Check Responsiveness: 1920x1080
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(300)
      const hasHorizontalScroll1920 = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll1920).toBe(false)
      await page.screenshot({
        path: path.join(screenshotsDir, 'viewport-1920x1080.png')
      })

      // 14. Keyboard Navigation: Esc closes menus, arrow keys navigate
      await exportBtn!.click()
      await page.waitForSelector('.ui-menu-dropdown', { state: 'visible' })
      await page.keyboard.press('ArrowDown')
      const activeMenuItemText = await page.evaluate(() => {
        return document.querySelector('.ui-menu-item.is-focused')?.textContent
      })
      expect(activeMenuItemText).toBeTruthy()
      await page.keyboard.press('Escape')
      expect(await page.$('.ui-menu-dropdown')).toBeNull()
    } finally {
      await instance.close()
    }
  }, 45000)
})
