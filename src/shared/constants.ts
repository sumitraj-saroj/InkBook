import type { PagePreset, PageOrientation } from './types'

export const CURRENT_NOTEBOOK_VERSION = 1

export const PAGE_PRESETS: Record<
  Exclude<PagePreset, 'custom'>,
  { width: number; height: number }
> = {
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 }
}

export function getPresetDimensions(
  preset: Exclude<PagePreset, 'custom'>,
  orientation: PageOrientation
): { width: number; height: number } {
  const base = PAGE_PRESETS[preset]
  if (orientation === 'landscape') {
    return { width: base.height, height: base.width }
  }
  return { width: base.width, height: base.height }
}

/**
 * Safe subset of Excalidraw appState keys to persist in the notebook file.
 * Excludes transient UI states such as open menus, dialogs, active drag handles, or active selections.
 */
export const SAFE_APP_STATE_KEYS = [
  'viewBackgroundColor',
  'currentItemStrokeColor',
  'currentItemBackgroundColor',
  'currentItemFillStyle',
  'currentItemStrokeWidth',
  'currentItemStrokeStyle',
  'currentItemRoughness',
  'currentItemOpacity',
  'currentItemFontFamily',
  'currentItemFontSize',
  'currentItemTextAlign',
  'currentItemStartArrowhead',
  'currentItemEndArrowhead',
  'scrollX',
  'scrollY',
  'zoom',
  'gridSize'
] as const
