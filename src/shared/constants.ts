import type { PagePreset, PageOrientation, PageSize } from './types'

export const CURRENT_NOTEBOOK_VERSION = 1

export const PAGE_PRESETS: Record<
  Exclude<PagePreset, 'custom'>,
  { width: number; height: number }
> = {
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 }
}

export const DEFAULT_PAGE_SIZE: PageSize = {
  preset: 'A4',
  width: 794,
  height: 1123
}

export const DEFAULT_PAGE_ORIENTATION: PageOrientation = 'portrait'

export function isLandscape(orientation: PageOrientation): boolean {
  return orientation === 'landscape'
}

export function swapDimensions(dims: { width: number; height: number }): {
  width: number
  height: number
} {
  return { width: dims.height, height: dims.width }
}

export function getPresetDimensions(
  preset: Exclude<PagePreset, 'custom'>,
  orientation: PageOrientation
): { width: number; height: number } {
  const base = PAGE_PRESETS[preset]
  if (isLandscape(orientation)) {
    return swapDimensions(base)
  }
  return { width: base.width, height: base.height }
}

export function getPageDimensions(page: { size: PageSize; orientation: PageOrientation }): {
  width: number
  height: number
} {
  if (page.size.preset === 'custom') {
    const w = page.size.width
    const h = page.size.height
    if (isLandscape(page.orientation)) {
      return {
        width: Math.max(w, h),
        height: Math.min(w, h)
      }
    }
    return {
      width: Math.min(w, h),
      height: Math.max(w, h)
    }
  }
  return getPresetDimensions(page.size.preset, page.orientation)
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
