import { z } from 'zod'
import { SAFE_APP_STATE_KEYS } from './constants'
import type { SafeAppState } from './types'

export const PagePresetSchema = z.enum(['A4', 'A5', 'custom'])
export const PageOrientationSchema = z.enum(['portrait', 'landscape'])
export const PageBackgroundSchema = z.enum(['ruled', 'grid', 'dots', 'blank'])

export const PageSizeSchema = z.object({
  preset: PagePresetSchema,
  width: z.number().positive(),
  height: z.number().positive()
})

export const SafeAppStateSchema = z.record(z.string(), z.unknown())

export const PageSceneSchema = z.object({
  elements: z.array(z.unknown()),
  appState: SafeAppStateSchema,
  files: z.record(z.string(), z.unknown())
})

export const PageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  size: PageSizeSchema,
  orientation: PageOrientationSchema,
  background: PageBackgroundSchema,
  scene: PageSceneSchema
})

export const NotebookSchema = z.object({
  format: z.literal('inkbook'),
  version: z.number().int().positive(),
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  pages: z.array(PageSchema).min(1, 'Notebook must contain at least one page')
})

export type NotebookSchemaType = z.infer<typeof NotebookSchema>
export type PageSchemaType = z.infer<typeof PageSchema>

/**
 * Validates arbitrary data against the Notebook zod schema.
 */
export function validateNotebook(data: unknown): {
  success: boolean
  data?: NotebookSchemaType
  error?: string
} {
  const result = NotebookSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
  }
}

/**
 * Extracts and sanitizes only the safe persistent subset of Excalidraw's appState,
 * omitting transient UI state like active menus, selections, or tool pointers.
 */
export function sanitizeAppState(
  appState: Record<string, unknown> | null | undefined
): SafeAppState {
  if (!appState) return {}
  const sanitized: Record<string, unknown> = {}
  for (const key of SAFE_APP_STATE_KEYS) {
    if (key in appState && appState[key] !== undefined) {
      sanitized[key] = appState[key]
    }
  }
  return sanitized as SafeAppState
}
