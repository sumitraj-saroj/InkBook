import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface TooltipProps {
  label: string
  shortcut?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}

export function Tooltip({
  label,
  shortcut,
  placement = 'bottom',
  children
}: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, 250)
  }

  const hideTooltip = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }

  useEffect(() => {
    return (): void => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const fullText = shortcut ? `${label} (${shortcut})` : label

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocusCapture={showTooltip}
      onBlurCapture={hideTooltip}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`ui-tooltip ui-tooltip--${placement}`}
          aria-hidden={!visible}
        >
          <span className="ui-tooltip-label">{label}</span>
          {shortcut && <kbd className="ui-tooltip-kbd">{shortcut}</kbd>}
          <span className="sr-only">{fullText}</span>
        </div>
      )}
    </div>
  )
}
