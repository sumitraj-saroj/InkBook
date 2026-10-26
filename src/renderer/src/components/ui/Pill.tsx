import { forwardRef, type HTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from './Tooltip'

export interface PillProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function Pill({ children, className = '', ...props }: PillProps): React.JSX.Element {
  return (
    <div className={`ui-pill ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  label?: string
  shortcut?: string
  tooltip?: string
  active?: boolean
  children?: ReactNode
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(function PillButton(
  {
    icon: Icon,
    label,
    shortcut,
    tooltip,
    active = false,
    children,
    className = '',
    disabled,
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  const effectiveLabel = label ?? tooltip ?? ''
  const displayTooltip =
    ariaLabel ?? (shortcut && effectiveLabel ? `${effectiveLabel} (${shortcut})` : effectiveLabel)

  const button = (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`ui-pill-btn ${active ? 'is-active' : ''} ${className}`}
      aria-label={displayTooltip}
      title={displayTooltip}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      {label && <span className="ui-pill-btn-label">{label}</span>}
      {children}
    </button>
  )

  if (!effectiveLabel) return button

  return (
    <Tooltip label={effectiveLabel} shortcut={shortcut} placement="top">
      {button}
    </Tooltip>
  )
})

export function PillDivider(): React.JSX.Element {
  return <div className="ui-pill-divider" role="separator" />
}
