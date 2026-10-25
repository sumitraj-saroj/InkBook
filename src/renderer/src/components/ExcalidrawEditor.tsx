import { useMemo, useEffect, useRef } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import { useNotebookStore } from '../store/notebookStore'

export function ExcalidrawEditor(): React.JSX.Element {
  const { theme } = useTheme()
  const { excalidrawAPI, setExcalidrawAPI } = useEditor()
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const updatePageScene = useNotebookStore((s) => s.updatePageScene)

  const activePageIdRef = useRef<string>(currentPageId)

  const initialData = useMemo(
    () => ({
      appState: {
        viewBackgroundColor: 'transparent'
      }
    }),
    []
  )

  // Handle page transitions: save previous page scene, then load target page scene
  useEffect(() => {
    const prevPageId = activePageIdRef.current
    if (prevPageId === currentPageId) return

    if (excalidrawAPI && prevPageId) {
      // 1. Save current scene of the previous page
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

        excalidrawAPI.updateScene({
          elements: sceneElements ?? [],
          appState: {
            ...targetPage.scene.appState,
            viewBackgroundColor: 'transparent',
            scrollX: targetPage.scene.appState.scrollX ?? 0,
            scrollY: targetPage.scene.appState.scrollY ?? 0
          } as unknown as Parameters<ExcalidrawImperativeAPI['updateScene']>[0]['appState']
        })
      }
    }

    activePageIdRef.current = currentPageId
  }, [currentPageId, excalidrawAPI, updatePageScene])

  return (
    <div
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Excalidraw
        theme={theme}
        initialData={initialData}
        excalidrawAPI={(api): void => {
          setExcalidrawAPI(api)
        }}
      />
    </div>
  )
}
