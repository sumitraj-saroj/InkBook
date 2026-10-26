import { useMemo, useEffect, useRef, useCallback, useState } from 'react'
import { Excalidraw, CaptureUpdateAction, MainMenu } from '@excalidraw/excalidraw'
import { PenTool, X } from 'lucide-react'
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  AppState,
  UIOptions
} from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import { useNotebookStore } from '../store/notebookStore'
import {
  clampElementsToPage,
  getPageDimensions,
  computeFitViewport,
  clampViewport,
  CANVAS_SAFE_INSETS,
  type BoundedElement,
  type Insets
} from '@shared/index'
import { PageOverlay } from './PageOverlay'
import { PageBackground } from './PageBackground'

export function ExcalidrawEditor(): React.JSX.Element {
  const { theme, paperColorInDarkMode } = useTheme()
  const { excalidrawAPI, setExcalidrawAPI, registerFitHandler, isAutoFit, setIsAutoFit, setZoom } =
    useEditor()
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const updatePageScene = useNotebookStore((s) => s.updatePageScene)

  const activePage = currentNotebook.pages.find((p) => p.id === currentPageId)
  const pageDims = activePage ? getPageDimensions(activePage) : { width: 794, height: 1123 }

  const containerRef = useRef<HTMLDivElement>(null)
  const activePageIdRef = useRef<string>(currentPageId)
  const currentNotebookIdRef = useRef<string>(currentNotebook.id)
  const isSwitchingRef = useRef<boolean>(false)
  const isClampingRef = useRef<boolean>(false)
  const isProgrammaticChangeRef = useRef<boolean>(false)
  const isAutoFitRef = useRef<boolean>(isAutoFit)

  useEffect(() => {
    isAutoFitRef.current = isAutoFit
  }, [isAutoFit])

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

  const [showEmptyHint, setShowEmptyHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem('inkbook-empty-hint-dismissed') !== 'true'
    } catch {
      return true
    }
  })

  const isPageEmpty = !activePage?.scene.elements || activePage.scene.elements.length === 0
  const shouldShowEmptyHint = showEmptyHint && isPageEmpty

  const dismissEmptyHint = useCallback((): void => {
    setShowEmptyHint(false)
    try {
      localStorage.setItem('inkbook-empty-hint-dismissed', 'true')
    } catch {
      // ignore
    }
  }, [])

  const initialData = useMemo(
    () => ({
      appState: {
        viewBackgroundColor: 'transparent'
      }
    }),
    []
  )

  const uiOptions: Partial<UIOptions> = useMemo(
    () => ({
      canvasActions: {
        changeViewBackgroundColor: false,
        clearCanvas: false,
        export: false,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: false,
        saveAsImage: false
      }
    }),
    []
  )

  // Single source of truth for fitting page to usable viewport
  const fitViewport = useCallback((): void => {
    if (!excalidrawAPI || !containerRef.current) return
    const notebook = useNotebookStore.getState().currentNotebook
    const targetPage = notebook.pages.find((p) => p.id === activePageIdRef.current)
    if (!targetPage) return
    const dims = getPageDimensions(targetPage)

    const containerRect = containerRef.current.getBoundingClientRect()
    const toolbarEl = containerRef.current.querySelector(
      '.App-toolbar, .Stack_horizontal, [aria-label="Tool bar"]'
    )
    const footerEl = document.querySelector('.page-footer')

    let topInset: number = CANVAS_SAFE_INSETS.top
    if (toolbarEl) {
      const tbRect = toolbarEl.getBoundingClientRect()
      topInset = tbRect.bottom - containerRect.top
    }

    let bottomInset: number = CANVAS_SAFE_INSETS.bottom
    if (footerEl) {
      const fRect = footerEl.getBoundingClientRect()
      bottomInset = containerRect.bottom - fRect.top
    }

    const insets: Insets = {
      top: topInset,
      bottom: bottomInset,
      left: CANVAS_SAFE_INSETS.left,
      right: CANVAS_SAFE_INSETS.right
    }

    const canvasWidth = containerRef.current.clientWidth || 1000
    const canvasHeight = containerRef.current.clientHeight || 800

    const fit = computeFitViewport(dims, { width: canvasWidth, height: canvasHeight }, insets, 20)

    isClampingRef.current = true
    isProgrammaticChangeRef.current = true
    excalidrawAPI.updateScene({
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
    setTimeout(() => {
      isProgrammaticChangeRef.current = false
    }, 100)

    setViewport({
      scrollX: fit.scrollX,
      scrollY: fit.scrollY,
      zoom: fit.zoom
    })
    setZoom(fit.zoom)
  }, [excalidrawAPI, setZoom])

  // Register fit handler with EditorContext so topbar, footer, shortcuts, and commands use it
  useEffect(() => {
    return registerFitHandler(fitViewport)
  }, [registerFitHandler, fitViewport])

  // Synchronize stroke color contrast when paper color in dark mode changes
  useEffect(() => {
    if (!excalidrawAPI) return
    const appState = excalidrawAPI.getAppState()
    const isLightPaper = theme === 'light' || paperColorInDarkMode === 'light'
    const targetStroke = isLightPaper ? '#1e1e24' : '#ffffff'

    const currentStroke = appState.currentItemStrokeColor
    if (isLightPaper && (currentStroke === '#ffffff' || currentStroke === '#f4f4f5')) {
      excalidrawAPI.updateScene({
        appState: {
          currentItemStrokeColor: targetStroke
        } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
        captureUpdate: CaptureUpdateAction.NEVER
      })
    } else if (
      !isLightPaper &&
      (currentStroke === '#1e1e24' || currentStroke === '#000000' || currentStroke === '#1e1e1e')
    ) {
      excalidrawAPI.updateScene({
        appState: {
          currentItemStrokeColor: targetStroke
        } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
        captureUpdate: CaptureUpdateAction.NEVER
      })
    }
  }, [theme, paperColorInDarkMode, excalidrawAPI])

  // ResizeObserver: auto-fit when window or container resizes if in auto-fit mode
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      if (isAutoFitRef.current) {
        fitViewport()
      }
    })
    ro.observe(containerRef.current)
    return (): void => {
      ro.disconnect()
    }
  }, [fitViewport])

  // Debounced scene change handler with page bounds enforcement and viewport restriction
  const handleSceneChange: NonNullable<ExcalidrawProps['onChange']> = useCallback(
    (elements, appState, files): void => {
      if (isSwitchingRef.current || isClampingRef.current) return
      const targetPageId = activePageIdRef.current
      if (!targetPageId) return

      // Turn off auto-fit mode if user manually panned or zoomed
      if (!isProgrammaticChangeRef.current) {
        const currentZoom = appState.zoom?.value ?? 1
        const zoomDelta = Math.abs(currentZoom - viewport.zoom)
        const scrollXDelta = Math.abs(appState.scrollX - viewport.scrollX)
        const scrollYDelta = Math.abs(appState.scrollY - viewport.scrollY)
        if (zoomDelta > 0.001 || scrollXDelta > 1 || scrollYDelta > 1) {
          if (isAutoFitRef.current) {
            isAutoFitRef.current = false
            setIsAutoFit(false)
          }
        }
      }

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
          prev.scrollX !== finalAppState.scrollX ||
          prev.scrollY !== finalAppState.scrollY ||
          prev.zoom !== currentZoom
        ) {
          setZoom(currentZoom)
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
    [excalidrawAPI, updatePageScene, viewport, setIsAutoFit, setZoom]
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
    const isDifferentNotebook = currentNotebookIdRef.current !== currentNotebook.id
    currentNotebookIdRef.current = currentNotebook.id
    const prevPageId = activePageIdRef.current
    if (prevPageId === currentPageId && !isDifferentNotebook) return

    if (excalidrawAPI) {
      isSwitchingRef.current = true

      // Cancel any pending debounced save for the old page
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // 1. Immediately save current scene of the previous page if within same notebook
      if (!isDifferentNotebook && prevPageId) {
        const elements = excalidrawAPI.getSceneElements()
        const appState = excalidrawAPI.getAppState()
        const files = excalidrawAPI.getFiles()

        updatePageScene(prevPageId, { elements, appState, files })
      }

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

        const targetDims = getPageDimensions(targetPage)
        const vpW = containerRef.current?.clientWidth || 1000
        const vpH = containerRef.current?.clientHeight || 800

        // If in auto-fit mode or page has no saved scroll, compute fit viewport
        const fit = computeFitViewport(
          targetDims,
          { width: vpW, height: vpH },
          CANVAS_SAFE_INSETS,
          20
        )

        const scrollX =
          isAutoFitRef.current || targetPage.scene.appState.scrollX == null
            ? fit.scrollX
            : targetPage.scene.appState.scrollX
        const scrollY =
          isAutoFitRef.current || targetPage.scene.appState.scrollY == null
            ? fit.scrollY
            : targetPage.scene.appState.scrollY
        const zoomVal =
          isAutoFitRef.current || targetPage.scene.appState.zoom?.value == null
            ? fit.zoom
            : targetPage.scene.appState.zoom.value

        isProgrammaticChangeRef.current = true
        excalidrawAPI.updateScene({
          elements: sceneElements ?? [],
          appState: {
            ...targetPage.scene.appState,
            viewBackgroundColor: 'transparent',
            scrollX,
            scrollY,
            zoom: {
              value: zoomVal as unknown as NonNullable<AppState['zoom']>['value']
            }
          } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState'],
          captureUpdate: CaptureUpdateAction.NEVER
        })
        setTimeout(() => {
          isProgrammaticChangeRef.current = false
        }, 100)

        // Isolate undo/redo history so edits on previous pages cannot be undone on the new page
        excalidrawAPI.history.clear()
        lastValidElementsRef.current = (sceneElements as readonly BoundedElement[]) ?? []
        setViewport({
          scrollX,
          scrollY,
          zoom: zoomVal
        })
        setZoom(zoomVal)
      }

      isSwitchingRef.current = false
    }

    activePageIdRef.current = currentPageId
  }, [currentNotebook.id, currentPageId, excalidrawAPI, updatePageScene, setZoom])

  // Dev-only debug hook for Playwright / E2E test harness (stripped in production builds)
  useEffect(() => {
    if (
      import.meta.env.DEV ||
      (typeof __INKBOOK_DEV_HOOK__ !== 'undefined' && __INKBOOK_DEV_HOOK__)
    ) {
      window.__inkbook = {
        getAppState: () => {
          if (!excalidrawAPI) return null
          const appState = excalidrawAPI.getAppState()
          const container = containerRef.current
          return {
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            zoom: appState.zoom?.value ?? 1,
            canvasSize: {
              width: container?.clientWidth ?? 0,
              height: container?.clientHeight ?? 0
            },
            pageSize: {
              width: pageDims.width,
              height: pageDims.height
            }
          }
        }
      }
      return (): void => {
        delete window.__inkbook
      }
    }
    return undefined
  }, [excalidrawAPI, pageDims.width, pageDims.height])

  return (
    <div
      ref={containerRef}
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <PageBackground
        pageDimensions={pageDims}
        background={activePage?.background ?? 'blank'}
        showMarginLine={activePage?.showMarginLine ?? true}
        scrollX={viewport.scrollX}
        scrollY={viewport.scrollY}
        zoom={viewport.zoom}
      />
      <PageOverlay
        pageDimensions={pageDims}
        scrollX={viewport.scrollX}
        scrollY={viewport.scrollY}
        zoom={viewport.zoom}
      />
      <Excalidraw
        theme={theme}
        initialData={initialData}
        UIOptions={uiOptions}
        onChange={handleSceneChange}
        excalidrawAPI={(api): void => {
          setExcalidrawAPI(api)
          api.history.clear()
          // Automatically fit page on initial load
          setTimeout(() => {
            fitViewport()
          }, 60)
        }}
      >
        <MainMenu>{null}</MainMenu>
      </Excalidraw>
      {shouldShowEmptyHint && (
        <div
          className="empty-page-hint"
          onClick={dismissEmptyHint}
          role="status"
          aria-label="Empty page hint"
        >
          <PenTool size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>
            Start drawing, or press <kbd>Ctrl+K</kbd> for commands
          </span>
          <button
            type="button"
            className="empty-page-hint-close"
            onClick={(e): void => {
              e.stopPropagation()
              dismissEmptyHint()
            }}
            aria-label="Dismiss hint"
          >
            <X size={12} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
