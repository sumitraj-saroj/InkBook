import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import { randomBytes } from 'crypto'
import { dialog, BrowserWindow } from 'electron'
import type { OpenFileResult, SaveFileResult } from '@shared/types'

/**
 * Atomically writes content to a file by first writing to a temporary file
 * and then renaming it over the destination.
 */
export async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath)
  const tempName = `.tmp-${randomBytes(6).toString('hex')}`
  const tempPath = join(dir, tempName)

  await fs.writeFile(tempPath, content, 'utf-8')
  await fs.rename(tempPath, filePath)
}

/**
 * Safely reads a UTF-8 text file.
 */
export async function readUtf8File(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8')
}

/**
 * Displays native open dialog and reads the selected .excalidraw file.
 */
export async function handleOpenExcalidraw(window?: BrowserWindow): Promise<OpenFileResult> {
  const result = await dialog.showOpenDialog(
    window ?? (BrowserWindow.getFocusedWindow() || undefined)!,
    {
      title: 'Open Excalidraw Drawing',
      filters: [
        { name: 'Excalidraw Files', extensions: ['excalidraw', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    }
  )

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const selectedPath = result.filePaths[0]
  if (!selectedPath) {
    return { canceled: true }
  }

  try {
    const content = await readUtf8File(selectedPath)
    return {
      canceled: false,
      filePath: selectedPath,
      content
    }
  } catch {
    return {
      canceled: false,
      filePath: selectedPath,
      content: undefined
    }
  }
}

/**
 * Displays native save dialog and atomically writes content to the selected path.
 */
export async function handleSaveExcalidraw(
  content: string,
  window?: BrowserWindow
): Promise<SaveFileResult> {
  if (typeof content !== 'string') {
    return { canceled: false, error: 'Invalid content: expected a string' }
  }

  const result = await dialog.showSaveDialog(
    window ?? (BrowserWindow.getFocusedWindow() || undefined)!,
    {
      title: 'Save Excalidraw Drawing',
      defaultPath: 'drawing.excalidraw',
      filters: [
        { name: 'Excalidraw Files', extensions: ['excalidraw'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }
  )

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  try {
    await atomicWriteFile(result.filePath, content)
    return {
      canceled: false,
      filePath: result.filePath
    }
  } catch (err) {
    return {
      canceled: false,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
