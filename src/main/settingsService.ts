import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'

export interface UserSettings {
  recentNotebooks: string[]
}

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
        : []
    }
  } catch {
    return { recentNotebooks: [] }
  }
}

export async function writeSettings(
  settings: UserSettings,
  customUserDataDir?: string
): Promise<void> {
  const filePath = getSettingsFilePath(customUserDataDir)
  const content = JSON.stringify(settings, null, 2)
  await fs.writeFile(filePath, content, 'utf-8')
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
    await writeSettings({ recentNotebooks: validPaths }, customUserDataDir)
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

  await writeSettings({ recentNotebooks: updated }, customUserDataDir)
  return updated
}

/**
 * Clears the recent notebooks list.
 */
export async function clearRecentNotebooks(customUserDataDir?: string): Promise<void> {
  await writeSettings({ recentNotebooks: [] }, customUserDataDir)
}
