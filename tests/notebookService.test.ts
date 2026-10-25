import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import {
  saveNotebookFile,
  loadNotebookFile,
  saveRecoveryCopy,
  loadRecoveryCopy,
  clearRecoveryCopy
} from '../src/main/notebookService'
import type { Notebook } from '../src/shared/types'

describe('notebookService persistence', () => {
  let testDir: string

  const sampleNotebook: Notebook = {
    format: 'inkbook',
    version: 1,
    id: 'test-nb-1',
    name: 'Physics Notes',
    createdAt: '2026-10-25T12:00:00.000Z',
    updatedAt: '2026-10-25T12:00:00.000Z',
    pages: [
      {
        id: 'page-1',
        title: 'Mechanics',
        size: { preset: 'A4', width: 794, height: 1123 },
        orientation: 'portrait',
        background: 'ruled',
        scene: {
          elements: [{ id: 'rect1', type: 'rectangle', x: 10, y: 10, width: 100, height: 100 }],
          appState: { viewBackgroundColor: 'transparent', scrollX: 0, scrollY: 0 },
          files: {}
        }
      }
    ]
  }

  beforeEach(async () => {
    testDir = join(tmpdir(), `inkbook-test-${randomBytes(6).toString('hex')}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('atomically saves a valid notebook to disk and reads it back', async () => {
    const filePath = join(testDir, 'test.inkbook')
    const saveRes = await saveNotebookFile(sampleNotebook, filePath)

    expect(saveRes.success).toBe(true)
    expect(saveRes.filePath).toBe(filePath)

    const loadRes = await loadNotebookFile(filePath)
    expect(loadRes.success).toBe(true)
    expect(loadRes.data).toBeDefined()
    expect(loadRes.data?.id).toBe(sampleNotebook.id)
    expect(loadRes.data?.name).toBe('Physics Notes')
    expect(loadRes.data?.pages).toHaveLength(1)
    expect(loadRes.data?.pages[0]?.background).toBe('ruled')
  })

  it('creates a rolling .bak backup before overwriting an existing file', async () => {
    const filePath = join(testDir, 'my-notes.inkbook')
    const bakPath = `${filePath}.bak`

    // Initial save (v1)
    await saveNotebookFile(sampleNotebook, filePath)
    let bakExists = false
    try {
      await fs.access(bakPath)
      bakExists = true
    } catch {
      // not found
    }
    expect(bakExists).toBe(false) // No .bak on very first save

    // Update notebook (v2)
    const updatedNotebook: Notebook = {
      ...sampleNotebook,
      name: 'Physics Notes (Revised)',
      updatedAt: '2026-10-25T13:00:00.000Z'
    }

    const save2Res = await saveNotebookFile(updatedNotebook, filePath)
    expect(save2Res.success).toBe(true)

    // Now .bak must exist and contain the original (v1) content
    const bakContent = await fs.readFile(bakPath, 'utf-8')
    const parsedBak = JSON.parse(bakContent) as Notebook
    expect(parsedBak.name).toBe('Physics Notes')

    // Current file has updated (v2) content
    const currentRes = await loadNotebookFile(filePath)
    expect(currentRes.data?.name).toBe('Physics Notes (Revised)')
  })

  it('rejects invalid schema notebooks without writing to disk', async () => {
    const filePath = join(testDir, 'invalid.inkbook')
    const invalidNotebook = {
      format: 'unknown-format',
      version: 1,
      id: 'bad-id'
    } as unknown as Notebook

    const saveRes = await saveNotebookFile(invalidNotebook, filePath)
    expect(saveRes.success).toBe(false)
    expect(saveRes.error).toContain('schema validation failed')

    let fileCreated = false
    try {
      await fs.access(filePath)
      fileCreated = true
    } catch {
      // not found
    }
    expect(fileCreated).toBe(false)
  })

  it('returns clear error when loading corrupted JSON', async () => {
    const filePath = join(testDir, 'corrupted.inkbook')
    await fs.writeFile(filePath, '{ "format": "inkbook", incomplete...', 'utf-8')

    const loadRes = await loadNotebookFile(filePath)
    expect(loadRes.success).toBe(false)
    expect(loadRes.error).toContain('File is not valid JSON or is corrupted')
  })

  it('returns clear error when loading newer-version file', async () => {
    const filePath = join(testDir, 'future.inkbook')
    const futureNotebook = {
      format: 'inkbook',
      version: 999,
      id: 'future-nb',
      name: 'Future',
      createdAt: '2026-10-25T12:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z',
      pages: []
    }
    await fs.writeFile(filePath, JSON.stringify(futureNotebook), 'utf-8')

    const loadRes = await loadNotebookFile(filePath)
    expect(loadRes.success).toBe(false)
    expect(loadRes.error).toContain('newer than supported version')
  })

  it('manages crash recovery copy life cycle correctly', async () => {
    // 1. Check when no recovery copy exists
    const initialCheck = await loadRecoveryCopy(testDir)
    expect(initialCheck.success).toBe(false)

    // 2. Save recovery copy
    const saveRes = await saveRecoveryCopy(sampleNotebook, testDir)
    expect(saveRes.success).toBe(true)

    // Verify recovery file exists on disk
    const recoveryFile = join(testDir, 'recovery.inkbook')
    expect(await fs.stat(recoveryFile)).toBeDefined()

    // 3. Load recovery copy
    const loaded = await loadRecoveryCopy(testDir)
    expect(loaded.success).toBe(true)
    expect(loaded.data?.id).toBe(sampleNotebook.id)
    expect(loaded.data?.name).toBe('Physics Notes')

    // 4. Clear recovery copy
    await clearRecoveryCopy(testDir)
    const afterClear = await loadRecoveryCopy(testDir)
    expect(afterClear.success).toBe(false)
  })
})
