import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import { ThemeContext, type AppTheme } from './ThemeContext'
import {
  resolveTheme,
  getNextThemePreference,
  type ThemePreference,
  type ResolvedTheme
} from '@shared/index'

const THEME_STORAGE_KEY = 'inkbook-theme-preference'

function getInitialPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved
    }
  } catch {
    // localStorage may be unavailable in some environments
  }
  return 'system'
}

function getSystemIsDark(): boolean {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return true
}

export function ThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialPreference)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(getSystemIsDark)

  // Listen to OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemIsDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return (): void => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return resolveTheme(themePreference, systemIsDark)
  }, [themePreference, systemIsDark])

  // Apply theme to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }
  }, [resolvedTheme])

  const setThemePreference = useCallback((pref: ThemePreference): void => {
    setThemePreferenceState(pref)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref)
    } catch {
      // ignore
    }
  }, [])

  const setTheme = useCallback(
    (theme: AppTheme): void => {
      setThemePreference(theme)
    },
    [setThemePreference]
  )

  const toggleTheme = useCallback((): void => {
    setThemePreferenceState((prev) => {
      const next = getNextThemePreference(prev)
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      theme: resolvedTheme,
      setThemePreference,
      setTheme,
      toggleTheme
    }),
    [themePreference, resolvedTheme, setThemePreference, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
