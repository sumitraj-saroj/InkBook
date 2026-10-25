export interface BackgroundThemeColors {
  paper: string
  ruledLine: string
  ruledMarginLine: string
  gridLine: string
  dot: string
}

export interface BackgroundConfig {
  spacing: number
  ruledTopMargin: number
  ruledLeftMargin: number
  showRuledLeftMargin: boolean
  dotRadius: number
  strokeWidth: number
  colors: {
    dark: BackgroundThemeColors
    light: BackgroundThemeColors
  }
}

export const BACKGROUND_CONFIG: BackgroundConfig = {
  spacing: 32,
  ruledTopMargin: 96,
  ruledLeftMargin: 72,
  showRuledLeftMargin: true,
  dotRadius: 1.25,
  strokeWidth: 1,
  colors: {
    dark: {
      paper: '#18181b',
      ruledLine: 'rgba(255, 255, 255, 0.08)',
      ruledMarginLine: 'rgba(244, 63, 94, 0.3)',
      gridLine: 'rgba(255, 255, 255, 0.07)',
      dot: 'rgba(255, 255, 255, 0.22)'
    },
    light: {
      paper: '#ffffff',
      ruledLine: 'rgba(30, 41, 59, 0.12)',
      ruledMarginLine: 'rgba(239, 68, 68, 0.35)',
      gridLine: 'rgba(15, 23, 42, 0.08)',
      dot: 'rgba(15, 23, 42, 0.25)'
    }
  }
}

export function getBackgroundColors(theme: 'dark' | 'light'): BackgroundThemeColors {
  return BACKGROUND_CONFIG.colors[theme]
}
