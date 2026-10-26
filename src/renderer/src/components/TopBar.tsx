import { useMemo } from 'react'
import {
  Search,
  Download,
  Sun,
  Moon,
  Laptop,
  MoreHorizontal,
  FilePlus,
  FolderOpen,
  Save,
  FileUp,
  FileInput,
  Layers,
  Sparkles,
  Keyboard,
  Info,
  Image,
  Code,
  FileText,
  FileCode
} from 'lucide-react'
import { NotebookTitle } from './NotebookTitle'
import { SaveStatus } from './SaveStatus'
import { IconButton, Menu, type MenuItemType } from './ui'
import { useTheme } from '../context/ThemeContext'
import { useNotebookStore } from '../store/notebookStore'

export interface TopBarProps {
  onSearch: () => void
  onExport: (format: 'png' | 'svg' | 'pdf' | 'excalidraw') => void
  onNewNotebook: () => void
  onOpenNotebook: () => void
  onSaveAsNotebook: () => void
  onImportAsNewPage: () => void
  onImportIntoCurrentPage: () => void
  onImportLibrary: () => void
  onOpenWelcome: () => void
  onOpenShortcuts: () => void
  onOpenAbout: () => void
}

export function TopBar({
  onSearch,
  onExport,
  onNewNotebook,
  onOpenNotebook,
  onSaveAsNotebook,
  onImportAsNewPage,
  onImportIntoCurrentPage,
  onImportLibrary,
  onOpenWelcome,
  onOpenShortcuts,
  onOpenAbout
}: TopBarProps): React.JSX.Element {
  const {
    theme,
    themePreference,
    setThemePreference,
    paperColorInDarkMode,
    setPaperColorInDarkMode
  } = useTheme()
  const isDirty = useNotebookStore((s) => s.isDirty)
  const isSaving = useNotebookStore((s) => s.isSaving)

  // Export menu items
  const exportItems: MenuItemType[] = useMemo(
    () => [
      {
        label: 'PNG Image…',
        icon: Image,
        shortcut: 'Ctrl+Shift+E',
        onClick: (): void => onExport('png')
      },
      {
        label: 'SVG Vector…',
        icon: Code,
        onClick: (): void => onExport('svg')
      },
      {
        label: 'PDF Notebook…',
        icon: FileText,
        onClick: (): void => onExport('pdf')
      },
      {
        separator: true
      },
      {
        label: 'Excalidraw (.excalidraw)…',
        icon: FileCode,
        onClick: (): void => onExport('excalidraw')
      }
    ],
    [onExport]
  )

  // Theme menu items
  const themeItems: MenuItemType[] = useMemo(
    () => [
      {
        label: `Light theme ${themePreference === 'light' ? '✓' : ''}`,
        icon: Sun,
        onClick: (): void => setThemePreference('light')
      },
      {
        label: `Dark theme ${themePreference === 'dark' ? '✓' : ''}`,
        icon: Moon,
        onClick: (): void => setThemePreference('dark')
      },
      {
        label: `System default ${themePreference === 'system' ? '✓' : ''}`,
        icon: Laptop,
        onClick: (): void => setThemePreference('system')
      },
      {
        separator: true,
        label: 'Paper in dark mode'
      },
      {
        label: `Dark paper ${paperColorInDarkMode === 'dark' ? '✓' : ''}`,
        icon: FileText,
        onClick: (): void => setPaperColorInDarkMode('dark')
      },
      {
        label: `Light paper (cream) ${paperColorInDarkMode === 'light' ? '✓' : ''}`,
        icon: FileText,
        onClick: (): void => setPaperColorInDarkMode('light')
      }
    ],
    [themePreference, paperColorInDarkMode, setThemePreference, setPaperColorInDarkMode]
  )

  // Overflow menu items
  const overflowItems: MenuItemType[] = useMemo(
    () => [
      {
        label: 'New notebook',
        icon: FilePlus,
        shortcut: 'Ctrl+N',
        onClick: onNewNotebook
      },
      {
        label: 'Open notebook…',
        icon: FolderOpen,
        shortcut: 'Ctrl+O',
        onClick: onOpenNotebook
      },
      {
        label: 'Save as…',
        icon: Save,
        shortcut: 'Ctrl+Shift+S',
        onClick: onSaveAsNotebook
      },
      {
        separator: true
      },
      {
        label: 'Import .excalidraw as new page…',
        icon: FileUp,
        onClick: onImportAsNewPage
      },
      {
        label: 'Import .excalidraw into this page…',
        icon: FileInput,
        onClick: onImportIntoCurrentPage
      },
      {
        label: 'Import component library…',
        icon: Layers,
        onClick: onImportLibrary
      },
      {
        separator: true
      },
      {
        label: 'Welcome screen',
        icon: Sparkles,
        onClick: onOpenWelcome
      },
      {
        label: 'Keyboard shortcuts',
        icon: Keyboard,
        shortcut: 'F1',
        onClick: onOpenShortcuts
      },
      {
        label: 'About InkBook',
        icon: Info,
        onClick: onOpenAbout
      }
    ],
    [
      onNewNotebook,
      onOpenNotebook,
      onSaveAsNotebook,
      onImportAsNewPage,
      onImportIntoCurrentPage,
      onImportLibrary,
      onOpenWelcome,
      onOpenShortcuts,
      onOpenAbout
    ]
  )

  const CurrentThemeIcon = themePreference === 'system' ? Laptop : theme === 'dark' ? Moon : Sun

  return (
    <header className="topbar">
      <div className="topbar-left">
        <NotebookTitle />
        <SaveStatus isSaving={isSaving} isDirty={isDirty} />
      </div>

      <div className="topbar-right">
        {/* Search */}
        <IconButton icon={Search} label="Search" shortcut="Ctrl+K" onClick={onSearch} />

        {/* Export Menu */}
        <Menu
          align="right"
          width={220}
          items={exportItems}
          trigger={({ toggle, ref, isOpen }): React.JSX.Element => (
            <IconButton
              ref={ref}
              icon={Download}
              label="Export"
              shortcut="Ctrl+E"
              active={isOpen}
              onClick={toggle}
            />
          )}
        />

        {/* Theme Menu */}
        <Menu
          align="right"
          width={180}
          items={themeItems}
          trigger={({ toggle, ref, isOpen }): React.JSX.Element => (
            <IconButton
              ref={ref}
              icon={CurrentThemeIcon}
              label="Theme"
              active={isOpen}
              onClick={toggle}
            />
          )}
        />

        {/* Overflow Menu */}
        <Menu
          align="right"
          width={260}
          items={overflowItems}
          trigger={({ toggle, ref, isOpen }): React.JSX.Element => (
            <IconButton
              ref={ref}
              icon={MoreHorizontal}
              label="More options"
              active={isOpen}
              onClick={toggle}
            />
          )}
        />
      </div>
    </header>
  )
}
