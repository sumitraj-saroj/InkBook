import { createContext, useContext } from 'react'
import type { ThemePreference, ResolvedTheme } from '@shared/index'

export type AppTheme = ResolvedTheme

export interface ThemeContextValue {
  /** The user's chosen preference: 'system' | 'dark' | 'light' */
  themePreference: ThemePreference
  /** The actively rendered theme: 'dark' | 'light' */
  resolvedTheme: ResolvedTheme
  /** Alias for resolvedTheme for backward compatibility */
  theme: ResolvedTheme
  /** Sets the theme preference */
  setThemePreference: (pref: ThemePreference) => void
  /** Direct setter (legacy support) */
  setTheme: (theme: AppTheme) => void
  /** Cycles through system -> light -> dark */
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
