import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { setupApplicationMenu } from './menu'
import { handleOpenExcalidraw, handleSaveExcalidraw } from './fileManager'
import {
  saveNotebookFile,
  loadNotebookFile,
  showOpenNotebookDialog,
  showSaveNotebookDialog
} from './notebookService'
import type { Notebook } from '../shared/types'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#121212',
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.inkbook.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for notebook operations
  ipcMain.handle('notebook:open', async (event, filePath?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    let targetPath = filePath
    if (!targetPath) {
      const selected = await showOpenNotebookDialog(win)
      if (!selected) {
        return { canceled: true, success: false }
      }
      targetPath = selected
    }

    const loaded = await loadNotebookFile(targetPath)
    if (!loaded.success || !loaded.data) {
      return { success: false, error: loaded.error, filePath: targetPath }
    }

    return { success: true, notebook: loaded.data, filePath: targetPath }
  })

  ipcMain.handle('notebook:save', async (event, notebook: Notebook, filePath?: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    let targetPath = filePath
    if (!targetPath) {
      const selected = await showSaveNotebookDialog(win, notebook.name)
      if (!selected) {
        return { canceled: true, success: false }
      }
      targetPath = selected
    }

    const saveResult = await saveNotebookFile(notebook, targetPath)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error, filePath: targetPath }
    }

    return { success: true, filePath: targetPath }
  })

  ipcMain.handle('notebook:save-as', async (event, notebook: Notebook) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const selected = await showSaveNotebookDialog(win, notebook.name)
    if (!selected) {
      return { canceled: true, success: false }
    }

    const saveResult = await saveNotebookFile(notebook, selected)
    if (!saveResult.success) {
      return { success: false, error: saveResult.error, filePath: selected }
    }

    return { success: true, filePath: selected }
  })

  ipcMain.handle('page:export', async (_event, _page, _format) => ({ success: true }))
  ipcMain.handle('notebook:recent', async () => [])

  // Excalidraw open/save IPC handlers
  ipcMain.handle('excalidraw:open', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    return handleOpenExcalidraw(win)
  })
  ipcMain.handle('excalidraw:save', async (event, content: string) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    return handleSaveExcalidraw(content, win)
  })

  setupApplicationMenu()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
