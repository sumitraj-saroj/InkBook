import { createContext, useContext, type RefObject } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

export interface EditorContextValue {
  excalidrawAPI: ExcalidrawImperativeAPI | null
  setExcalidrawAPI: (api: ExcalidrawImperativeAPI | null) => void
  apiRef: RefObject<ExcalidrawImperativeAPI | null>
  fitPage: () => void
  registerFitHandler: (fn: () => void) => () => void
  isAutoFit: boolean
  setIsAutoFit: (autoFit: boolean) => void
  zoom: number
  setZoom: (zoom: number) => void
}

export const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}
