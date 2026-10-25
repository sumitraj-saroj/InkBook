import { describe, it, expect } from 'vitest'
import { searchNotebook } from '../src/shared/search'
import type { Notebook } from '../src/shared/types'

describe('searchNotebook', () => {
  const sampleNotebook: Notebook = {
    format: 'inkbook',
    version: 1,
    id: 'test-notebook',
    name: 'Sample Notebook',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    pages: [
      {
        id: 'page-1',
        title: 'Project Roadmap',
        size: { preset: 'A4', width: 794, height: 1123 },
        orientation: 'portrait',
        background: 'ruled',
        scene: {
          elements: [
            {
              id: 'el-1',
              type: 'text',
              text: 'Phase 1: Foundation and setup',
              x: 100,
              y: 100,
              isDeleted: false
            },
            {
              id: 'el-2',
              type: 'rectangle',
              x: 50,
              y: 50,
              isDeleted: false
            },
            {
              id: 'el-3',
              type: 'text',
              text: 'Deleted text notes that should not appear',
              isDeleted: true
            }
          ],
          appState: {},
          files: {}
        }
      },
      {
        id: 'page-2',
        title: 'Architecture Overview',
        size: { preset: 'A4', width: 794, height: 1123 },
        orientation: 'portrait',
        background: 'blank',
        scene: {
          elements: [
            {
              id: 'el-4',
              type: 'text',
              text: 'Electron main process communicating with renderer via IPC',
              x: 100,
              y: 200,
              isDeleted: false
            },
            {
              id: 'el-5',
              type: 'text',
              text: 'Phase 8: Usability polish and keyboard shortcuts',
              x: 100,
              y: 300,
              isDeleted: false
            }
          ],
          appState: {},
          files: {}
        }
      }
    ]
  }

  it('returns empty array when query is empty or whitespace', () => {
    expect(searchNotebook(sampleNotebook, '')).toEqual([])
    expect(searchNotebook(sampleNotebook, '   ')).toEqual([])
  })

  it('finds matches in page titles', () => {
    const results = searchNotebook(sampleNotebook, 'Roadmap')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      type: 'page',
      pageId: 'page-1',
      pageTitle: 'Project Roadmap',
      snippet: 'Project Roadmap'
    })
  })

  it('is case-insensitive for page titles and text', () => {
    const results = searchNotebook(sampleNotebook, 'architecture')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      type: 'page',
      pageId: 'page-2',
      pageTitle: 'Architecture Overview'
    })
  })

  it('finds matches in text elements across multiple pages', () => {
    const results = searchNotebook(sampleNotebook, 'Phase')
    // Matches el-1 on page-1 and el-5 on page-2
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      type: 'text',
      pageId: 'page-1',
      elementId: 'el-1',
      snippet: expect.stringContaining('Phase 1')
    })
    expect(results[1]).toMatchObject({
      type: 'text',
      pageId: 'page-2',
      elementId: 'el-5',
      snippet: expect.stringContaining('Phase 8')
    })
  })

  it('ignores deleted elements', () => {
    const results = searchNotebook(sampleNotebook, 'Deleted')
    expect(results).toHaveLength(0)
  })

  it('returns both title matches and text matches ordered by page', () => {
    const results = searchNotebook(sampleNotebook, 'Overview')
    expect(results).toHaveLength(1)
    expect(results[0]?.type).toBe('page')
  })

  it('formats snippet with ellipses when match is long', () => {
    const longNotebook: Notebook = {
      ...sampleNotebook,
      pages: [
        {
          ...sampleNotebook.pages[0]!,
          scene: {
            ...sampleNotebook.pages[0]!.scene,
            elements: [
              {
                id: 'el-long',
                type: 'text',
                text: 'Here is a very long text string that contains secret_keyword somewhere deep inside its characters to verify snippet preview.',
                isDeleted: false
              }
            ]
          }
        }
      ]
    }
    const results = searchNotebook(longNotebook, 'secret_keyword')
    expect(results).toHaveLength(1)
    expect(results[0]?.snippet).toContain('secret_keyword')
  })
})
