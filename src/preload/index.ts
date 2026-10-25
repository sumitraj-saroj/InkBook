import { contextBridge, ipcRenderer } from 'electron'
import type {
  InkBookAPI,
  Notebook,
  OpenFileResult,
  OpenNotebookResult,
  Page,
  SaveFileResult,
  SaveNotebookResult
} from '@shared/types'

const api: InkBookAPI = {
  openNotebook: async (filePath?: string): Promise<OpenNotebookResult> => {
    return ipcRenderer.invoke('notebook:open', filePath)
  },
  saveNotebook: async (notebook: Notebook, filePath?: string): Promise<SaveNotebookResult> => {
    return ipcRenderer.invoke('notebook:save', notebook, filePath)
  },
  saveNotebookAs: async (notebook: Notebook): Promise<SaveNotebookResult> => {
    return ipcRenderer.invoke('notebook:save-as', notebook)
  },
  onMenuAction: (callback: (action: string, payload?: unknown) => void): (() => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      action: string,
      payload?: unknown
    ): void => {
      callback(action, payload)
    }
    ipcRenderer.on('menu:action', listener)
    return (): void => {
      ipcRenderer.removeListener('menu:action', listener)
    }
  },
  saveRecoveryCopy: async (notebook: Notebook): Promise<SaveNotebookResult> => {
    return ipcRenderer.invoke('recovery:save', notebook)
  },
  checkRecoveryCopy: async (): Promise<Notebook | null> => {
    return ipcRenderer.invoke('recovery:load')
  },
  clearRecoveryCopy: async (): Promise<boolean> => {
    return ipcRenderer.invoke('recovery:clear')
  },
  setDirtyState: (isDirty: boolean, notebookName: string): void => {
    ipcRenderer.send('window:set-dirty', isDirty, notebookName)
  },
  onSaveAndCloseRequest: (callback: () => Promise<void>): (() => void) => {
    const listener = async (): Promise<void> => {
      await callback()
    }
    ipcRenderer.on('window:request-save-and-close', listener)
    return (): void => {
      ipcRenderer.removeListener('window:request-save-and-close', listener)
    }
  },
  notifySaveAndCloseCompleted: (): void => {
    ipcRenderer.send('window:save-and-close-completed')
  },
  exportPage: async (
    page: Page,
    format: 'excalidraw' | 'png' | 'svg'
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('page:export', page, format)
  },
  getRecentFiles: async (): Promise<string[]> => {
    return ipcRenderer.invoke('notebook:recent')
  },
  clearRecentFiles: async (): Promise<boolean> => {
    return ipcRenderer.invoke('notebook:clear-recent')
  },
  openExcalidrawFile: async (): Promise<OpenFileResult> => {
    return ipcRenderer.invoke('excalidraw:open')
  },
  saveExcalidrawFile: async (content: string): Promise<SaveFileResult> => {
    return ipcRenderer.invoke('excalidraw:save', content)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose api via contextBridge:', error)
  }
} else {
  // @ts-ignore fallback for non-isolated context
  window.api = api
}
