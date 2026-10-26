import type { LucideIcon } from 'lucide-react'

export interface SegmentedOption<T extends string> {
  value: T
  label?: string
  icon?: LucideIcon
  title?: string
  ariaLabel?: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: 'sm' | 'md'
  className?: string
  name?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  className = '',
  name = 'segmented-control'
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`ui-segmented-control ui-segmented-control--${size} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value
        const Icon = opt.icon
        const tooltip = opt.title ?? opt.label ?? opt.value

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            title={tooltip}
            aria-label={opt.ariaLabel ?? tooltip}
            tabIndex={isSelected ? 0 : -1}
            className={`ui-segmented-option ${isSelected ? 'is-selected' : ''}`}
            onClick={(): void => onChange(opt.value)}
          >
            {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
            {opt.label && <span className="ui-segmented-label">{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
