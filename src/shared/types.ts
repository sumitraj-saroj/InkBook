export type PagePreset = 'A4' | 'A5' | 'custom'
export type PageOrientation = 'portrait' | 'landscape'
export type PageBackground = 'ruled' | 'grid' | 'dots' | 'blank'

export interface PageDimensions {
  width: number
  height: number
}

export interface PageSize {
  preset: PagePreset
  width: number
  height: number
}

export interface SafeAppState {
  viewBackgroundColor?: string
  currentItemStrokeColor?: string
  currentItemBackgroundColor?: string
  currentItemFillStyle?: string
  currentItemStrokeWidth?: number
  currentItemStrokeStyle?: string
  currentItemRoughness?: number
  currentItemOpacity?: number
  currentItemFontFamily?: number
  currentItemFontSize?: number
  currentItemTextAlign?: string
  currentItemStartArrowhead?: string | null
  currentItemEndArrowhead?: string | null
  scrollX?: number
  scrollY?: number
  zoom?: { value: number }
  gridSize?: number | null
  [key: string]: unknown
}

export interface PageScene {
  elements: readonly unknown[]
  appState: SafeAppState
  files: Record<string, unknown>
}

export interface Page {
  id: string
  title: string
  size: PageSize
  orientation: PageOrientation
  background: PageBackground
  scene: PageScene
}

export interface Notebook {
  format: 'inkbook'
  version: number
  id: string
  name: string
  createdAt: string
  updatedAt: string
  pages: Page[]
}

export interface OpenNotebookResult {
  canceled?: boolean
  success: boolean
  notebook?: Notebook
  filePath?: string
  error?: string
}

export interface SaveNotebookResult {
  canceled?: boolean
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
  openNotebook: (filePath?: string) => Promise<OpenNotebookResult>
  saveNotebook: (notebook: Notebook, filePath?: string) => Promise<SaveNotebookResult>
  saveNotebookAs: (notebook: Notebook) => Promise<SaveNotebookResult>
  onMenuAction: (callback: (action: string) => void) => () => void
  exportPage: (
    page: Page,
    format: 'excalidraw' | 'png' | 'svg'
  ) => Promise<{ success: boolean; error?: string }>
  getRecentFiles: () => Promise<string[]>
  openExcalidrawFile: () => Promise<OpenFileResult>
  saveExcalidrawFile: (content: string) => Promise<SaveFileResult>
}
