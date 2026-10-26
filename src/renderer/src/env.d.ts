/// <reference types="vite/client" />

declare global {
  const __INKBOOK_DEV_HOOK__: boolean

  interface InkBookAppStateDebug {
    scrollX: number
    scrollY: number
    zoom: number
    canvasSize: { width: number; height: number }
    pageSize: { width: number; height: number }
  }

  interface InkBookDebugHook {
    getAppState: () => InkBookAppStateDebug | null
  }

  interface Window {
    __inkbook?: InkBookDebugHook
  }
}

export {}
