import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'
import {
  readSettings,
  writeSettings,
  updateSettings,
  getRecentNotebooks,
  addRecentNotebook,
  clearRecentNotebooks
} from '../src/main/settingsService'

describe('settingsService (Recent Notebooks Persistence)', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `inkbook-settings-test-${randomBytes(6).toString('hex')}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('reads empty settings when settings file does not exist', async () => {
    const settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toEqual([])
  })

  it('writes and reads settings correctly', async () => {
    await writeSettings({ recentNotebooks: ['/a/1.inkbook', '/b/2.inkbook'] }, testDir)
    const settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toEqual(['/a/1.inkbook', '/b/2.inkbook'])
  })

  it('adds recent notebooks, places latest first, and deduplicates', async () => {
    await addRecentNotebook('/notebooks/math.inkbook', testDir)
    await addRecentNotebook('/notebooks/physics.inkbook', testDir)
    await addRecentNotebook('/notebooks/chem.inkbook', testDir)

    let settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toEqual([
      '/notebooks/chem.inkbook',
      '/notebooks/physics.inkbook',
      '/notebooks/math.inkbook'
    ])

    // Re-adding existing moves it to top
    await addRecentNotebook('/notebooks/physics.inkbook', testDir)
    settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toEqual([
      '/notebooks/physics.inkbook',
      '/notebooks/chem.inkbook',
      '/notebooks/math.inkbook'
    ])
  })

  it('caps recent notebooks at 10 items', async () => {
    for (let i = 1; i <= 15; i++) {
      await addRecentNotebook(`/notebooks/nb-${i}.inkbook`, testDir)
    }

    const settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toHaveLength(10)
    expect(settings.recentNotebooks[0]).toBe('/notebooks/nb-15.inkbook')
    expect(settings.recentNotebooks[9]).toBe('/notebooks/nb-6.inkbook')
  })

  it('prunes non-existent files when getRecentNotebooks is called', async () => {
    const existingFile = join(testDir, 'actual.inkbook')
    await fs.writeFile(existingFile, '{}', 'utf-8')

    await addRecentNotebook(existingFile, testDir)
    await addRecentNotebook('/non/existent/file.inkbook', testDir)

    const list = await getRecentNotebooks(testDir)
    expect(list).toEqual([existingFile])

    const updatedSettings = await readSettings(testDir)
    expect(updatedSettings.recentNotebooks).toEqual([existingFile])
  })

  it('clears recent notebooks', async () => {
    await addRecentNotebook('/notebooks/nb.inkbook', testDir)
    await clearRecentNotebooks(testDir)
    const settings = await readSettings(testDir)
    expect(settings.recentNotebooks).toEqual([])
  })

  it('reads default settings for theme, sidebarViewMode, and autosaveInterval', async () => {
    const settings = await readSettings(testDir)
    expect(settings.theme).toBe('system')
    expect(settings.sidebarViewMode).toBe('list')
    expect(settings.autosaveInterval).toBe(2000)
  })

  it('updates and persists user settings via updateSettings', async () => {
    const updated = await updateSettings(
      {
        theme: 'dark',
        sidebarViewMode: 'thumbnail',
        autosaveInterval: 3000
      },
      testDir
    )

    expect(updated.theme).toBe('dark')
    expect(updated.sidebarViewMode).toBe('thumbnail')
    expect(updated.autosaveInterval).toBe(3000)

    const reloaded = await readSettings(testDir)
    expect(reloaded.theme).toBe('dark')
    expect(reloaded.sidebarViewMode).toBe('thumbnail')
    expect(reloaded.autosaveInterval).toBe(3000)
  })
})
