import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron'

let currentRecentNotebooks: string[] = []

function sendMenuAction(
  window: BrowserWindow | undefined,
  action: string,
  payload?: unknown
): void {
  const win = window ?? BrowserWindow.getFocusedWindow() ?? undefined
  win?.webContents.send('menu:action', action, payload)
}

export function updateMenuRecentNotebooks(recentNotebooks: string[]): void {
  currentRecentNotebooks = recentNotebooks
  setupApplicationMenu()
}

export function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const recentSubmenu: MenuItemConstructorOptions[] =
    currentRecentNotebooks.length === 0
      ? [{ label: 'No Recent Notebooks', enabled: false }]
      : [
          ...currentRecentNotebooks.map((filePath) => ({
            label: filePath,
            click: (_item: unknown, win: unknown): void => {
              sendMenuAction(win as BrowserWindow | undefined, 'open-recent', filePath)
            }
          })),
          { type: 'separator' as const },
          {
            label: 'Clear Recent Notebooks',
            click: (_item: unknown, win: unknown): void => {
              sendMenuAction(win as BrowserWindow | undefined, 'clear-recent')
            }
          }
        ]

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: '&File',
      submenu: [
        {
          label: 'New Notebook',
          accelerator: 'CmdOrCtrl+N',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'new-notebook')
          }
        },
        {
          label: 'Open Notebook...',
          accelerator: 'CmdOrCtrl+O',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'open-notebook')
          }
        },
        {
          label: 'Open Recent',
          submenu: recentSubmenu
        },
        {
          label: 'Welcome Screen',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'show-welcome')
          }
        },
        { type: 'separator' },
        {
          label: 'Save Notebook',
          accelerator: 'CmdOrCtrl+S',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'save-notebook')
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'save-as-notebook')
          }
        },
        { type: 'separator' },
        {
          label: 'Export Page as PNG...',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'export-png')
          }
        },
        {
          label: 'Export Page as SVG...',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'export-svg')
          }
        },
        {
          label: 'Export Page as .excalidraw...',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'export-excalidraw')
          }
        },
        { type: 'separator' },
        {
          label: 'Close Notebook',
          accelerator: 'CmdOrCtrl+W',
          click: (_item, win): void => {
            sendMenuAction(win as BrowserWindow | undefined, 'close-notebook')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: '&View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'Documentation',
          click: (): void => {
            // Placeholder for documentation
          }
        },
        {
          label: 'About InkBook',
          click: (): void => {
            // Placeholder for about dialog
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
