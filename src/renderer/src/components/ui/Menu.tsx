import { useState, useRef, useEffect, useCallback, type ReactNode, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItemConfig {
  id?: string
  label: string
  icon?: LucideIcon
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  separator?: false
}

export interface MenuSeparatorConfig {
  separator: true
  label?: string
}

export type MenuItemType = MenuItemConfig | MenuSeparatorConfig

export interface MenuProps {
  trigger: (props: {
    isOpen: boolean
    toggle: () => void
    ref: React.RefObject<HTMLButtonElement | null>
  }) => ReactNode
  items: MenuItemType[]
  align?: 'left' | 'right'
  className?: string
  width?: number | string
}

export function Menu({
  trigger,
  items,
  align = 'right',
  className = '',
  width = 220
}: MenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const selectableIndices = items
    .map((item, idx) => (!item.separator && !item.disabled ? idx : -1))
    .filter((idx) => idx !== -1)

  const toggle = useCallback((): void => {
    setIsOpen((prev) => !prev)
    setActiveIndex(-1)
  }, [])

  const close = useCallback((): void => {
    setIsOpen(false)
    setActiveIndex(-1)
    triggerRef.current?.focus()
  }, [])

  // Close on outside click or blur
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent): void => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        close()
      }
    }

    const handleKeyDownWindow = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDownWindow, true)
    return (): void => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDownWindow, true)
    }
  }, [isOpen, close])

  // Focus active item
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.focus()
    }
  }, [isOpen, activeIndex])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextSelectable =
        selectableIndices.find((idx) => idx > activeIndex) ?? selectableIndices[0] ?? -1
      setActiveIndex(nextSelectable)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const reversed = [...selectableIndices].reverse()
      const prevSelectable = reversed.find((idx) => idx < activeIndex) ?? reversed[0] ?? -1
      setActiveIndex(prevSelectable)
    } else if (e.key === 'Home') {
      e.preventDefault()
      if (selectableIndices.length > 0) setActiveIndex(selectableIndices[0]!)
    } else if (e.key === 'End') {
      e.preventDefault()
      if (selectableIndices.length > 0)
        setActiveIndex(selectableIndices[selectableIndices.length - 1]!)
    } else if (e.key === 'Tab') {
      close()
    }
  }

  return (
    <div className={`ui-menu-container ${className}`} onKeyDown={handleKeyDown}>
      {trigger({ isOpen, toggle, ref: triggerRef })}

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`ui-menu-dropdown ui-menu-dropdown--${align}`}
          style={{ width }}
        >
          {items.map((item, idx) => {
            if (item.separator) {
              return (
                <div key={`sep-${idx}`} className="ui-menu-separator-wrapper" role="separator">
                  {item.label && <span className="ui-menu-group-label">{item.label}</span>}
                  <div className="ui-menu-separator" />
                </div>
              )
            }

            const Icon = item.icon
            return (
              <button
                key={item.id ?? `item-${idx}-${item.label}`}
                ref={(el): void => {
                  itemRefs.current[idx] = el
                }}
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                className={`ui-menu-item ${item.danger ? 'is-danger' : ''} ${
                  activeIndex === idx ? 'is-focused' : ''
                }`}
                onClick={(): void => {
                  item.onClick?.()
                  close()
                }}
              >
                {Icon && (
                  <span className="ui-menu-item-icon">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                )}
                <span className="ui-menu-item-label">{item.label}</span>
                {item.shortcut && <kbd className="ui-menu-item-kbd">{item.shortcut}</kbd>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
