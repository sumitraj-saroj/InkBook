import { useEffect, useRef } from 'react'
import type { InkBookAPI } from '@shared/types'
import { useNotebookStore } from '../store/notebookStore'

export const AUTOSAVE_DELAY_MS = 2000

export class AutosaveController {
  private timer: ReturnType<typeof setTimeout> | null = null
  private isSaving = false
  public readonly delayMs: number

  constructor(delayMs = AUTOSAVE_DELAY_MS) {
    this.delayMs = delayMs
  }

  schedule(shouldSave: () => boolean, performSave: () => Promise<boolean>): void {
    this.cancel()
    if (!shouldSave()) return

    this.timer = setTimeout(async () => {
      if (this.isSaving || !shouldSave()) return
      this.isSaving = true
      try {
        await performSave()
      } finally {
        this.isSaving = false
      }
    }, this.delayMs)
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

/**
 * Hook that automatically saves the current notebook 2 seconds after the last change,
 * provided the notebook has a file path and is dirty.
 */
export function useAutosave(): void {
  const currentNotebook = useNotebookStore((s) => s.currentNotebook)
  const filePath = useNotebookStore((s) => s.filePath)
  const isDirty = useNotebookStore((s) => s.isDirty)
  const controllerRef = useRef<AutosaveController | null>(null)

  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new AutosaveController(AUTOSAVE_DELAY_MS)
    }
    const controller = controllerRef.current

    controller.schedule(
      () => {
        const state = useNotebookStore.getState()
        return Boolean(state.filePath && state.isDirty)
      },
      async () => {
        const state = useNotebookStore.getState()
        if (!state.filePath || !state.isDirty) return false

        try {
          const api = (window as unknown as { api?: InkBookAPI }).api
          if (!api) return false
          const res = await api.saveNotebook(state.currentNotebook, state.filePath)
          if (res.success) {
            state.markClean()
            return true
          }
        } catch (err) {
          console.error('Debounced autosave failed:', err)
        }
        return false
      }
    )

    return (): void => {
      controller.cancel()
    }
  }, [currentNotebook, filePath, isDirty])
}
