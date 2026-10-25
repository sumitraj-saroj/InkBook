import { describe, it, expect } from 'vitest'
import { findInkBookArgument } from '../src/main/commandLine'

describe('commandLine argument parser', () => {
  it('returns null when no arguments are provided', () => {
    expect(findInkBookArgument([])).toBeNull()
    expect(findInkBookArgument(['electron', '.'])).toBeNull()
  })

  it('ignores flags and options', () => {
    expect(
      findInkBookArgument([
        'inkbook',
        '--ozone-platform-hint=auto',
        '--enable-features=UseOzonePlatform',
        '-d'
      ])
    ).toBeNull()
  })

  it('finds absolute and relative .inkbook file arguments', () => {
    expect(findInkBookArgument(['inkbook', '/home/user/Documents/MyNotes.inkbook'])).toBe(
      '/home/user/Documents/MyNotes.inkbook'
    )
    expect(findInkBookArgument(['inkbook', 'lecture-1.inkbook'])).toBe('lecture-1.inkbook')
  })

  it('picks the .inkbook file even when mixed with flags', () => {
    expect(
      findInkBookArgument([
        '/usr/bin/inkbook',
        '--no-sandbox',
        '/data/notebooks/physics.inkbook',
        '--devtools'
      ])
    ).toBe('/data/notebooks/physics.inkbook')
  })
})
