import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { setupApplicationMenu, updateMenuRecentNotebooks } from './menu'
import { handleOpenExcalidraw, handleSaveExcalidraw } from './fileManager'
import {
  saveNotebookFile,
  loadNotebookFile,
  showOpenNotebookDialog,
  showSaveNotebookDialog,
  saveRecoveryCopy,
  loadRecoveryCopy,
  clearRecoveryCopy
} from './notebookService'
import { getRecentNotebooks, addRecentNotebook, clearRecentNotebooks } from './settingsService'
import { findInkBookArgument } from './commandLine'
import type { Notebook } from '../shared/types'

const initialFileArgument = findInkBookArgument(process.argv)

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindowInstance) {
      if (mainWindowInstance.isMinimized()) mainWindowInstance.restore()
      mainWindowInstance.focus()

      const fileToOpen = findInkBookArgument(commandLine)
      if (fileToOpen) {
        mainWindowInstance.webContents.send('menu:action', 'open-recent', fileToOpen)
      }
    }
  })
}

let mainWindowInstance: BrowserWindow | null = null
let isDirtyState = false
let currentNotebookName = 'Untitled Notebook'
let isForceClosing = false

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#121212',
    show: false,
    title: 'Untitled Notebook - InkBook',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindowInstance = mainWindow

  mainWindow.on('close', async (e) => {
    if (isForceClosing) {
      return
    }

    if (isDirtyState) {
      e.preventDefault()
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Unsaved Changes',
        message: `Do you want to save the changes you made to "${currentNotebookName}"?`,
        detail: "Your changes will be lost if you don't save them."
      })

      if (response === 0) {
        mainWindow.webContents.send('window:request-save-and-close')
      } else if (response === 1) {
        isForceClosing = true
        mainWindow.close()
      }
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

    const updatedRecents = await addRecentNotebook(targetPath)
    updateMenuRecentNotebooks(updatedRecents)
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

    const updatedRecents = await addRecentNotebook(targetPath)
    updateMenuRecentNotebooks(updatedRecents)
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

    const updatedRecents = await addRecentNotebook(selected)
    updateMenuRecentNotebooks(updatedRecents)
    return { success: true, filePath: selected }
  })

  // Crash recovery copy IPC handlers
  ipcMain.handle('recovery:save', async (_event, notebook: Notebook) => {
    return saveRecoveryCopy(notebook)
  })

  ipcMain.handle('recovery:load', async () => {
    const res = await loadRecoveryCopy()
    if (!res.success || !res.data) {
      return null
    }
    return res.data
  })

  ipcMain.handle('recovery:clear', async () => {
    await clearRecoveryCopy()
    return true
  })

  // Window title dirty state and close handling
  ipcMain.on('window:set-dirty', (_event, dirty: boolean, name?: string) => {
    isDirtyState = dirty
    if (name) {
      currentNotebookName = name
    }
    if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
      const title = `${dirty ? '• ' : ''}${currentNotebookName} - InkBook`
      mainWindowInstance.setTitle(title)
    }
  })

  ipcMain.on('window:save-and-close-completed', () => {
    isForceClosing = true
    if (mainWindowInstance && !mainWindowInstance.isDestroyed()) {
      mainWindowInstance.close()
    }
  })

  ipcMain.handle('page:export', async (_event, _page, _format) => ({ success: true }))
  ipcMain.handle(
    'page:export-file',
    async (
      event,
      {
        defaultName,
        filters,
        data,
        isBase64
      }: {
        defaultName: string
        filters: Array<{ name: string; extensions: string[] }>
        data: string
        isBase64?: boolean
      }
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const { canceled, filePath } = await dialog.showSaveDialog(win!, {
        title: 'Export File',
        defaultPath: defaultName,
        filters
      })

      if (canceled || !filePath) {
        return { canceled: true, success: false }
      }

      try {
        if (isBase64) {
          const base64Data = data.replace(/^data:[^;]+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          await fs.writeFile(filePath, buffer)
        } else {
          await fs.writeFile(filePath, data, 'utf-8')
        }
        return { success: true, filePath }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )
  ipcMain.handle('notebook:recent', async () => getRecentNotebooks())
  ipcMain.handle('app:initial-file', async () => initialFileArgument)
  ipcMain.handle('notebook:clear-recent', async () => {
    await clearRecentNotebooks()
    updateMenuRecentNotebooks([])
    return true
  })

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
  getRecentNotebooks()
    .then((recents) => updateMenuRecentNotebooks(recents))
    .catch(console.error)
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
