import type { InkBookAPI } from '@shared/types'

declare global {
  interface Window {
    api: InkBookAPI
  }
}
