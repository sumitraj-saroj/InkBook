import { contextBridge, ipcRenderer } from 'electron'
import type { InkBookAPI, Notebook, Page, SaveNotebookResult } from '@shared/types'

const api: InkBookAPI = {
  openNotebook: async (filePath?: string): Promise<Notebook | null> => {
    return ipcRenderer.invoke('notebook:open', filePath)
  },
  saveNotebook: async (notebook: Notebook, filePath?: string): Promise<SaveNotebookResult> => {
    return ipcRenderer.invoke('notebook:save', notebook, filePath)
  },
  exportPage: async (
    page: Page,
    format: 'excalidraw' | 'png' | 'svg'
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('page:export', page, format)
  },
  getRecentFiles: async (): Promise<string[]> => {
    return ipcRenderer.invoke('notebook:recent')
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
