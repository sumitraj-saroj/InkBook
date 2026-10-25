import { useMemo, useEffect, useRef, useCallback, useState } from 'react'
import { Excalidraw, CaptureUpdateAction } from '@excalidraw/excalidraw'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  AppState
} from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import { useNotebookStore } from '../store/notebookStore'
import {
  clampElementsToPage,
  getPageDimensions,
  calculatePageFit,
  clampViewport,
  type BoundedElement
} from '@shared/index'
import { PageOverlay } from './PageOverlay'

export function ExcalidrawEditor(): React.JSX.Element {
  const { theme } = useTheme()
  const { excalidrawAPI, setExcalidrawAPI } = useEditor()
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const updatePageScene = useNotebookStore((s) => s.updatePageScene)

  const activePage = currentNotebook.pages.find((p) => p.id === currentPageId)
  const pageDims = activePage ? getPageDimensions(activePage) : { width: 794, height: 1123 }

  const containerRef = useRef<HTMLDivElement>(null)
  const activePageIdRef = useRef<string>(currentPageId)
  const isSwitchingRef = useRef<boolean>(false)
  const isClampingRef = useRef<boolean>(false)
  const lastValidElementsRef = useRef<readonly BoundedElement[]>([])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [viewport, setViewport] = useState<{
    scrollX: number
    scrollY: number
    zoom: number
  }>({
    scrollX: 0,
    scrollY: 0,
    zoom: 1
  })

  const initialData = useMemo(
    () => ({
      appState: {
        viewBackgroundColor: 'transparent'
      }
    }),
    []
  )

  // Fit page to window helper
  const fitPageToViewport = useCallback((api: ExcalidrawImperativeAPI): void => {
    const notebook = useNotebookStore.getState().currentNotebook
    const page = notebook.pages.find((p) => p.id === activePageIdRef.current)
    if (!page) return
    const pageDims = getPageDimensions(page)
    const vpW = containerRef.current?.clientWidth || 1000
    const vpH = containerRef.current?.clientHeight || 800
    const fit = calculatePageFit({
      pageWidth: pageDims.width,
      pageHeight: pageDims.height,
      viewportWidth: vpW,
      viewportHeight: vpH,
      padding: 48
    })
    isClampingRef.current = true
    api.updateScene({
      appState: {
        scrollX: fit.scrollX,
        scrollY: fit.scrollY,
        zoom: {
          value: fit.zoom as unknown as NonNullable<AppState['zoom']>['value']
        }
      } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
      captureUpdate: CaptureUpdateAction.NEVER
    })
    isClampingRef.current = false
  }, [])

  // Debounced scene change handler with page bounds enforcement and viewport restriction
  const handleSceneChange: NonNullable<ExcalidrawProps['onChange']> = useCallback(
    (elements, appState, files): void => {
      if (isSwitchingRef.current || isClampingRef.current) return
      const targetPageId = activePageIdRef.current
      if (!targetPageId) return

      const notebook = useNotebookStore.getState().currentNotebook
      const targetPage = notebook.pages.find((p) => p.id === targetPageId)
      if (!targetPage) return

      const pageDims = getPageDimensions(targetPage)
      const clamped = clampElementsToPage(
        elements as unknown as readonly BoundedElement[],
        pageDims,
        lastValidElementsRef.current
      ) as unknown as typeof elements

      let activeElements = elements
      if (clamped !== elements && excalidrawAPI) {
        isClampingRef.current = true
        excalidrawAPI.updateScene({
          elements: clamped as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['elements'],
          captureUpdate: CaptureUpdateAction.NEVER
        })
        isClampingRef.current = false
        activeElements = clamped
      }

      lastValidElementsRef.current = activeElements as unknown as readonly BoundedElement[]

      // Viewport restriction: restrict panning so page cannot scroll completely off screen
      const vpW = containerRef.current?.clientWidth || 1000
      const vpH = containerRef.current?.clientHeight || 800
      const zoomVal = appState.zoom?.value ?? 1
      const vp = clampViewport({
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: zoomVal,
        pageWidth: pageDims.width,
        pageHeight: pageDims.height,
        viewportWidth: vpW,
        viewportHeight: vpH
      })

      let finalAppState = appState
      if (vp.clamped && excalidrawAPI) {
        isClampingRef.current = true
        excalidrawAPI.updateScene({
          appState: {
            scrollX: vp.scrollX,
            scrollY: vp.scrollY,
            zoom: {
              value: vp.zoom as unknown as NonNullable<AppState['zoom']>['value']
            }
          } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
          captureUpdate: CaptureUpdateAction.NEVER
        })
        isClampingRef.current = false
        finalAppState = {
          ...appState,
          scrollX: vp.scrollX,
          scrollY: vp.scrollY,
          zoom: {
            ...appState.zoom,
            value: vp.zoom as unknown as NonNullable<AppState['zoom']>['value']
          }
        }
      }

      setViewport((prev) => {
        const currentZoom = finalAppState.zoom?.value ?? 1
        if (
          Math.abs(prev.scrollX - finalAppState.scrollX) > 0.05 ||
          Math.abs(prev.scrollY - finalAppState.scrollY) > 0.05 ||
          Math.abs(prev.zoom - currentZoom) > 0.0005
        ) {
          return {
            scrollX: finalAppState.scrollX,
            scrollY: finalAppState.scrollY,
            zoom: currentZoom
          }
        }
        return prev
      })

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        updatePageScene(targetPageId, {
          elements: activeElements,
          appState: finalAppState as unknown as Record<string, unknown>,
          files: files as unknown as Record<string, unknown>
        })
        debounceTimerRef.current = null
      }, 300)
    },
    [excalidrawAPI, updatePageScene]
  )

  // Clear debounce timer on unmount
  useEffect(() => {
    return (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Handle page transitions: save previous page scene, then load target page scene
  useEffect(() => {
    const prevPageId = activePageIdRef.current
    if (prevPageId === currentPageId) return

    if (excalidrawAPI && prevPageId) {
      isSwitchingRef.current = true

      // Cancel any pending debounced save for the old page
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // 1. Immediately save current scene of the previous page
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()
      const files = excalidrawAPI.getFiles()

      updatePageScene(prevPageId, { elements, appState, files })

      // 2. Load the target page scene
      const notebook = useNotebookStore.getState().currentNotebook
      const targetPage = notebook.pages.find((p) => p.id === currentPageId)

      if (targetPage) {
        if (targetPage.scene.files && Object.keys(targetPage.scene.files).length > 0) {
          const filesArray = Object.values(targetPage.scene.files) as Parameters<
            ExcalidrawImperativeAPI['addFiles']
          >[0]
          excalidrawAPI.addFiles(filesArray)
        }

        const sceneElements = targetPage.scene.elements as Parameters<
          ExcalidrawImperativeAPI['updateScene']
        >[0]['elements']

        const pageDims = getPageDimensions(targetPage)
        const vpW = containerRef.current?.clientWidth || 1000
        const vpH = containerRef.current?.clientHeight || 800
        const fit = calculatePageFit({
          pageWidth: pageDims.width,
          pageHeight: pageDims.height,
          viewportWidth: vpW,
          viewportHeight: vpH,
          padding: 48
        })

        const scrollX = targetPage.scene.appState.scrollX ?? fit.scrollX
        const scrollY = targetPage.scene.appState.scrollY ?? fit.scrollY
        const zoom =
          targetPage.scene.appState.zoom?.value != null
            ? targetPage.scene.appState.zoom
            : { value: fit.zoom }

        excalidrawAPI.updateScene({
          elements: sceneElements ?? [],
          appState: {
            ...targetPage.scene.appState,
            viewBackgroundColor: 'transparent',
            scrollX,
            scrollY,
            zoom: {
              value: (zoom?.value ?? fit.zoom) as unknown as NonNullable<AppState['zoom']>['value']
            }
          } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
          captureUpdate: CaptureUpdateAction.NEVER
        })

        // Isolate undo/redo history so edits on previous pages cannot be undone on the new page
        excalidrawAPI.history.clear()
        lastValidElementsRef.current = (sceneElements as readonly BoundedElement[]) ?? []
        setViewport({
          scrollX,
          scrollY,
          zoom: zoom?.value ?? fit.zoom
        })
      }

      isSwitchingRef.current = false
    }

    activePageIdRef.current = currentPageId
  }, [currentPageId, excalidrawAPI, updatePageScene])

  return (
    <div
      ref={containerRef}
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <PageOverlay
        pageDimensions={pageDims}
        scrollX={viewport.scrollX}
        scrollY={viewport.scrollY}
        zoom={viewport.zoom}
      />
      <Excalidraw
        theme={theme}
        initialData={initialData}
        onChange={handleSceneChange}
        excalidrawAPI={(api): void => {
          setExcalidrawAPI(api)
          api.history.clear()
          // Automatically fit page on initial load
          setTimeout(() => {
            fitPageToViewport(api)
          }, 50)
        }}
      />
    </div>
  )
}
