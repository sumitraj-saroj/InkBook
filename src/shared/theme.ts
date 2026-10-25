export type ThemePreference = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

/**
 * Resolves the effective UI theme ('dark' or 'light') based on the user's
 * theme preference ('system' | 'dark' | 'light') and current OS scheme.
 */
export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return systemIsDark ? 'dark' : 'light'
}

/**
 * Returns the next theme preference in the cycle: system -> light -> dark -> system.
 */
export function getNextThemePreference(current: ThemePreference): ThemePreference {
  switch (current) {
    case 'system':
      return 'light'
    case 'light':
      return 'dark'
    case 'dark':
      return 'system'
    default:
      return 'system'
  }
}
