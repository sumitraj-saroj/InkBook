import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { atomicWriteFile, readUtf8File } from '../src/main/fileManager'

describe('File Manager (IPC file read/write)', () => {
  let testDir: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(join(tmpdir(), 'inkbook-test-'))
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup error if already removed
    }
  })

  it('atomically writes and reads a text file', async () => {
    const targetFile = join(testDir, 'sample.txt')
    const content = 'Hello InkBook Excalidraw'

    await atomicWriteFile(targetFile, content)

    const read = await readUtf8File(targetFile)
    expect(read).toBe(content)
  })

  it('atomically overwrites an existing file cleanly', async () => {
    const targetFile = join(testDir, 'drawing.excalidraw')
    await atomicWriteFile(targetFile, JSON.stringify({ version: 1 }))
    await atomicWriteFile(targetFile, JSON.stringify({ version: 2, elements: [] }))

    const read = await readUtf8File(targetFile)
    const parsed = JSON.parse(read)
    expect(parsed.version).toBe(2)
  })

  it('leaves no dangling temporary files after atomic write', async () => {
    const targetFile = join(testDir, 'drawing.excalidraw')
    await atomicWriteFile(targetFile, 'content')

    const files = await fs.readdir(testDir)
    expect(files).toEqual(['drawing.excalidraw'])
  })

  it('correctly persists and reads valid Excalidraw JSON payloads', async () => {
    const targetFile = join(testDir, 'diagram.excalidraw')
    const excalidrawPayload = {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          backgroundColor: 'transparent'
        }
      ],
      appState: {
        viewBackgroundColor: 'transparent',
        gridSize: 20
      },
      files: {}
    }

    const json = JSON.stringify(excalidrawPayload, null, 2)
    await atomicWriteFile(targetFile, json)

    const content = await readUtf8File(targetFile)
    const restored = JSON.parse(content)

    expect(restored.type).toBe('excalidraw')
    expect(restored.version).toBe(2)
    expect(restored.elements).toHaveLength(1)
    expect(restored.elements[0].id).toBe('rect-1')
    expect(restored.appState.viewBackgroundColor).toBe('transparent')
  })

  it('throws an error when attempting to read a non-existent file', async () => {
    const nonExistent = join(testDir, 'does-not-exist.excalidraw')
    await expect(readUtf8File(nonExistent)).rejects.toThrow()
  })
})
