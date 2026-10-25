import { describe, it, expect } from 'vitest'
import { resolveTheme, getNextThemePreference } from '../src/shared/theme'

describe('Theme management', () => {
  describe('resolveTheme', () => {
    it('resolves explicit dark theme regardless of system setting', () => {
      expect(resolveTheme('dark', false)).toBe('dark')
      expect(resolveTheme('dark', true)).toBe('dark')
    })

    it('resolves explicit light theme regardless of system setting', () => {
      expect(resolveTheme('light', false)).toBe('light')
      expect(resolveTheme('light', true)).toBe('light')
    })

    it('resolves system theme based on OS preference', () => {
      expect(resolveTheme('system', true)).toBe('dark')
      expect(resolveTheme('system', false)).toBe('light')
    })
  })

  describe('getNextThemePreference', () => {
    it('cycles from system -> light -> dark -> system', () => {
      expect(getNextThemePreference('system')).toBe('light')
      expect(getNextThemePreference('light')).toBe('dark')
      expect(getNextThemePreference('dark')).toBe('system')
    })
  })
})
