import { useEffect } from 'react'
import type { InkBookAPI } from '@shared/types'
import { useNotebookStore } from '../store/notebookStore'

export const RECOVERY_INTERVAL_MS = 30000

/**
 * Manages crash recovery:
 * 1. On startup, prompts user if an unrecovered notebook exists from a previous crash/session.
 * 2. Every 30 seconds, if notebook is unsaved (!filePath) and dirty, saves a recovery copy.
 * 3. Clears recovery copy once the notebook is saved to a permanent file.
 */
export function useRecovery(): void {
  const filePath = useNotebookStore((s) => s.filePath)

  // 1. Startup recovery check
  useEffect(() => {
    let isMounted = true
    async function checkRecovery(): Promise<void> {
      try {
        const api = (window as unknown as { api?: InkBookAPI }).api
        if (!api) return

        const recovered = await api.checkRecoveryCopy()
        if (recovered && isMounted) {
          const shouldRestore = window.confirm(
            'InkBook found an unsaved notebook from a previous session. Would you like to restore it?'
          )
          if (shouldRestore) {
            useNotebookStore.getState().setCurrentNotebook(recovered, null)
            useNotebookStore.setState({ isDirty: true })
          } else {
            await api.clearRecoveryCopy()
          }
        }
      } catch (err) {
        console.error('Failed to check recovery copy:', err)
      }
    }

    checkRecovery()
    return (): void => {
      isMounted = false
    }
  }, [])

  // 2. Periodic recovery copy for unsaved dirty notebook (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      const state = useNotebookStore.getState()
      if (!state.filePath && state.isDirty) {
        try {
          const api = (window as unknown as { api?: InkBookAPI }).api
          await api?.saveRecoveryCopy(state.currentNotebook)
        } catch (err) {
          console.error('Failed to save recovery copy:', err)
        }
      }
    }, RECOVERY_INTERVAL_MS)

    return (): void => {
      clearInterval(interval)
    }
  }, [])

  // 3. Clear recovery copy once notebook has an established file path
  useEffect(() => {
    const api = (window as unknown as { api?: InkBookAPI }).api
    if (filePath && api) {
      api.clearRecoveryCopy().catch(console.error)
    }
  }, [filePath])
}
