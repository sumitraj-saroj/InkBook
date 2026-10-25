import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'
import { migrateAndValidateNotebook } from '../shared/migration'
import { validateNotebook } from '../shared/schema'
import type { Notebook, SaveNotebookResult } from '../shared/types'

export interface LoadNotebookResult {
  success: boolean
  data?: Notebook
  error?: string
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

    // 3. Atomically rename temp file to target
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
