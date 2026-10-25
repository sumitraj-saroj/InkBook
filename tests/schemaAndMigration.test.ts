import { describe, it, expect, afterEach } from 'vitest'
import {
  validateNotebook,
  sanitizeAppState,
  migrateAndValidateNotebook,
  migrations,
  type Notebook
} from '../src/shared'

describe('Notebook Schema Validation', () => {
  const validNotebook: Notebook = {
    format: 'inkbook',
    version: 1,
    id: 'nb-1',
    name: 'Test Notebook',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: 'page-1',
        title: 'Page 1',
        size: { preset: 'A4', width: 794, height: 1123 },
        orientation: 'portrait',
        background: 'ruled',
        scene: {
          elements: [],
          appState: { viewBackgroundColor: 'transparent' },
          files: {}
        }
      }
    ]
  }

  it('validates a correct notebook object successfully', () => {
    const result = validateNotebook(validNotebook)
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Test Notebook')
  })

  it('fails validation when format is not "inkbook"', () => {
    const invalid = { ...validNotebook, format: 'unknown' }
    const result = validateNotebook(invalid)
    expect(result.success).toBe(false)
    expect(result.error).toContain('format')
  })

  it('fails validation when notebook has zero pages', () => {
    const invalid = { ...validNotebook, pages: [] }
    const result = validateNotebook(invalid)
    expect(result.success).toBe(false)
    expect(result.error).toContain('pages')
  })

  it('fails validation when page background is invalid', () => {
    const invalid = {
      ...validNotebook,
      pages: [
        {
          ...validNotebook.pages[0]!,
          background: 'rainbow' as unknown as Notebook['pages'][0]['background']
        }
      ]
    }
    const result = validateNotebook(invalid)
    expect(result.success).toBe(false)
  })

  it('fails validation when dimensions are negative or zero', () => {
    const invalid = {
      ...validNotebook,
      pages: [
        {
          ...validNotebook.pages[0]!,
          size: { preset: 'custom' as const, width: -100, height: 0 }
        }
      ]
    }
    const result = validateNotebook(invalid)
    expect(result.success).toBe(false)
  })
})

describe('AppState Sanitization', () => {
  it('preserves safe keys and removes transient UI properties', () => {
    const dirtyAppState = {
      viewBackgroundColor: '#ffffff',
      currentItemStrokeColor: '#000000',
      scrollX: 100,
      scrollY: 200,
      zoom: { value: 1.5 },
      gridSize: 20,
      // Transient UI properties:
      openMenu: 'canvas',
      selectedElementIds: { el1: true },
      draggingElement: null,
      editingElement: null,
      cursorButton: 'up'
    }

    const clean = sanitizeAppState(dirtyAppState)

    expect(clean.viewBackgroundColor).toBe('#ffffff')
    expect(clean.currentItemStrokeColor).toBe('#000000')
    expect(clean.scrollX).toBe(100)
    expect(clean.scrollY).toBe(200)
    expect(clean.zoom).toEqual({ value: 1.5 })
    expect(clean.gridSize).toBe(20)

    const rawClean = clean as Record<string, unknown>
    expect(rawClean['openMenu']).toBeUndefined()
    expect(rawClean['selectedElementIds']).toBeUndefined()
    expect(rawClean['draggingElement']).toBeUndefined()
    expect(rawClean['cursorButton']).toBeUndefined()
  })

  it('returns empty object when appState is null or undefined', () => {
    expect(sanitizeAppState(null)).toEqual({})
    expect(sanitizeAppState(undefined)).toEqual({})
  })
})

describe('Notebook Migration Pipeline', () => {
  const validNotebook: Notebook = {
    format: 'inkbook',
    version: 1,
    id: 'nb-1',
    name: 'Test Notebook',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: 'page-1',
        title: 'Page 1',
        size: { preset: 'A4', width: 794, height: 1123 },
        orientation: 'portrait',
        background: 'ruled',
        scene: {
          elements: [],
          appState: {},
          files: {}
        }
      }
    ]
  }

  afterEach(() => {
    delete migrations[0]
  })

  it('passes through valid current version notebook without migration', () => {
    const result = migrateAndValidateNotebook(validNotebook)
    expect(result.success).toBe(true)
    expect(result.migrated).toBe(false)
    expect(result.data?.id).toBe('nb-1')
  })

  it('rejects future versions with descriptive error', () => {
    const future = { ...validNotebook, version: 999 }
    const result = migrateAndValidateNotebook(future)
    expect(result.success).toBe(false)
    expect(result.error).toContain('newer than supported version')
  })

  it('rejects invalid format', () => {
    const invalid = { ...validNotebook, format: 'excalidraw' }
    const result = migrateAndValidateNotebook(invalid)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid file format')
  })

  it('applies registered migration for older versions', () => {
    // Register a mock v0 -> v1 migration
    migrations[0] = (data: Record<string, unknown>) => {
      return {
        ...data,
        version: 1,
        pages: [
          {
            id: 'legacy-page',
            title: 'Legacy Page',
            size: { preset: 'A4', width: 794, height: 1123 },
            orientation: 'portrait',
            background: 'blank',
            scene: { elements: [], appState: {}, files: {} }
          }
        ]
      }
    }

    const legacy = {
      format: 'inkbook',
      version: 0,
      id: 'legacy-nb',
      name: 'Legacy Notebook',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = migrateAndValidateNotebook(legacy)
    expect(result.success).toBe(true)
    expect(result.migrated).toBe(true)
    expect(result.data?.version).toBe(1)
    expect(result.data?.pages).toHaveLength(1)
    expect(result.data?.pages[0]?.title).toBe('Legacy Page')
  })
})
