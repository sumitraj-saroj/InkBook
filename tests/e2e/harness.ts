import { _electron as electron, type ElectronApplication, type Page } from 'playwright'
import path from 'path'
import fs from 'fs'
import os from 'os'

export interface InkBookAppStateDebug {
  scrollX: number
  scrollY: number
  zoom: number
  canvasSize: { width: number; height: number }
  pageSize: { width: number; height: number }
}

export interface AppInstance {
  app: ElectronApplication
  page: Page
  getAppState: () => Promise<InkBookAppStateDebug>
  close: () => Promise<void>
}

export interface LaunchOptions {
  viewport?: { width: number; height: number }
  timeoutMs?: number
}

export async function launchInkBook(options?: LaunchOptions): Promise<AppInstance> {
  const rootDir = path.resolve(__dirname, '../..')
  const outMain = path.join(rootDir, 'out/main/index.js')

  if (!fs.existsSync(outMain)) {
    throw new Error(`Built application not found at ${outMain}. Run build first.`)
  }

  // Create unique temporary user data directory to isolate tests from running instances
  const testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inkbook-e2e-'))

  const app = await electron.launch({
    args: ['.', `--user-data-dir=${testUserDataDir}`],
    cwd: rootDir,
    timeout: options?.timeoutMs ?? 15000,
    env: {
      ...process.env,
      INKBOOK_E2E: 'true'
    }
  })

  const page = await app.firstWindow()

  if (options?.viewport) {
    await page.setViewportSize(options.viewport)
  }

  // Wait for the editor container and Excalidraw canvas to be mounted
  await page.waitForSelector('.editor-container', { timeout: 15000 })
  await page.waitForSelector('.excalidraw', { timeout: 15000 })

  // Wait for the __inkbook hook to be available and return valid state
  await page.waitForFunction(
    () => {
      const hook = (
        window as unknown as {
          __inkbook?: { getAppState: () => InkBookAppStateDebug | null }
        }
      ).__inkbook
      if (!hook) return false
      const state = hook.getAppState()
      return state !== null && state.canvasSize.width > 0 && state.canvasSize.height > 0
    },
    null,
    { timeout: 15000 }
  )

  const getAppState = async (): Promise<InkBookAppStateDebug> => {
    return await page.evaluate(() => {
      const hook = (
        window as unknown as {
          __inkbook?: { getAppState: () => InkBookAppStateDebug | null }
        }
      ).__inkbook
      if (!hook) throw new Error('window.__inkbook is not defined')
      const state = hook.getAppState()
      if (!state) throw new Error('window.__inkbook.getAppState() returned null')
      return state
    })
  }

  const close = async (): Promise<void> => {
    try {
      await app.close()
    } catch {
      // Ignore if already closed
    } finally {
      try {
        fs.rmSync(testUserDataDir, { recursive: true, force: true })
      } catch {
        // Ignore temp cleanup errors
      }
    }
  }

  return {
    app,
    page,
    getAppState,
    close
  }
}
