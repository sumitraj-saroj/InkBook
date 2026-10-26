import { useState, useRef, useCallback, type ReactNode } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { EditorContext } from './EditorContext'

export function EditorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [excalidrawAPI, setExcalidrawAPIState] = useState<ExcalidrawImperativeAPI | null>(null)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const fitHandlerRef = useRef<(() => void) | null>(null)
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true)
  const [zoom, setZoom] = useState<number>(1)

  const setExcalidrawAPI = (api: ExcalidrawImperativeAPI | null): void => {
    apiRef.current = api
    setExcalidrawAPIState(api)
  }

  const registerFitHandler = useCallback((fn: () => void): (() => void) => {
    fitHandlerRef.current = fn
    return (): void => {
      if (fitHandlerRef.current === fn) {
        fitHandlerRef.current = null
      }
    }
  }, [])

  const fitPage = useCallback((): void => {
    setIsAutoFit(true)
    fitHandlerRef.current?.()
  }, [])

  return (
    <EditorContext.Provider
      value={{
        excalidrawAPI,
        setExcalidrawAPI,
        apiRef,
        fitPage,
        registerFitHandler,
        isAutoFit,
        setIsAutoFit,
        zoom,
        setZoom
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}
