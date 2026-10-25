import { useState, useRef, type ReactNode } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { EditorContext } from './EditorContext'

export function EditorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPIState] = useState<ExcalidrawImperativeAPI | null>(null)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)

  const setExcalidrawAPI = (api: ExcalidrawImperativeAPI | null): void => {
    apiRef.current = api
    setExcalidrawAPIState(api)
  }

  return (
    <EditorContext.Provider value={{ excalidrawAPI, setExcalidrawAPI, apiRef }}>
      {children}
    </EditorContext.Provider>
  )
}
