import { CURRENT_NOTEBOOK_VERSION } from './constants'
import { validateNotebook } from './schema'
import type { Notebook } from './types'

export type MigrationFunction = (data: Record<string, unknown>) => Record<string, unknown>

/**
 * Migration registry keyed by the source version.
 * For example, migrations[1] migrates data from version 1 to version 2.
 */
export const migrations: Record<number, MigrationFunction> = {}

export interface MigrationResult {
  success: boolean
  data?: Notebook
  migrated: boolean
  error?: string
}

/**
 * Migrates arbitrary raw notebook data to the current version and validates the output.
 */
export function migrateAndValidateNotebook(raw: unknown): MigrationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { success: false, migrated: false, error: 'Notebook data must be an object' }
  }

  const record = { ...(raw as Record<string, unknown>) }

  if (record['format'] !== 'inkbook') {
    return {
      success: false,
      migrated: false,
      error: `Invalid file format: expected "inkbook", received "${String(record['format'])}"`
    }
  }

  const version = typeof record['version'] === 'number' ? record['version'] : 0

  if (version > CURRENT_NOTEBOOK_VERSION) {
    return {
      success: false,
      migrated: false,
      error: `Notebook version ${version} is newer than supported version ${CURRENT_NOTEBOOK_VERSION}. Please update InkBook.`
    }
  }

  let currentData = record
  let currentVersion = version
  let hasMigrated = false

  while (currentVersion < CURRENT_NOTEBOOK_VERSION) {
    const migration = migrations[currentVersion]
    if (!migration) {
      return {
        success: false,
        migrated: hasMigrated,
        error: `No migration found for notebook from version ${currentVersion} to ${currentVersion + 1}`
      }
    }
    try {
      currentData = migration(currentData)
      currentVersion += 1
      hasMigrated = true
    } catch (err) {
      return {
        success: false,
        migrated: hasMigrated,
        error: `Migration from version ${currentVersion} failed: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  }

  const validation = validateNotebook(currentData)
  if (!validation.success || !validation.data) {
    return {
      success: false,
      migrated: hasMigrated,
      error: `Validation failed after migration: ${validation.error}`
    }
  }

  return {
    success: true,
    data: validation.data as Notebook,
    migrated: hasMigrated
  }
}
