import { useState, useEffect, useRef } from 'react'
import { getPageDimensions, type Page } from '@shared/index'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'
import { useNotebookStore } from '../store/notebookStore'
import { renderPageToCanvas } from '../utils/exportUtils'

// In-memory cache keyed by page visual properties
const thumbnailCache = new Map<string, string>()

export interface PageThumbnailProps {
  page: Page
  className?: string
  style?: React.CSSProperties
}

export function PageThumbnail({ page, className, style }: PageThumbnailProps): React.JSX.Element {
  const { theme } = useTheme()
  const { excalidrawAPI } = useEditor()
  const currentPageId = useNotebookStore((s) => s.currentPageId)
  const isCurrent = page.id === currentPageId

  const dims = getPageDimensions(page)
  const elementsCount = page.scene.elements.length
  const lastElement = page.scene.elements[elementsCount - 1] as Record<string, unknown> | undefined
  const lastVersion = lastElement?.version ?? 0

  const cacheKey = `${page.id}:${page.background}:${page.orientation}:${page.size.preset}:${elementsCount}:${lastVersion}:${theme}`

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    () => thumbnailCache.get(cacheKey) ?? null
  )
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (thumbnailCache.has(cacheKey)) {
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(
      async () => {
        try {
          const liveScene =
            isCurrent && excalidrawAPI
              ? {
                  elements: excalidrawAPI.getSceneElements(),
                  files: excalidrawAPI.getFiles() as Record<string, unknown>,
                  appState: excalidrawAPI.getAppState() as Record<string, unknown>
                }
              : undefined

          const canvas = await renderPageToCanvas(
            page,
            {
              includeBackground: true,
              transparent: false,
              scale: 0.15,
              theme
            },
            liveScene
          )

          const dataUrl = canvas.toDataURL('image/png')
          thumbnailCache.set(cacheKey, dataUrl)
          setThumbnailUrl(dataUrl)
        } catch (err) {
          console.warn('Failed to generate thumbnail for page:', page.title, err)
        }
      },
      isCurrent ? 400 : 50
    )

    return (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [cacheKey, page, isCurrent, excalidrawAPI, theme])

  const displayedUrl = thumbnailCache.get(cacheKey) ?? thumbnailUrl

  return (
    <div
      className={`page-thumbnail-box ${className ?? ''}`}
      style={{
        aspectRatio: `${dims.width} / ${dims.height}`,
        ...style
      }}
    >
      {displayedUrl ? (
        <img
          src={displayedUrl}
          alt={`Thumbnail of ${page.title}`}
          className="page-thumbnail-img"
          loading="lazy"
        />
      ) : (
        <div className="page-thumbnail-placeholder" />
      )}
    </div>
  )
}
