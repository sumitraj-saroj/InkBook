import { describe, it, expect } from 'vitest'
import { isValidExternalUrl } from '../src/shared/urlSecurity'

describe('URL Security & External Navigation Validation', () => {
  it('accepts valid https URLs', () => {
    expect(isValidExternalUrl('https://excalidraw.com')).toBe(true)
    expect(isValidExternalUrl('https://github.com/excalidraw/excalidraw')).toBe(true)
  })

  it('accepts valid http URLs', () => {
    expect(isValidExternalUrl('http://example.com')).toBe(true)
  })

  it('accepts valid mailto URLs', () => {
    expect(isValidExternalUrl('mailto:support@example.com')).toBe(true)
  })

  it('rejects dangerous javascript: schemes', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs for external opening', () => {
    expect(isValidExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects file: protocol for external browser opening', () => {
    expect(isValidExternalUrl('file:///etc/passwd')).toBe(false)
  })

  it('rejects invalid or malformed strings', () => {
    expect(isValidExternalUrl('')).toBe(false)
    expect(isValidExternalUrl('not a url')).toBe(false)
    expect(isValidExternalUrl('://bad')).toBe(false)
  })
})
