export type PageBackground = 'blank' | 'ruled' | 'grid' | 'dotted'

export interface PageSize {
  width: number
  height: number
  name: string
}

export interface Page {
  id: string
  title: string
  background: PageBackground
  size: PageSize
  elements: readonly unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}

export interface NotebookMetadata {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Notebook {
  version: string
  metadata: NotebookMetadata
  pages: Page[]
}

export interface SaveNotebookResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface OpenFileResult {
  canceled: boolean
  filePath?: string
  content?: string
}

export interface SaveFileResult {
  canceled: boolean
  filePath?: string
  error?: string
}

export interface InkBookAPI {
  openNotebook: (filePath?: string) => Promise<Notebook | null>
  saveNotebook: (notebook: Notebook, filePath?: string) => Promise<SaveNotebookResult>
  exportPage: (
    page: Page,
    format: 'excalidraw' | 'png' | 'svg'
  ) => Promise<{ success: boolean; error?: string }>
  getRecentFiles: () => Promise<string[]>
  openExcalidrawFile: () => Promise<OpenFileResult>
  saveExcalidrawFile: (content: string) => Promise<SaveFileResult>
}
