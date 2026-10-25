import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'
import { app, dialog, BrowserWindow } from 'electron'
import { migrateAndValidateNotebook } from '../shared/migration'
import { CURRENT_NOTEBOOK_VERSION } from '../shared/constants'
import { validateNotebook } from '../shared/schema'
import type { Notebook, SaveNotebookResult } from '../shared/types'

export interface LoadNotebookResult {
  success: boolean
  data?: Notebook
  error?: string
}

/**
 * Prompts native open dialog with *.inkbook filter.
 */
export async function showOpenNotebookDialog(window?: BrowserWindow): Promise<string | null> {
  const targetWin = window ?? BrowserWindow.getFocusedWindow() ?? undefined
  const result = await dialog.showOpenDialog(targetWin!, {
    title: 'Open InkBook Notebook',
    filters: [
      { name: 'InkBook Notebooks', extensions: ['inkbook'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0] ?? null
}

/**
 * Prompts native save dialog with *.inkbook filter.
 */
export async function showSaveNotebookDialog(
  window?: BrowserWindow,
  defaultName = 'Untitled.inkbook'
): Promise<string | null> {
  const targetWin = window ?? BrowserWindow.getFocusedWindow() ?? undefined
  const filename = defaultName.endsWith('.inkbook') ? defaultName : `${defaultName}.inkbook`
  const result = await dialog.showSaveDialog(targetWin!, {
    title: 'Save InkBook Notebook',
    defaultPath: filename,
    filters: [
      { name: 'InkBook Notebooks', extensions: ['inkbook'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || !result.filePath) {
    return null
  }
  return result.filePath
}

/**
 * Validates and atomically writes a notebook to disk:
 * 1. Validates the notebook structure using schema
 * 2. Writes JSON content to a temporary file in the same directory
 * 3. Fsyncs the temporary file to ensure data is physically committed to storage
 * 4. Atomically renames the temporary file to the destination path
 */
export async function saveNotebookFile(
  notebook: Notebook,
  filePath: string
): Promise<SaveNotebookResult> {
  // 1. Schema validation
  const validation = validateNotebook(notebook)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      error: `Notebook schema validation failed: ${validation.error}`
    }
  }

  // Refuse to overwrite if existing file on disk has a newer schema version
  try {
    const existingRaw = await fs.readFile(filePath, 'utf-8')
    const existingJson = JSON.parse(existingRaw) as { version?: unknown }
    if (
      typeof existingJson === 'object' &&
      existingJson !== null &&
      typeof existingJson.version === 'number' &&
      existingJson.version > CURRENT_NOTEBOOK_VERSION
    ) {
      return {
        success: false,
        error: `Refusing to overwrite file: on-disk version (${existingJson.version}) is newer than supported version (${CURRENT_NOTEBOOK_VERSION}).`
      }
    }
  } catch {
    // Existing file does not exist or is not readable, continue with save
  }

  const dir = dirname(filePath)
  const tempPath = join(dir, `.tmp-${randomBytes(8).toString('hex')}`)
  const jsonContent = JSON.stringify(validation.data, null, 2)

  let fileHandle: fs.FileHandle | null = null
  try {
    // 2. Write to temp file with fsync
    fileHandle = await fs.open(tempPath, 'w')
    await fileHandle.writeFile(jsonContent, 'utf-8')
    await fileHandle.sync()
    await fileHandle.close()
    fileHandle = null

    // 3. Keep one rolling backup (*.inkbook.bak) of the previous version if it exists
    try {
      await fs.access(filePath)
      const bakPath = `${filePath}.bak`
      await fs.copyFile(filePath, bakPath)
    } catch {
      // Original file does not exist yet; no prior backup needed
    }

    // 4. Atomically rename temp file to target
    await fs.rename(tempPath, filePath)

    return {
      success: true,
      filePath
    }
  } catch (err) {
    if (fileHandle) {
      try {
        await fileHandle.close()
      } catch {
        // ignore close error
      }
    }
    try {
      await fs.unlink(tempPath)
    } catch {
      // ignore unlink error
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

/**
 * Safely loads and validates a notebook file from disk.
 * Returns clear errors if file is corrupted, invalid JSON, or newer version.
 */
export async function loadNotebookFile(filePath: string): Promise<LoadNotebookResult> {
  let rawContent: string
  try {
    rawContent = await fs.readFile(filePath, 'utf-8')
  } catch (err) {
    return {
      success: false,
      error: `Could not read notebook file: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch (err) {
    return {
      success: false,
      error: `File is not valid JSON or is corrupted: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  const result = migrateAndValidateNotebook(parsed)
  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error ?? 'Notebook validation failed'
    }
  }

  return {
    success: true,
    data: result.data
  }
}

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

export function getRecoveryFilePath(customUserDataDir?: string): string {
  const baseDir = getUserDataDir(customUserDataDir)
  return join(baseDir, 'recovery.inkbook')
}

/**
 * Saves a recovery copy of an unsaved notebook into the user data directory.
 */
export async function saveRecoveryCopy(
  notebook: Notebook,
  customUserDataDir?: string
): Promise<SaveNotebookResult> {
  const filePath = getRecoveryFilePath(customUserDataDir)
  return saveNotebookFile(notebook, filePath)
}

/**
 * Loads the recovery copy if one exists and is valid.
 */
export async function loadRecoveryCopy(customUserDataDir?: string): Promise<LoadNotebookResult> {
  const filePath = getRecoveryFilePath(customUserDataDir)
  try {
    await fs.access(filePath)
  } catch {
    return { success: false, error: 'No recovery copy found' }
  }
  return loadNotebookFile(filePath)
}

/**
 * Clears the recovery copy and its backup.
 */
export async function clearRecoveryCopy(customUserDataDir?: string): Promise<void> {
  const filePath = getRecoveryFilePath(customUserDataDir)
  try {
    await fs.unlink(filePath)
  } catch {
    // Ignore error if file does not exist
  }
  try {
    await fs.unlink(`${filePath}.bak`)
  } catch {
    // Ignore error if backup does not exist
  }
}
