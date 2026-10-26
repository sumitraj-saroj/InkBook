import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@shared/types'

export type { UserSettings }

const MAX_RECENT_NOTEBOOKS = 10

function getUserDataDir(customUserDataDir?: string): string {
  if (customUserDataDir) return customUserDataDir
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData')
    }
  } catch {
    // fallback
  }
  return tmpdir()
}

export function getSettingsFilePath(customUserDataDir?: string): string {
  const baseDir = getUserDataDir(customUserDataDir)
  return join(baseDir, 'settings.json')
}

export async function readSettings(customUserDataDir?: string): Promise<UserSettings> {
  const filePath = getSettingsFilePath(customUserDataDir)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<UserSettings>
    return {
      recentNotebooks: Array.isArray(parsed.recentNotebooks)
        ? parsed.recentNotebooks.filter((item): item is string => typeof item === 'string')
        : [],
      theme:
        parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system'
          ? parsed.theme
          : DEFAULT_USER_SETTINGS.theme,
      sidebarViewMode:
        parsed.sidebarViewMode === 'thumbnail'
          ? 'thumbnail'
          : DEFAULT_USER_SETTINGS.sidebarViewMode,
      autosaveInterval:
        typeof parsed.autosaveInterval === 'number' && parsed.autosaveInterval >= 500
          ? parsed.autosaveInterval
          : DEFAULT_USER_SETTINGS.autosaveInterval,
      paperColorInDarkMode: parsed.paperColorInDarkMode === 'light' ? 'light' : 'dark',
      sidebarWidth:
        typeof parsed.sidebarWidth === 'number' &&
        parsed.sidebarWidth >= 200 &&
        parsed.sidebarWidth <= 360
          ? parsed.sidebarWidth
          : DEFAULT_USER_SETTINGS.sidebarWidth,
      sidebarCollapsed:
        typeof parsed.sidebarCollapsed === 'boolean'
          ? parsed.sidebarCollapsed
          : DEFAULT_USER_SETTINGS.sidebarCollapsed
    }
  } catch {
    return { ...DEFAULT_USER_SETTINGS }
  }
}

export async function writeSettings(
  settings: Partial<UserSettings>,
  customUserDataDir?: string
): Promise<void> {
  const filePath = getSettingsFilePath(customUserDataDir)
  const fullSettings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    ...settings
  }
  const content = JSON.stringify(fullSettings, null, 2)
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function updateSettings(
  partial: Partial<UserSettings>,
  customUserDataDir?: string
): Promise<UserSettings> {
  const current = await readSettings(customUserDataDir)
  const updated: UserSettings = {
    recentNotebooks: partial.recentNotebooks ?? current.recentNotebooks,
    theme: partial.theme ?? current.theme,
    sidebarViewMode: partial.sidebarViewMode ?? current.sidebarViewMode,
    autosaveInterval: partial.autosaveInterval ?? current.autosaveInterval,
    paperColorInDarkMode: partial.paperColorInDarkMode ?? current.paperColorInDarkMode,
    sidebarWidth: partial.sidebarWidth ?? current.sidebarWidth,
    sidebarCollapsed: partial.sidebarCollapsed ?? current.sidebarCollapsed
  }
  await writeSettings(updated, customUserDataDir)
  return updated
}

/**
 * Returns the list of up to 10 recent notebook paths, filtering out paths that no longer exist.
 */
export async function getRecentNotebooks(customUserDataDir?: string): Promise<string[]> {
  const settings = await readSettings(customUserDataDir)
  const validPaths: string[] = []

  for (const path of settings.recentNotebooks) {
    try {
      await fs.access(path)
      validPaths.push(path)
    } catch {
      // file no longer exists on disk, prune it
    }
  }

  // If some missing files were pruned, update settings file
  if (validPaths.length !== settings.recentNotebooks.length) {
    await updateSettings({ recentNotebooks: validPaths }, customUserDataDir)
  }

  return validPaths.slice(0, MAX_RECENT_NOTEBOOKS)
}

/**
 * Adds a notebook file path to the recent list (most recent first, deduplicated, max 10).
 */
export async function addRecentNotebook(
  filePath: string,
  customUserDataDir?: string
): Promise<string[]> {
  const settings = await readSettings(customUserDataDir)
  const filtered = settings.recentNotebooks.filter((p) => p !== filePath)
  const updated = [filePath, ...filtered].slice(0, MAX_RECENT_NOTEBOOKS)

  await updateSettings({ recentNotebooks: updated }, customUserDataDir)
  return updated
}

/**
 * Clears the recent notebooks list.
 */
export async function clearRecentNotebooks(customUserDataDir?: string): Promise<void> {
  await updateSettings({ recentNotebooks: [] }, customUserDataDir)
}
