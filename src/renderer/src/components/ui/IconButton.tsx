import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from './Tooltip'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  iconElement?: ReactNode
  label: string
  shortcut?: string
  variant?: 'ghost' | 'secondary' | 'surface' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon: Icon,
    iconElement,
    label,
    shortcut,
    variant = 'ghost',
    size = 'md',
    active = false,
    tooltipPlacement = 'bottom',
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      className={`ui-icon-btn ui-icon-btn--${variant} ui-icon-btn--${size} ${active ? 'is-active' : ''} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={18} strokeWidth={1.75} aria-hidden="true" /> : iconElement}
    </button>
  )

  if (!label) return button

  return (
    <Tooltip label={label} shortcut={shortcut} placement={tooltipPlacement}>
      {button}
    </Tooltip>
  )
})
